package br.com.temdireito.automacao;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Seguranca;
import br.com.temdireito.conta.ContaCidadaoRepository;
import br.com.temdireito.notificacao.*;
import br.com.temdireito.painel.PainelService;
import br.com.temdireito.painel.UnidadeRepository;
import br.com.temdireito.triagem.Triagem;
import br.com.temdireito.triagem.TriagemRepository;
import br.com.temdireito.triagem.TriagemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Automações do Tem Direito. Cada uma roda no horário dela e também pode ser
 * disparada pelo painel (botão "Executar agora", para demonstração).
 *
 * <ul>
 *   <li><b>lembretes</b> — 19h: aviso na véspera do dia marcado, com o local e os documentos.</li>
 *   <li><b>retornos</b> — 10h: pergunta "deu certo?" 7 e 30 dias depois da triagem.</li>
 *   <li><b>expurgo</b> — 3h: apaga triagens mais velhas que a retenção (LGPD) e guarda só números por bairro.</li>
 *   <li><b>resumo</b> — segunda, 8h: resumo semanal da busca ativa para a coordenação.</li>
 * </ul>
 * Toda execução fica registrada em {@code execucao_tarefa}.
 */
@Service
public class AutomacaoService {

    private static final Logger log = LoggerFactory.getLogger(AutomacaoService.class);
    public static final List<String> TAREFAS = List.of("lembretes", "retornos", "expurgo", "resumo");

    private final LembreteRepository lembretes;
    private final NotificacaoRepository notificacoes;
    private final TriagemRepository triagens;
    private final TriagemService triagemService;
    private final ContaCidadaoRepository contas;
    private final UnidadeRepository unidades;
    private final AgregadoDiarioRepository agregados;
    private final ExecucaoTarefaRepository execucoes;
    private final PainelService painel;
    private final SmsGateway sms;
    private final Seguranca seguranca;

    public AutomacaoService(LembreteRepository lembretes, NotificacaoRepository notificacoes, TriagemRepository triagens,
                            TriagemService triagemService, ContaCidadaoRepository contas, UnidadeRepository unidades,
                            AgregadoDiarioRepository agregados, ExecucaoTarefaRepository execucoes, PainelService painel,
                            SmsGateway sms, Seguranca seguranca) {
        this.lembretes = lembretes;
        this.notificacoes = notificacoes;
        this.triagens = triagens;
        this.triagemService = triagemService;
        this.contas = contas;
        this.unidades = unidades;
        this.agregados = agregados;
        this.execucoes = execucoes;
        this.painel = painel;
        this.sms = sms;
        this.seguranca = seguranca;
    }

    @Scheduled(cron = "0 0 19 * * *", zone = "America/Sao_Paulo")
    public void agendadoLembretes() {
        executar("lembretes", false);
    }

    @Scheduled(cron = "0 0 10 * * *", zone = "America/Sao_Paulo")
    public void agendadoRetornos() {
        executar("retornos", false);
    }

    @Scheduled(cron = "0 0 3 * * *", zone = "America/Sao_Paulo")
    public void agendadoExpurgo() {
        executar("expurgo", false);
    }

    @Scheduled(cron = "0 0 8 * * MON", zone = "America/Sao_Paulo")
    public void agendadoResumo() {
        executar("resumo", false);
    }

    /** Roda uma tarefa e registra o resultado. */
    @Transactional
    public ExecucaoTarefa executar(String tarefa, boolean manual) {
        ExecucaoTarefa e = new ExecucaoTarefa();
        e.tarefa = tarefa;
        e.inicio = LocalDateTime.now();
        e.manual = manual;
        try {
            Map.Entry<Integer, String> r = switch (tarefa) {
                case "lembretes" -> lembretes();
                case "retornos" -> retornos();
                case "expurgo" -> expurgo();
                case "resumo" -> resumo();
                default -> throw ApiExceptionHandler.naoEncontrado("Tarefa desconhecida: " + tarefa);
            };
            e.itens = r.getKey();
            e.detalhe = r.getValue();
        } catch (ApiExceptionHandler.ErroNegocio ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Falha na automação {}", tarefa, ex);
            e.itens = 0;
            e.detalhe = "Falhou: " + ex.getMessage();
        }
        e.fim = LocalDateTime.now();
        return execucoes.save(e);
    }

    /** Avisos da véspera: dias marcados para hoje ou amanhã que ainda não receberam aviso. */
    Map.Entry<Integer, String> lembretes() {
        int n = 0;
        LocalDate hoje = LocalDate.now();
        List<Lembrete> lista = new ArrayList<>(lembretes.findByDataIdaAndEnviadoEmIsNull(hoje.plusDays(1)));
        lista.addAll(lembretes.findByDataIdaAndEnviadoEmIsNull(hoje));
        for (Lembrete l : lista) {
            String quando = l.dataIda.equals(hoje) ? "Hoje" : "Amanhã";
            String texto = quando + " é dia de ir" + (l.localNome == null ? "" : " ao " + l.localNome)
                    + (l.localEndereco == null ? "" : " (" + l.localEndereco + ")") + ". Leve: "
                    + (l.documentos == null ? "os documentos do seu Kit do Direito" : l.documentos) + ".";
            notificar(l.triagemCodigo, "LEMBRETE", texto, l.canal);
            l.enviadoEm = LocalDateTime.now();
            lembretes.save(l);
            n++;
        }
        return Map.entry(n, n + " lembrete(s) enviado(s)");
    }

