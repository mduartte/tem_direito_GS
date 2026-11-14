package br.com.temdireito.triagem;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Json;
import br.com.temdireito.comum.Seguranca;
import br.com.temdireito.notificacao.*;
import br.com.temdireito.regras.*;
import br.com.temdireito.regras.servico.KitPassoEntityRepository;
import br.com.temdireito.regras.servico.RegraService;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Fluxo do cidadão: avaliar respostas, registrar a triagem anônima, acompanhar
 * o andamento e apagar tudo quando a família pedir.
 *
 * <p>O resultado é sempre recalculado no servidor com as regras publicadas;
 * o aparelho manda as respostas, nunca o resultado pronto, para ninguém
 * registrar benefício que o motor não daria.</p>
 */
@Service
public class TriagemService {

    /** Texto padrão de cada etapa, igual ao do painel do protótipo. */
    public static final Map<String, String> ETAPA_TXT = Map.of(
            "triagem", "Triagem concluída", "kit", "Kit do Direito enviado", "agendado", "Cadastro Único agendado",
            "atendido", "Atendido no CRAS", "conseguiu", "Benefício concedido", "travado", "Travado");

    private static final TypeReference<List<String>> LISTA = new TypeReference<>() { };
    private final SecureRandom aleatorio = new SecureRandom();

    private final MotorDeRegras motor;
    private final KitService kit;
    private final RegraService regras;
    private final KitPassoEntityRepository kitPassos;
    private final TriagemRepository triagens;
    private final TriagemEventoRepository eventos;
    private final TriagemBeneficioStatusRepository statusRepo;
    private final LembreteRepository lembretes;
    private final NotificacaoRepository notificacoes;
    private final Seguranca seguranca;
    private final Json json;

    public TriagemService(MotorDeRegras motor, KitService kit, RegraService regras, KitPassoEntityRepository kitPassos,
                          TriagemRepository triagens, TriagemEventoRepository eventos, TriagemBeneficioStatusRepository statusRepo,
                          LembreteRepository lembretes, NotificacaoRepository notificacoes, Seguranca seguranca, Json json) {
        this.motor = motor;
        this.kit = kit;
        this.regras = regras;
        this.kitPassos = kitPassos;
        this.triagens = triagens;
        this.eventos = eventos;
        this.statusRepo = statusRepo;
        this.lembretes = lembretes;
        this.notificacoes = notificacoes;
        this.seguranca = seguranca;
        this.json = json;
    }

    /** Resposta da avaliação: os 29 benefícios, o Kit e o salário mínimo usado. */
    public record Avaliacao(List<ResultadoBeneficio> resultado, List<PassoKit> kit, double salarioMinimo, String versoes) {
    }

    /** Roda o motor com as regras publicadas e monta o Kit com os documentos editados na gestão. */
    public Avaliacao avaliar(Respostas a) {
        Parametros p = regras.publicados();
        // Benefícios do Estado e da cidade de São Paulo só valem para quem mora lá.
        List<ResultadoBeneficio> res = br.com.temdireito.regras.servico.FiltroRegional.aplicar(motor.avaliar(a, p), a);
        Map<String, List<String>> docs = new HashMap<>(KitService.DOCS_PADRAO);
        kitPassos.findAll().forEach(k -> docs.put(k.id, json.ler(k.documentos, LISTA)));
        List<ResultadoBeneficio> ativos = res.stream().filter(ResultadoBeneficio::ativo).toList();
        return new Avaliacao(res, kit.montar(a, res, docs), p.sm(), regras.versoesUsadas(p, ativos));
    }

    /** Pedido para registrar a triagem anônima. */
    public record NovaTriagem(Respostas respostas, String canal, Boolean autorizou, Boolean consentimento) {
    }

    /** Código para mostrar à família e chave que só o aparelho guarda. */
    public record Registro(String codigo, String chave, String etapa, String etapaTexto) {
    }

