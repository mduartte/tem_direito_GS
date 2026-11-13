package br.com.temdireito.painel;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Json;
import br.com.temdireito.comum.Seguranca;
import com.fasterxml.jackson.core.type.TypeReference;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Configuração da unidade (telas E1 a E4): dados do CRAS, horários,
 * território, serviços, equipe e preferências (retenção, resumo semanal).
 *
 * <p>Ler é aberto à equipe; alterar é da coordenação. O pedido de acesso
 * (E1) é público, porque vem de quem ainda não tem conta.</p>
 */
@RestController
@Tag(name = "Configuração da unidade")
public class ConfigController {

    private static final TypeReference<Object> QUALQUER = new TypeReference<>() { };
    private final UnidadeRepository unidades;
    private final UsuarioPainelRepository usuarios;
    private final SolicitacaoAcessoRepository solicitacoes;
    private final PasswordEncoder encoder;
    private final Seguranca seguranca;
    private final Json json;

    public ConfigController(UnidadeRepository unidades, UsuarioPainelRepository usuarios, SolicitacaoAcessoRepository solicitacoes,
                            PasswordEncoder encoder, Seguranca seguranca, Json json) {
        this.unidades = unidades;
        this.usuarios = usuarios;
        this.solicitacoes = solicitacoes;
        this.encoder = encoder;
        this.seguranca = seguranca;
        this.json = json;
    }

    private Unidade unidade() {
        return unidades.findById(1L).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Unidade não configurada."));
    }

    private Map<String, Object> dto(Unidade u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nome", u.nome);
        m.put("telefone", u.telefone);
        m.put("endereco", u.endereco);
        m.put("semAgendamento", u.semAgendamento);
        m.put("horarios", u.horarios == null ? List.of() : json.ler(u.horarios, QUALQUER));
        m.put("territorio", u.territorio == null ? List.of() : json.ler(u.territorio, QUALQUER));
        m.put("servicos", u.servicos == null ? List.of() : json.ler(u.servicos, QUALQUER));
        m.put("mensagemRetorno", u.mensagemRetorno);
        m.put("retencaoDias", u.retencaoDias);
        m.put("resumoSemanal", u.resumoSemanal);
        m.put("configurada", u.configurada);
        return m;
    }

    @GetMapping("/api/config/unidade")
    public Map<String, Object> ler() {
        return dto(unidade());
    }

    @PutMapping("/api/config/unidade")
    @Operation(summary = "Salva dados, horários, território, serviços e preferências da unidade")
    public Map<String, Object> salvar(@RequestBody Map<String, Object> d) {
        Unidade u = unidade();
        if (d.containsKey("nome")) u.nome = String.valueOf(d.get("nome"));
        if (d.containsKey("telefone")) u.telefone = (String) d.get("telefone");
        if (d.containsKey("endereco")) u.endereco = (String) d.get("endereco");
        if (d.containsKey("semAgendamento")) u.semAgendamento = Boolean.TRUE.equals(d.get("semAgendamento"));
        if (d.containsKey("horarios")) u.horarios = json.escrever(d.get("horarios"));
        if (d.containsKey("territorio")) u.territorio = json.escrever(d.get("territorio"));
        if (d.containsKey("servicos")) u.servicos = json.escrever(d.get("servicos"));
        if (d.containsKey("mensagemRetorno")) u.mensagemRetorno = (String) d.get("mensagemRetorno");
        if (d.containsKey("retencaoDias")) {
            int dias = ((Number) d.get("retencaoDias")).intValue();
            if (dias < 30 || dias > 365) throw ApiExceptionHandler.invalido("A retenção deve ficar entre 30 e 365 dias.");
            u.retencaoDias = dias;
        }
        if (d.containsKey("resumoSemanal")) u.resumoSemanal = Boolean.TRUE.equals(d.get("resumoSemanal"));
        u.configurada = true;
        return dto(unidades.save(u));
    }

