package br.com.temdireito.regras.servico;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Json;
import br.com.temdireito.regras.*;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Regras versionadas: monta os parâmetros publicados para o motor, guarda
 * rascunhos, simula e publica (regra 2 do CLAUDE.md).
 *
 * <p>Publicar exige que os 10 casos de teste passem com o rascunho e que uma
 * assistente social seja indicada como revisora. A versão anterior vira
 * ARQUIVADA e a mudança fica no histórico com autor, revisor e motivo.</p>
 */
@Service
public class RegraService {

    /** Chave reservada para o salário mínimo, que vale para todas as regras. */
    public static final String GERAL = "_geral";
    private static final TypeReference<Map<String, Object>> MAPA = new TypeReference<>() { };

    private final RegraVersaoRepository versoes;
    private final HistoricoRegraRepository historico;
    private final MotorDeRegras motor;
    private final Json json;
    /** Cache dos parâmetros publicados; invalidado a cada publicação. */
    private volatile Parametros cache;

    public RegraService(RegraVersaoRepository versoes, HistoricoRegraRepository historico, MotorDeRegras motor, Json json) {
        this.versoes = versoes;
        this.historico = historico;
        this.motor = motor;
        this.json = json;
    }

    /** Parâmetros publicados, no formato que o motor espera. */
    public Parametros publicados() {
        Parametros p = cache;
        if (p == null) {
            p = montar(versoes.findBySituacao("PUBLICADA"));
            cache = p;
        }
        return p.copia();
    }

    private Parametros montar(List<RegraVersao> lista) {
        Parametros padrao = RegrasPadrao.criar();
        Parametros p = padrao.copia();
        for (RegraVersao r : lista) {
            Map<String, Object> campos = json.ler(r.parametros, MAPA);
            if (GERAL.equals(r.chave)) {
                Object sm = campos.get("sm");
                if (sm instanceof Number n) p.setSalarioMinimo(n.doubleValue());
            } else {
                campos.put("v", r.versao);
                p.regra(r.chave, campos);
            }
        }
        return p;
    }

    /** Texto curto com as versões usadas, guardado em cada triagem para auditoria. */
    public String versoesUsadas(Parametros p, Collection<ResultadoBeneficio> ativos) {
        StringJoiner sj = new StringJoiner(", ");
        ativos.forEach(b -> sj.add(b.nome + " v" + b.v));
        return sj.toString();
    }

