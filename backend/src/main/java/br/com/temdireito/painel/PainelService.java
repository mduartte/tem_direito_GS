package br.com.temdireito.painel;

import br.com.temdireito.atendimento.Bairro;
import br.com.temdireito.atendimento.BairroRepository;
import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.conta.ContaCidadaoRepository;
import br.com.temdireito.comum.Seguranca;
import br.com.temdireito.notificacao.Notificacao;
import br.com.temdireito.notificacao.NotificacaoRepository;
import br.com.temdireito.notificacao.SmsGateway;
import br.com.temdireito.regras.Parametros;
import br.com.temdireito.regras.servico.RegraService;
import br.com.temdireito.triagem.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Predicate;

/**
 * Números da busca ativa para o painel do CRAS (telas B2 a B6).
 *
 * <p>Tudo aqui é anônimo: o painel vê código, bairro, tamanho da família,
 * renda por pessoa arredondada, benefícios e etapa. A lógica das métricas é a
 * mesma do protótipo ({@code metricas()} e {@code filtrar()}), para o painel
 * mostrar os mesmos números da demonstração.</p>
 */
@Service
public class PainelService {

    public static final List<String> ENCAMINHADAS = List.of("agendado", "atendido", "conseguiu", "travado");
    private final TriagemRepository triagens;
    private final TriagemEventoRepository eventos;
    private final TriagemBeneficioStatusRepository statusRepo;
    private final TriagemService triagemService;
    private final BairroRepository bairros;
    private final NotificacaoRepository notificacoes;
    private final ContaCidadaoRepository contas;
    private final UnidadeRepository unidades;
    private final RegraService regras;
    private final SmsGateway sms;
    private final Seguranca seguranca;

    public PainelService(TriagemRepository triagens, TriagemEventoRepository eventos, TriagemBeneficioStatusRepository statusRepo,
                         TriagemService triagemService, BairroRepository bairros, NotificacaoRepository notificacoes,
                         ContaCidadaoRepository contas, UnidadeRepository unidades, RegraService regras, SmsGateway sms, Seguranca seguranca) {
        this.triagens = triagens;
        this.eventos = eventos;
        this.statusRepo = statusRepo;
        this.triagemService = triagemService;
        this.bairros = bairros;
        this.notificacoes = notificacoes;
        this.contas = contas;
        this.unidades = unidades;
        this.regras = regras;
        this.sms = sms;
        this.seguranca = seguranca;
    }

    /** Filtros do topo do painel. {@code per}: "30" (últimos 30 dias) ou "60" (8 semanas). */
    public record Filtro(String bairro, String ben, String per, String etapa, String q) {
    }

    public List<Triagem> filtrar(Filtro f, boolean ignorarPeriodo) {
        LocalDate hoje = LocalDate.now();
        LocalDateTime lim = ("60".equals(f.per()) ? hoje.minusDays(55) : hoje.minusDays(27)).atStartOfDay();
        Predicate<Triagem> p = t -> (ignorarPeriodo || !t.criadaEm.isBefore(lim))
                && (vazio(f.bairro()) || f.bairro().equals(t.bairro))
                && (vazio(f.ben()) || beneficios(t).contains(f.ben()))
                && (vazio(f.etapa()) || f.etapa().equals(t.etapa) || ("encaminhadas".equals(f.etapa()) && ENCAMINHADAS.contains(t.etapa)))
                && (vazio(f.q()) || t.codigo.equalsIgnoreCase(f.q().trim()) || t.codigo.equalsIgnoreCase("T-" + f.q().trim()));
        return triagens.findAllByOrderByCriadaEmDesc().stream().filter(p).toList();
    }

    private static boolean vazio(String s) {
        return s == null || s.isBlank();
    }

    public static List<String> beneficios(Triagem t) {
        return t.beneficios == null || t.beneficios.isBlank() ? List.of() : List.of(t.beneficios.split(","));
    }