    /** Retornos de 7 e 30 dias. Ignora dados de demonstração para não gerar milhares de avisos. */
    Map.Entry<Integer, String> retornos() {
        int r7 = 0, r30 = 0;
        for (Triagem t : triagens.findAll()) {
            if (Boolean.TRUE.equals(t.demo) || "conseguiu".equals(t.etapa)) continue;
            long dias = PainelService.dias(t);
            if (dias >= 30 && !notificacoes.existsByTriagemCodigoAndTipo(t.codigo, "RETORNO_30")) {
                notificar(t.codigo, "RETORNO_30", "Já faz um mês da sua triagem. Conseguiu o benefício? Conte pra gente no app.", "app");
                triagemService.evento(t.codigo, "Retorno de 30 dias enviado", false);
                r30++;
            } else if (dias >= 7 && !notificacoes.existsByTriagemCodigoAndTipo(t.codigo, "RETORNO_7")) {
                notificar(t.codigo, "RETORNO_7", "Faz uma semana da sua triagem. Você foi ao atendimento? Deu certo ou faltou algum documento?", "app");
                triagemService.evento(t.codigo, "Retorno de 7 dias enviado", false);
                r7++;
            }
        }
        return Map.entry(r7 + r30, r7 + " retorno(s) de 7 dias e " + r30 + " de 30 dias");
    }

    /** LGPD: triagens além da retenção viram números por bairro e dia, e a linha individual é apagada. */
    Map.Entry<Integer, String> expurgo() {
        int dias = unidades.findById(1L).map(u -> u.retencaoDias).filter(Objects::nonNull).orElse(90);
        LocalDateTime limite = LocalDate.now().minusDays(dias).atStartOfDay();
        List<Triagem> velhas = triagens.findByCriadaEmBefore(limite);
        for (Triagem t : velhas) {
            AgregadoDiario a = agregados.findByDiaAndBairro(t.criadaEm.toLocalDate(), t.bairro).orElseGet(() -> {
                AgregadoDiario x = new AgregadoDiario();
                x.dia = t.criadaEm.toLocalDate();
                x.bairro = t.bairro;
                x.triagens = 0;
                x.encaminhados = 0;
                x.conseguiram = 0;
                return x;
            });
            a.triagens++;
            if (PainelService.ENCAMINHADAS.contains(t.etapa)) a.encaminhados++;
            if ("conseguiu".equals(t.etapa)) a.conseguiram++;
            agregados.save(a);
            triagemService.apagarTudo(t.codigo);
        }
        return Map.entry(velhas.size(), velhas.size() + " triagem(ns) com mais de " + dias + " dias apagada(s); números guardados por bairro");
    }

    /** Resumo semanal (E4). Sem servidor de e-mail no piloto, o texto fica no registro da execução. */
    Map.Entry<Integer, String> resumo() {
        boolean ligado = unidades.findById(1L).map(u -> Boolean.TRUE.equals(u.resumoSemanal)).orElse(true);
        if (!ligado) return Map.entry(0, "Resumo semanal desligado nas preferências");
        LocalDateTime semana = LocalDate.now().minusDays(7).atStartOfDay();
        List<Triagem> lista = triagens.findByCriadaEmAfterOrderByCriadaEmDesc(semana);
        Map<String, Object> m = painel.metricas(lista);
        String txt = String.format("Semana: %s triagens, %s encaminhadas, %s conseguiram, %s travadas. Falta mais: %s.",
                m.get("tri"), m.get("enc"), m.get("cons"), m.get("trav"),
                ((Map<?, ?>) m.get("falta")).entrySet().stream().max(Comparator.comparingInt(x -> (Integer) x.getValue()))
                        .map(x -> String.valueOf(x.getKey())).orElse("nada"));
        log.info("[Resumo semanal] {}", txt);
        return Map.entry(lista.size(), txt);
    }

    private void notificar(String codigo, String tipo, String texto, String canal) {
        Notificacao n = new Notificacao();
        n.triagemCodigo = codigo;
        n.tipo = tipo;
        n.texto = texto;
        n.canal = canal == null ? "app" : canal;
        n.criadaEm = LocalDateTime.now();
        notificacoes.save(n);
        if (!"app".equals(n.canal)) {
            triagens.findById(codigo).filter(t -> t.contaId != null).flatMap(t -> contas.findById(t.contaId))
                    .ifPresent(c -> sms.enviar("+55" + seguranca.decifrar(c.telefoneCifrado), "Tem Direito: " + texto));
        }
    }

    public List<ExecucaoTarefa> ultimas() {
        return execucoes.findTop30ByOrderByInicioDesc();
    }
}