    /** Resumo de todas as regras: versão publicada e rascunho pendente, se houver. */
    public List<Map<String, Object>> listar() {
        Parametros p = publicados();
        List<Map<String, Object>> out = new ArrayList<>();
        List<String> chaves = new ArrayList<>();
        chaves.add(GERAL);
        chaves.addAll(p.todas().keySet());
        for (String chave : chaves) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("chave", chave);
            m.put("campos", GERAL.equals(chave) ? Map.of("sm", p.sm()) : p.campos(chave));
            versoes.findFirstByChaveAndSituacaoOrderByVersaoDesc(chave, "PUBLICADA").ifPresent(r -> {
                m.put("versao", r.versao);
                m.put("publicadaEm", r.publicadaEm);
                m.put("autor", r.autor);
            });
            versoes.findFirstByChaveAndSituacaoOrderByVersaoDesc(chave, "RASCUNHO").ifPresent(r -> {
                m.put("rascunho", json.ler(r.parametros, MAPA));
                m.put("rascunhoAutor", r.autor);
            });
            out.add(m);
        }
        return out;
    }

    /** Salva (ou substitui) o rascunho de uma regra. Não muda nada para o cidadão. */
    @Transactional
    public RegraVersao salvarRascunho(String chave, Map<String, Object> campos, String autor) {
        if (!GERAL.equals(chave) && !RegrasPadrao.criar().todas().containsKey(chave)) {
            throw ApiExceptionHandler.naoEncontrado("Regra não encontrada: " + chave);
        }
        RegraVersao r = versoes.findFirstByChaveAndSituacaoOrderByVersaoDesc(chave, "RASCUNHO").orElseGet(RegraVersao::new);
        if (r.id == null) {
            r.chave = chave;
            r.versao = versoes.findFirstByChaveOrderByVersaoDesc(chave).map(x -> x.versao + 1).orElse(1);
            r.situacao = "RASCUNHO";
            r.criadaEm = LocalDateTime.now();
        }
        Map<String, Object> limpo = new LinkedHashMap<>(campos);
        limpo.remove("v");
        r.parametros = json.escrever(limpo);
        r.autor = autor;
        return versoes.save(r);
    }

    /** Parâmetros publicados com os rascunhos informados por cima (sem gravar). */
    public Parametros comRascunhos(Map<String, Map<String, Object>> rascunhos) {
        Parametros p = publicados();
        if (rascunhos == null) return p;
        rascunhos.forEach((chave, campos) -> {
            if (GERAL.equals(chave)) {
                Object sm = campos.get("sm");
                if (sm instanceof Number n) p.setSalarioMinimo(n.doubleValue());
                else if (sm != null) p.setSalarioMinimo(Double.parseDouble(String.valueOf(sm).replace(',', '.')));
            } else {
                Map<String, Object> m = new LinkedHashMap<>(p.campos(chave));
                m.putAll(campos);
                p.regra(chave, m);
            }
        });
        return p;
    }

    /** Roda os 10 casos de teste com os rascunhos aplicados. */
    public List<CasosDeTeste.Execucao> testar(Map<String, Map<String, Object>> rascunhos) {
        return CasosDeTeste.rodar(motor, comRascunhos(rascunhos));
    }

    /**
     * Publica o rascunho de uma regra.
     *
     * <p>O histórico é gravado ANTES da nova versão: no Oracle, o trigger de
     * auditoria só insere se ainda não houver registro, e assim não duplica.</p>
     */
    @Transactional
    public HistoricoRegra publicar(String chave, String autor, String revisor, String motivo) {
        RegraVersao rasc = versoes.findFirstByChaveAndSituacaoOrderByVersaoDesc(chave, "RASCUNHO")
                .orElseThrow(() -> ApiExceptionHandler.invalido("Não há rascunho para publicar em " + chave + "."));
        if (revisor == null || revisor.isBlank()) {
            throw ApiExceptionHandler.invalido("Indique a assistente social que revisou a mudança.");
        }
        if (motivo == null || motivo.isBlank()) {
            throw ApiExceptionHandler.invalido("Explique o motivo da mudança.");
        }
        Map<String, Object> novos = json.ler(rasc.parametros, MAPA);
        List<CasosDeTeste.Execucao> casos = testar(Map.of(chave, novos));
        long falhas = casos.stream().filter(c -> !c.passou()).count();
        if (falhas > 0) {
            throw ApiExceptionHandler.invalido(falhas + " caso(s) de teste falharam. Corrija antes de publicar.");
        }
        Optional<RegraVersao> atual = versoes.findFirstByChaveAndSituacaoOrderByVersaoDesc(chave, "PUBLICADA");
        Map<String, Object> antes = atual.map(r -> json.ler(r.parametros, MAPA)).orElse(Map.of());

        List<List<Object>> mudancas = new ArrayList<>();
        Set<String> campos = new LinkedHashSet<>(antes.keySet());
        campos.addAll(novos.keySet());
        for (String c : campos) {
            Object a = antes.get(c), d = novos.get(c);
            if (!Objects.equals(String.valueOf(a), String.valueOf(d))) {
                mudancas.add(Arrays.asList(c, a, d));
            }
        }

        HistoricoRegra h = new HistoricoRegra();
        h.titulo = (GERAL.equals(chave) ? "Salário mínimo" : chave) + " v" + rasc.versao;
        h.chave = chave;
        h.versao = rasc.versao;
        h.autor = autor;
        h.revisor = revisor;
        h.motivo = motivo;
        h.mudancas = json.escrever(mudancas);
        h.dataHora = LocalDateTime.now();
        historico.save(h);

        atual.ifPresent(r -> {
            r.situacao = "ARQUIVADA";
            versoes.save(r);
        });
        rasc.situacao = "PUBLICADA";
        rasc.revisor = revisor;
        rasc.motivo = motivo;
        rasc.publicadaEm = LocalDateTime.now();
        versoes.save(rasc);
        cache = null;
        return h;
    }

    /** Descarta o rascunho pendente. */
    @Transactional
    public void descartar(String chave) {
        versoes.findFirstByChaveAndSituacaoOrderByVersaoDesc(chave, "RASCUNHO").ifPresent(versoes::delete);
    }

    public List<HistoricoRegra> historico() {
        return historico.findAllByOrderByDataHoraDesc();
    }

    /** Usado pelo seeder e pelos testes para forçar releitura. */
    public void limparCache() {
        cache = null;
    }
}
