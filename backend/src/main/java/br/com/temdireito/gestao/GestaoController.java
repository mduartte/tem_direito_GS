package br.com.temdireito.gestao;

import br.com.temdireito.atendimento.PontoAtendimento;
import br.com.temdireito.atendimento.PontoAtendimentoRepository;
import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Json;
import br.com.temdireito.regras.*;
import br.com.temdireito.regras.servico.*;
import com.fasterxml.jackson.core.type.TypeReference;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Gestão das regras (telas C1 a C6): catálogo de benefícios, editor de
 * regras, simulador com os casos de teste, publicação com revisão,
 * histórico, documentos do Kit e pontos de atendimento.
 *
 * <p>Ler e simular é aberto a toda a equipe; gravar e publicar é só do
 * perfil GESTOR (ver SecurityConfig).</p>
 */
@RestController
@RequestMapping("/api/gestao")
@Tag(name = "Gestão de regras")
public class GestaoController {

    private static final TypeReference<List<String>> LISTA = new TypeReference<>() { };
    private final BeneficioEntityRepository beneficios;
    private final RegraService regras;
    private final MotorDeRegras motor;
    private final KitService kit;
    private final KitPassoEntityRepository kitPassos;
    private final PontoAtendimentoRepository pontos;
    private final Json json;

    public GestaoController(BeneficioEntityRepository beneficios, RegraService regras, MotorDeRegras motor, KitService kit,
                            KitPassoEntityRepository kitPassos, PontoAtendimentoRepository pontos, Json json) {
        this.beneficios = beneficios;
        this.regras = regras;
        this.motor = motor;
        this.kit = kit;
        this.kitPassos = kitPassos;
        this.pontos = pontos;
        this.json = json;
    }

    @GetMapping("/beneficios")
    public List<BeneficioEntity> beneficios() {
        return beneficios.findAllByOrderByOrdemAsc();
    }

    public record Ativo(Boolean ativo) {
    }

    @PatchMapping("/beneficios/{id}")
    @Operation(summary = "Liga ou desliga a orientação de um benefício nesta unidade")
    public BeneficioEntity ativar(@PathVariable String id, @RequestBody Ativo a) {
        BeneficioEntity b = beneficios.findById(id).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Benefício não encontrado."));
        b.ativoUnidade = Boolean.TRUE.equals(a.ativo());
        return beneficios.save(b);
    }

    @GetMapping("/regras")
    public List<Map<String, Object>> regras() {
        return regras.listar();
    }

    @PutMapping("/regras/{chave}/rascunho")
    @Operation(summary = "Salva o rascunho de uma regra (ainda não vale para o cidadão)")
    public Map<String, Object> rascunho(@PathVariable String chave, @RequestBody Map<String, Object> campos, Authentication auth) {
        RegraVersao r = regras.salvarRascunho(chave, campos, nome(auth));
        return Map.of("chave", r.chave, "versao", r.versao, "situacao", r.situacao);
    }

    @DeleteMapping("/regras/{chave}/rascunho")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void descartar(@PathVariable String chave) {
        regras.descartar(chave);
    }

    /** Pedido do simulador: respostas de uma família e rascunhos opcionais. */
    public record Simulacao(Respostas respostas, Map<String, Map<String, Object>> rascunhos) {
    }

    @PostMapping("/simular")
    @Operation(summary = "Simula uma família com as regras publicadas e os rascunhos, e roda os 10 casos de teste")
    public Map<String, Object> simular(@RequestBody Simulacao s) {
        Parametros pub = regras.publicados();
        Parametros rasc = regras.comRascunhos(s.rascunhos());
        Map<String, Object> out = new LinkedHashMap<>();
        if (s.respostas() != null) {
            List<ResultadoBeneficio> antes = motor.avaliar(s.respostas(), pub), depois = motor.avaliar(s.respostas(), rasc);
            out.put("publicado", antes);
            out.put("rascunho", depois);
            out.put("kit", kit.montar(s.respostas(), depois));
        }
        out.put("casos", CasosDeTeste.rodar(motor, rasc));
        return out;
    }

    public record Publicacao(String revisor, String motivo) {
    }

    @PostMapping("/regras/{chave}/publicar")
    @Operation(summary = "Publica o rascunho: exige casos de teste passando e revisão de assistente social")
    public HistoricoRegra publicar(@PathVariable String chave, @RequestBody Publicacao p, Authentication auth) {
        return regras.publicar(chave, nome(auth), p.revisor(), p.motivo());
    }

    @GetMapping("/historico")
    public List<HistoricoRegra> historico() {
        return regras.historico();
    }

    @GetMapping("/documentos")
    @Operation(summary = "Documentos-base de cada passo do Kit do Direito (C3)")
    public List<Map<String, Object>> documentos() {
        Map<String, KitPassoEntity> salvos = new HashMap<>();
        kitPassos.findAll().forEach(k -> salvos.put(k.id, k));
        List<Map<String, Object>> out = new ArrayList<>();
        KitService.DOCS_PADRAO.keySet().stream().sorted(Comparator.comparingInt(List.of("cras", "inss", "luz", "mae", "casa")::indexOf)).forEach(id -> {
            KitPassoEntity k = salvos.get(id);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("titulo", k == null ? id : k.titulo);
            m.put("onde", k == null ? null : k.onde);
            m.put("documentos", k == null ? KitService.DOCS_PADRAO.get(id) : json.ler(k.documentos, LISTA));
            m.put("atualizadoEm", k == null ? null : k.atualizadoEm);
            m.put("atualizadoPor", k == null ? null : k.atualizadoPor);
            out.add(m);
        });
        return out;
    }

    public record Documentos(String titulo, String onde, List<String> documentos) {
    }

    @PutMapping("/documentos/{id}")
    public Map<String, Object> salvarDocumentos(@PathVariable String id, @RequestBody Documentos d, Authentication auth) {
        if (!KitService.DOCS_PADRAO.containsKey(id)) throw ApiExceptionHandler.naoEncontrado("Passo não encontrado.");
        if (d.documentos() == null || d.documentos().isEmpty()) throw ApiExceptionHandler.invalido("Informe pelo menos um documento.");
        KitPassoEntity k = kitPassos.findById(id).orElseGet(KitPassoEntity::new);
        k.id = id;
        if (d.titulo() != null) k.titulo = d.titulo();
        if (k.titulo == null) k.titulo = id;
        k.onde = d.onde();
        k.documentos = json.escrever(d.documentos().stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
        k.atualizadoEm = LocalDateTime.now();
        k.atualizadoPor = nome(auth);
        kitPassos.save(k);
        return documentos().stream().filter(m -> id.equals(m.get("id"))).findFirst().orElseThrow();
    }

    @GetMapping("/pontos")
    public List<PontoAtendimento> pontos() {
        return pontos.findAll();
    }

    @PutMapping("/pontos/{id}")
    @Operation(summary = "Cria ou altera um ponto de atendimento")
    public PontoAtendimento salvarPonto(@PathVariable String id, @RequestBody PontoAtendimento p) {
        if (p.nome == null || p.nome.isBlank() || p.tipo == null) throw ApiExceptionHandler.invalido("Nome e tipo são obrigatórios.");
        p.id = id;
        if (p.ativo == null) p.ativo = true;
        return pontos.save(p);
    }

    @DeleteMapping("/pontos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerPonto(@PathVariable String id) {
        pontos.deleteById(id);
    }

    static String nome(Authentication auth) {
        if (auth != null && auth.getCredentials() instanceof Claims c && c.get("nome") != null) return String.valueOf(c.get("nome"));
        return "equipe";
    }
}