    @Transactional
    public Registro registrar(NovaTriagem n, Long contaId) {
        if (n == null || n.respostas() == null) {
            throw ApiExceptionHandler.invalido("Respostas da triagem são obrigatórias.");
        }
        if (!Boolean.TRUE.equals(n.consentimento())) {
            // LGPD, art. 11: renda e saúde são dados sensíveis; sem consentimento destacado não guardamos nada.
            throw ApiExceptionHandler.invalido("É preciso aceitar o uso das respostas para registrar a triagem.");
        }
        Respostas a = n.respostas();
        Avaliacao av = avaliar(a);
        Triagem t = new Triagem();
        t.codigo = novoCodigo();
        String chave = seguranca.token();
        t.chaveHash = seguranca.hash(chave);
        t.criadaEm = LocalDateTime.now();
        t.atualizadaEm = t.criadaEm;
        t.bairro = a.bairro == null || a.bairro.isBlank() ? "Não informado" : a.bairro;
        t.cidade = a.cidade == null || a.cidade.isBlank() ? null : a.cidade.trim();
        t.uf = a.uf == null || a.uf.isBlank() ? null : a.uf.trim().toUpperCase();
        t.pessoas = Math.max(1, a.pessoas);
        double rpc = a.rendaPorPessoa();
        // Guardamos a renda por pessoa arredondada, nunca a renda exata da casa.
        t.rendaPc = BigDecimal.valueOf(Math.round(rpc)).setScale(2, RoundingMode.HALF_UP);
        t.beneficios = String.join(",", av.resultado().stream().filter(ResultadoBeneficio::ativo).map(b -> b.id).toList());
        t.etapa = "kit";
        t.etapaTexto = ETAPA_TXT.get("kit");
        t.autorizou = Boolean.TRUE.equals(n.autorizou());
        t.canal = n.canal() == null ? "App" : n.canal();
        t.regrasUsadas = av.versoes();
        t.contaId = contaId;
        t.demo = false;
        triagens.save(t);
        evento(t.codigo, "Triagem concluída", false);
        evento(t.codigo, "Kit do Direito enviado", false);
        return new Registro(t.codigo, chave, t.etapa, t.etapaTexto);
    }

    private String novoCodigo() {
        for (int i = 0; i < 50; i++) {
            String c = "T-" + (1000 + aleatorio.nextInt(9000));
            if (!triagens.existsById(c)) return c;
        }
        return "T-" + (10000 + aleatorio.nextInt(90000));
    }

    /** Confere a chave do aparelho; sem ela ninguém lê nem muda a triagem. */
    public Triagem autorizada(String codigo, String chave) {
        Triagem t = triagens.findById(codigo).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Triagem não encontrada."));
        if (chave == null || t.chaveHash == null || !t.chaveHash.equals(seguranca.hash(chave))) {
            throw ApiExceptionHandler.proibido("Chave da triagem inválida.");
        }
        return t;
    }

    public Map<String, Object> consultar(String codigo, String chave) {
        Triagem t = autorizada(codigo, chave);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("codigo", t.codigo);
        m.put("etapa", t.etapa);
        m.put("etapaTexto", t.etapaTexto);
        m.put("falta", t.falta);
        m.put("autorizou", t.autorizou);
        m.put("beneficios", t.beneficios == null || t.beneficios.isBlank() ? List.of() : List.of(t.beneficios.split(",")));
        m.put("eventos", eventos.findByTriagemCodigoOrderByDataHoraAsc(codigo));
        m.put("status", statusRepo.findByTriagemCodigo(codigo));
        m.put("lembretes", lembretes.findByTriagemCodigoOrderByDataIdaDesc(codigo));
        m.put("notificacoes", notificacoes.findByTriagemCodigoOrderByCriadaEmDesc(codigo));
        return m;
    }

    /** O que a família pode informar sobre o andamento. */
    public record Atualizacao(String etapa, String falta, Boolean autorizou, String beneficio, String situacao, String retorno) {
    }