    /** Port de metricas() do protótipo. */
    public Map<String, Object> metricas(List<Triagem> lista) {
        Parametros p = regras.publicados();
        double sm = p.sm(), bolsaBase = p.num("bolsa", "base");
        int kit = 0, enc = 0, atd = 0, cons = 0, trav = 0, agd = 0;
        double valor = 0;
        Map<String, Integer> falta = new LinkedHashMap<>(), ben = new LinkedHashMap<>(), bairro = new LinkedHashMap<>();
        for (Triagem t : lista) {
            List<String> b = beneficios(t);
            if (!"triagem".equals(t.etapa)) kit++;
            if (ENCAMINHADAS.contains(t.etapa)) enc++;
            if ("atendido".equals(t.etapa) || "conseguiu".equals(t.etapa)) atd++;
            if ("conseguiu".equals(t.etapa)) {
                cons++;
                valor += b.contains("bpci") || b.contains("bpcp") ? sm * 12 : b.contains("bolsa") ? bolsaBase * 12 : b.contains("tar") ? 60 * 12 : 45 * 12;
            }
            if ("travado".equals(t.etapa)) {
                trav++;
                falta.merge(t.falta == null ? "Outro" : t.falta, 1, Integer::sum);
            }
            if ("agendado".equals(t.etapa)) agd++;
            b.forEach(x -> ben.merge(x, 1, Integer::sum));
            bairro.merge(t.bairro, 1, Integer::sum);
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tri", lista.size());
        m.put("kit", kit);
        m.put("enc", enc);
        m.put("atd", atd);
        m.put("cons", cons);
        m.put("trav", trav);
        m.put("agd", agd);
        m.put("valor", valor);
        m.put("falta", falta);
        m.put("ben", ben);
        m.put("bairro", bairro);
        return m;
    }

    /** Visão geral (B2): métricas do período, do período anterior e as 8 semanas do gráfico. */
    public Map<String, Object> visaoGeral(Filtro f) {
        List<Triagem> todas = filtrar(new Filtro(f.bairro(), f.ben(), f.per(), null, null), true);
        LocalDate hoje = LocalDate.now();
        int dias = "60".equals(f.per()) ? 56 : 28;
        LocalDateTime ini = hoje.minusDays(dias - 1L).atStartOfDay(), iniAnt = hoje.minusDays(2L * dias - 1).atStartOfDay();
        List<Triagem> atual = todas.stream().filter(t -> !t.criadaEm.isBefore(ini)).toList();
        List<Triagem> anterior = todas.stream().filter(t -> !t.criadaEm.isBefore(iniAnt) && t.criadaEm.isBefore(ini)).toList();
        List<Map<String, Object>> semanas = new ArrayList<>();
        for (int w = 7; w >= 0; w--) {
            LocalDateTime de = hoje.minusDays(w * 7L + 6).atStartOfDay(), ate = hoje.minusDays(w * 7L).plusDays(1).atStartOfDay();
            List<Triagem> s = todas.stream().filter(t -> !t.criadaEm.isBefore(de) && t.criadaEm.isBefore(ate)).toList();
            semanas.add(Map.of("inicio", de.toLocalDate(), "triagens", s.size(),
                    "encaminhadas", s.stream().filter(t -> ENCAMINHADAS.contains(t.etapa)).count()));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("atual", metricas(atual));
        out.put("anterior", metricas(anterior));
        out.put("semanas", semanas);
        out.put("recentes", atual.stream().limit(6).map(this::linha).toList());
        out.put("avisosHoje", notificacoes.countByCriadaEmAfter(hoje.atStartOfDay()));
        return out;
    }

    /** Mapa de demanda (B3): por bairro, com ponto central e famílias no Cadastro Único. */
    public List<Map<String, Object>> mapa(Filtro f) {
        List<Triagem> lista = filtrar(f, false);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Bairro b : bairros.findAll()) {
            List<Triagem> doBairro = lista.stream().filter(t -> b.nome.equals(t.bairro)).toList();
            Map<String, Object> m = new LinkedHashMap<>(metricas(doBairro));
            m.put("nome", b.nome);
            m.put("lat", b.lat);
            m.put("lng", b.lng);
            m.put("familiasCad", b.familiasCad);
            out.add(m);
        }
        return out;
    }

    /** Linha anônima da lista de encaminhamentos (B4). */
    public Map<String, Object> linha(Triagem t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("codigo", t.codigo);
        m.put("criadaEm", t.criadaEm);
        m.put("bairro", t.bairro);
        m.put("pessoas", t.pessoas);
        m.put("rendaPc", t.rendaPc);
        m.put("beneficios", beneficios(t));
        m.put("etapa", t.etapa);
        m.put("etapaTexto", t.etapaTexto);
        m.put("falta", t.falta);
        m.put("autorizou", t.autorizou);
        m.put("canal", t.canal);
        m.put("demo", t.demo);
        return m;
    }

    public List<Map<String, Object>> encaminhamentos(Filtro f) {
        return filtrar(f, false).stream().limit(500).map(this::linha).toList();
    }

    /** Detalhe (B5): linha do tempo, versões de regra usadas e observação interna. */
    public Map<String, Object> detalhe(String codigo) {
        Triagem t = triagens.findById(codigo).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Triagem não encontrada."));
        Map<String, Object> m = new LinkedHashMap<>(linha(t));
        m.put("regrasUsadas", t.regrasUsadas);
        m.put("obs", t.obsCras);
        m.put("eventos", eventos.findByTriagemCodigoOrderByDataHoraAsc(codigo));
        m.put("status", statusRepo.findByTriagemCodigo(codigo));
        m.put("notificacoes", notificacoes.findByTriagemCodigoOrderByCriadaEmDesc(codigo));
        return m;
    }

    public record Mudanca(String etapa, String falta, String obs) {
    }

    @Transactional
    public Map<String, Object> atualizar(String codigo, Mudanca mud, String quem) {
        Triagem t = triagens.findById(codigo).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Triagem não encontrada."));
        if (mud.etapa() != null && !mud.etapa().equals(t.etapa)) {
            triagemService.mudarEtapa(t, mud.etapa(), mud.falta());
            triagemService.evento(codigo, "CRAS: " + t.etapaTexto + " (" + quem + ")", "travado".equals(t.etapa));
        } else if (mud.falta() != null && "travado".equals(t.etapa)) {
            triagemService.mudarEtapa(t, "travado", mud.falta());
        }
        if (mud.obs() != null) t.obsCras = mud.obs().isBlank() ? null : mud.obs().trim();
        t.atualizadaEm = LocalDateTime.now();
        triagens.save(t);
        return detalhe(codigo);
    }

    /** Aviso do CRAS para a família. Só sai se ela autorizou (regra de consentimento). */
    @Transactional
    public Map<String, Object> avisar(String codigo, String texto, String quem) {
        Triagem t = triagens.findById(codigo).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Triagem não encontrada."));
        if (!Boolean.TRUE.equals(t.autorizou)) {
            throw ApiExceptionHandler.proibido("A família não autorizou avisos pelo app.");
        }
        String msg = texto == null || texto.isBlank()
                ? unidades.findById(1L).map(u -> u.mensagemRetorno).filter(s -> s != null && !s.isBlank())
                    .orElse("O CRAS pediu para você voltar. Leve os documentos do seu Kit do Direito.")
                : texto.trim();
        Notificacao n = new Notificacao();
        n.triagemCodigo = codigo;
        n.tipo = "AVISO_CRAS";
        n.texto = msg;
        n.canal = "app";
        n.criadaEm = LocalDateTime.now();
        notificacoes.save(n);
        if (t.contaId != null) {
            contas.findById(t.contaId).filter(c -> Boolean.TRUE.equals(c.avisoCras)).ifPresent(c -> {
                sms.enviar("+55" + seguranca.decifrar(c.telefoneCifrado), "Tem Direito: " + msg);
                n.canal = "ambos";
                notificacoes.save(n);
            });
        }
        triagemService.evento(codigo, "Aviso do CRAS enviado (" + quem + ")", false);
        return detalhe(codigo);
    }

    /** Relatório (B6) em CSV, só com números agregados por bairro: nenhuma linha individual sai do painel. */
    public String relatorioCsv(Filtro f) {
        StringBuilder sb = new StringBuilder("﻿bairro;triagens;kit;encaminhadas;atendidas;conseguiram;travadas;valor_estimado_ano\n");
        for (Map<String, Object> b : mapa(f)) {
            sb.append(b.get("nome")).append(';').append(b.get("tri")).append(';').append(b.get("kit")).append(';')
                    .append(b.get("enc")).append(';').append(b.get("atd")).append(';').append(b.get("cons")).append(';')
                    .append(b.get("trav")).append(';').append(String.format(Locale.ROOT, "%.2f", (Double) b.get("valor"))).append('\n');
        }
        return sb.toString();
    }

    /** Dias desde a triagem; usado pelas automações de retorno. */
    public static long dias(Triagem t) {
        return ChronoUnit.DAYS.between(t.criadaEm.toLocalDate(), LocalDate.now());
    }
}