    @GetMapping("/api/config/equipe")
    public List<Map<String, Object>> equipe() {
        return usuarios.findAllByOrderByNomeAsc().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.id);
            m.put("nome", u.nome);
            m.put("email", u.email);
            m.put("perfil", u.perfil);
            m.put("perfilTexto", PainelAuthController.PERFIL_TXT.get(u.perfil));
            m.put("situacao", u.situacao);
            return m;
        }).toList();
    }

    public record Convite(String email, String nome, String perfil) {
    }

    @PostMapping("/api/config/equipe")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Convida alguém da equipe; em desenvolvimento, devolve a senha provisória")
    public Map<String, Object> convidar(@RequestBody Convite c) {
        if (c.email() == null || !c.email().contains("@")) throw ApiExceptionHandler.invalido("Informe um e-mail válido.");
        if (!PainelAuthController.PERFIL_TXT.containsKey(c.perfil())) throw ApiExceptionHandler.invalido("Perfil inválido.");
        if (usuarios.findByEmailIgnoreCase(c.email().trim()).isPresent()) throw ApiExceptionHandler.invalido("Essa pessoa já está na equipe.");
        UsuarioPainel u = new UsuarioPainel();
        u.email = c.email().trim().toLowerCase();
        u.nome = c.nome() == null || c.nome().isBlank() ? u.email.substring(0, u.email.indexOf('@')) : c.nome().trim();
        u.perfil = c.perfil();
        String provisoria = seguranca.token().substring(0, 10);
        u.senhaHash = encoder.encode(provisoria);
        u.situacao = "ATIVO";
        u.unidadeId = 1L;
        u.criadoEm = LocalDateTime.now();
        usuarios.save(u);
        return Map.of("id", u.id, "email", u.email, "senhaProvisoria", provisoria);
    }

    public record Perfil(String perfil, String situacao) {
    }

    @PatchMapping("/api/config/equipe/{id}")
    public Map<String, Object> alterar(@PathVariable Long id, @RequestBody Perfil p) {
        UsuarioPainel u = usuarios.findById(id).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Pessoa não encontrada."));
        if (p.perfil() != null) {
            if (!PainelAuthController.PERFIL_TXT.containsKey(p.perfil())) throw ApiExceptionHandler.invalido("Perfil inválido.");
            u.perfil = p.perfil();
        }
        if (p.situacao() != null) u.situacao = p.situacao();
        usuarios.save(u);
        return Map.of("id", u.id, "perfil", u.perfil, "situacao", u.situacao);
    }

    public record Pedido(String tipoOrg, String nomeOrg, String cnpj, String municipio, String responsavel, String cargo,
                         String email, String telefone) {
    }

    @PostMapping("/api/acesso/solicitar")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Pedido de acesso de uma organização (E1)")
    public Map<String, Object> solicitar(@RequestBody Pedido p) {
        if (p.nomeOrg() == null || p.nomeOrg().isBlank() || p.email() == null || !p.email().contains("@") || p.responsavel() == null) {
            throw ApiExceptionHandler.invalido("Preencha organização, responsável e e-mail.");
        }
        SolicitacaoAcesso s = new SolicitacaoAcesso();
        s.tipoOrg = p.tipoOrg();
        s.nomeOrg = p.nomeOrg();
        s.cnpj = p.cnpj();
        s.municipio = p.municipio();
        s.responsavel = p.responsavel();
        s.cargo = p.cargo();
        s.email = p.email();
        s.telefone = p.telefone();
        s.situacao = "NOVA";
        s.criadaEm = LocalDateTime.now();
        solicitacoes.save(s);
        return Map.of("protocolo", "AC-" + (1000 + s.id), "situacao", s.situacao);
    }

    @GetMapping("/api/config/solicitacoes")
    public List<SolicitacaoAcesso> solicitacoes() {
        return solicitacoes.findAllByOrderByCriadaEmDesc();
    }
}