    @Transactional
    public Map<String, Object> atualizar(String codigo, String chave, Atualizacao u) {
        Triagem t = autorizada(codigo, chave);
        if (u.autorizou() != null && !u.autorizou().equals(t.autorizou)) {
            t.autorizou = u.autorizou();
            evento(codigo, u.autorizou() ? "Família autorizou avisos do CRAS" : "Família retirou a autorização de avisos", false);
        }
        if (u.beneficio() != null && u.situacao() != null) {
            TriagemBeneficioStatus s = statusRepo.findByTriagemCodigoAndBeneficioId(codigo, u.beneficio()).orElseGet(TriagemBeneficioStatus::new);
            s.triagemCodigo = codigo;
            s.beneficioId = u.beneficio();
            s.situacao = u.situacao();
            s.atualizadoEm = LocalDateTime.now();
            statusRepo.save(s);
            if ("consegui".equals(u.situacao())) mudarEtapa(t, "conseguiu", null);
            if ("faltou".equals(u.situacao())) mudarEtapa(t, "travado", u.falta() == null ? "Documento" : u.falta());
        }
        if (u.retorno() != null) {
            // Resposta ao retorno de 7 ou 30 dias: "deu certo", "faltou" ou "nao fui".
            switch (u.retorno()) {
                case "deu-certo" -> {
                    mudarEtapa(t, "atendido", null);
                    evento(codigo, "Retorno: “fui e deu certo”", false);
                }
                case "faltou" -> {
                    String f = u.falta() == null || u.falta().isBlank() ? "Documento" : u.falta();
                    mudarEtapa(t, "travado", f);
                    evento(codigo, "Retorno: “faltou " + f.toLowerCase() + "”", true);
                }
                case "nao-fui" -> evento(codigo, "Retorno: “ainda não fui”", false);
                default -> throw ApiExceptionHandler.invalido("Retorno desconhecido.");
            }
        }
        if (u.etapa() != null) mudarEtapa(t, u.etapa(), u.falta());
        t.atualizadaEm = LocalDateTime.now();
        triagens.save(t);
        return consultar(codigo, chave);
    }

    /** Muda a etapa e o texto que o painel mostra. Usado também pelo painel do CRAS. */
    public void mudarEtapa(Triagem t, String etapa, String falta) {
        if (!ETAPA_TXT.containsKey(etapa)) throw ApiExceptionHandler.invalido("Etapa inválida: " + etapa);
        t.etapa = etapa;
        t.falta = "travado".equals(etapa) ? (falta == null ? t.falta : falta) : null;
        t.etapaTexto = "travado".equals(etapa) && t.falta != null ? "Aguardando: " + t.falta.toLowerCase() : ETAPA_TXT.get(etapa);
        if ("conseguiu".equals(etapa)) evento(t.codigo, "Benefício concedido", false);
    }

    /** Pedido de lembrete da véspera. */
    public record NovoLembrete(LocalDate data, String canal, String localNome, String localEndereco, List<String> documentos) {
    }

    @Transactional
    public Lembrete criarLembrete(String codigo, String chave, NovoLembrete n) {
        Triagem t = autorizada(codigo, chave);
        if (n.data() == null || n.data().isBefore(LocalDate.now())) {
            throw ApiExceptionHandler.invalido("Escolha um dia de hoje em diante.");
        }
        Lembrete l = new Lembrete();
        l.triagemCodigo = codigo;
        l.dataIda = n.data();
        l.canal = n.canal() == null ? "app" : n.canal();
        l.localNome = n.localNome();
        l.localEndereco = n.localEndereco();
        l.documentos = n.documentos() == null ? null : String.join("; ", n.documentos().stream().limit(4).toList());
        l.criadoEm = LocalDateTime.now();
        lembretes.save(l);
        if ("kit".equals(t.etapa) || "triagem".equals(t.etapa)) mudarEtapa(t, "agendado", null);
        t.atualizadaEm = LocalDateTime.now();
        triagens.save(t);
        evento(codigo, "Lembrete marcado", false);
        return l;
    }

    @Transactional
    public void marcarLida(String codigo, String chave, Long id) {
        autorizada(codigo, chave);
        notificacoes.findById(id).filter(n -> codigo.equals(n.triagemCodigo)).ifPresent(n -> {
            n.lidaEm = LocalDateTime.now();
            notificacoes.save(n);
        });
    }

    /** Apaga de verdade a triagem e tudo ligado a ela (LGPD: direito de eliminação). */
    @Transactional
    public void apagar(String codigo, String chave) {
        autorizada(codigo, chave);
        apagarTudo(codigo);
    }

    @Transactional
    public void apagarTudo(String codigo) {
        eventos.deleteByTriagemCodigo(codigo);
        statusRepo.deleteByTriagemCodigo(codigo);
        lembretes.deleteByTriagemCodigo(codigo);
        notificacoes.deleteByTriagemCodigo(codigo);
        triagens.deleteById(codigo);
    }

    public void evento(String codigo, String texto, boolean alerta) {
        TriagemEvento e = new TriagemEvento();
        e.triagemCodigo = codigo;
        e.texto = texto;
        e.alerta = alerta;
        e.dataHora = LocalDateTime.now();
        eventos.save(e);
    }
}
