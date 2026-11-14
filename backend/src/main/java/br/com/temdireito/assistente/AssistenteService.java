package br.com.temdireito.assistente;

import br.com.temdireito.atendimento.PontoAtendimento;
import br.com.temdireito.atendimento.PontoAtendimentoRepository;
import br.com.temdireito.config.AppProperties;
import br.com.temdireito.regras.*;
import br.com.temdireito.regras.servico.RegraService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Assistente de dúvidas: monta a base de conhecimento a partir do motor de
 * regras e manda para o ia-service, que faz a busca (RAG) e chama o LLM.
 *
 * <p>A base sai do motor (não de um texto solto) para o assistente nunca
 * falar uma regra diferente da que o app aplica. Se o ia-service estiver
 * fora do ar, a resposta indica CRAS, Disque Social 121 e INSS 135, como
 * manda a regra 4 do CLAUDE.md.</p>
 */
@Service
public class AssistenteService {

    private static final Logger log = LoggerFactory.getLogger(AssistenteService.class);
    private static final Map<String, String> STATUS_TXT = Map.of("prov", "Prováveis", "pode", "Pode usar já", "ver", "Vale verificar",
            "tem", "Já tem", "nao", "Não se aplicam");

    private final MotorDeRegras motor;
    private final KitService kit;
    private final RegraService regras;
    private final PontoAtendimentoRepository pontos;
    private final RestClient ia;

    public AssistenteService(MotorDeRegras motor, KitService kit, RegraService regras, PontoAtendimentoRepository pontos, AppProperties props) {
        this.motor = motor;
        this.kit = kit;
        this.regras = regras;
        this.pontos = pontos;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(45000);
        this.ia = RestClient.builder().baseUrl(props.iaServiceUrl() == null ? "http://localhost:8000" : props.iaServiceUrl()).requestFactory(f).build();
    }

    /** Mensagem anterior da conversa. */
    public record Mensagem(String role, String content) {
    }

    /** Pergunta do cidadão; {@code respostas} é opcional (só se ele já fez a triagem). */
    public record Pergunta(String pergunta, List<Mensagem> historico, Respostas respostas, Boolean outraPessoa) {
    }

    /** Respostas padrão do protótipo (NOVO().ans), usadas para listar todos os benefícios. */
    static Respostas novo() {
        Respostas r = new Respostas();
        r.pessoas = 2;
        return r;
    }

    /** Base de conhecimento: um documento por benefício e um por passo do Kit. */
    public Map<String, Object> base() {
        Parametros p = regras.publicados();
        List<ResultadoBeneficio> gen = motor.avaliar(novo(), p);
        List<Map<String, Object>> bens = new ArrayList<>();
        for (ResultadoBeneficio b : gen) {
            StringJoiner conds = new StringJoiner("; ");
            b.conds.forEach(c -> conds.add(c.t()));
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("id", b.id);
            d.put("nome", b.nome);
            d.put("orgao", b.orgao);
            d.put("desc", b.desc);
            d.put("valor", b.valor);
            d.put("texto", "[" + b.id + "] " + b.nome + " (" + (b.esf == null ? "Federal" : b.esf) + " · " + b.cat + "). Quem decide: " + b.orgao
                    + ". " + b.desc + " Valor: " + b.valor + ". Condições: " + conds + ". Base legal: " + b.lei + "."
                    + (b.nota == null || b.nota.isBlank() ? "" : " Observação: " + b.nota));
            bens.add(d);
        }
        Respostas k = novo();
        k.cad = "nao";
        k.luz = "nao";
        k.remedio = "sim";
        List<ResultadoBeneficio> todos = motor.avaliar(k, p);
        todos.forEach(b -> b.status = "prov");
        List<String> passos = kit.montar(k, todos).stream()
                .map(x -> x.titulo + " (onde: " + x.onde + "): " + String.join("; ", x.docs) + ". Frase para o balcão: \"" + x.frase + "\"").toList();
        return Map.of("beneficios", bens, "kit", passos);
    }

    /** Contexto da família, igual ao contextoFamilia() do protótipo. */
    public Map<String, Object> contexto(Respostas a, boolean outra) {
        if (a == null) return Map.of("feito", false, "texto", "A pessoa ainda não fez a triagem do app.", "status", Map.of());
        List<ResultadoBeneficio> res = br.com.temdireito.regras.servico.FiltroRegional.aplicar(motor.avaliar(a, regras.publicados()), a);
        Map<String, String> status = new LinkedHashMap<>();
        res.forEach(b -> status.put(b.id, b.status));
        StringBuilder sb = new StringBuilder("Triagem feita").append(outra ? " por um acompanhante, para outra pessoa" : "").append(": ")
                .append(a.pessoas).append(" pessoas na casa; renda da casa ").append(Formatacao.brl(a.renda == null ? 0 : a.renda))
                .append(" por mês; idade ").append(a.idade == null ? "não informada" : a.idade)
                .append("; bairro ").append(a.bairro == null ? "não informado" : a.bairro)
                .append("; cidade ").append(a.cidade == null ? "não informada" : a.cidade + (a.uf == null ? "" : " - " + a.uf)).append(". Resultado do motor de regras.");
        for (String s : List.of("prov", "pode", "ver", "tem", "nao")) {
            String nomes = String.join(", ", res.stream().filter(b -> s.equals(b.status)).map(b -> b.nome).toList());
            sb.append(' ').append(STATUS_TXT.get(s)).append(": ").append(nomes.isEmpty() ? "nenhum" : nomes).append('.');
        }
        if (a.bairro != null) {
            pontos.findByAtivoTrueOrderByTipoAscNomeAsc().stream()
                    .filter(x -> "CRAS".equals(x.tipo) && x.endereco != null && x.endereco.contains(a.bairro)).findFirst()
                    .ifPresent((PontoAtendimento c) -> sb.append(" CRAS mais perto: ").append(c.nome).append(", ").append(c.endereco).append(", ").append(c.horario).append('.'));
        }
        return Map.of("feito", true, "texto", sb.toString(), "status", status);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> perguntar(Pergunta q) {
        String texto = q.pergunta() == null ? "" : q.pergunta().trim();
        if (texto.length() > 500) texto = texto.substring(0, 500);
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("pergunta", texto);
        corpo.put("historico", q.historico() == null ? List.of() : q.historico().stream().limit(8).toList());
        corpo.put("base", base());
        corpo.put("contexto", contexto(q.respostas(), Boolean.TRUE.equals(q.outraPessoa())));
        try {
            return ia.post().uri("/perguntar").body(corpo).retrieve().body(Map.class);
        } catch (Exception e) {
            log.warn("ia-service indisponível: {}", e.getMessage());
            return Map.of("texto", "Não consegui responder agora. Pergunte no CRAS mais perto ou ligue no Disque Social 121 (benefícios do governo federal) ou no 135 (INSS).",
                    "fontes", List.of(), "modo", "indisponivel");
        }
    }

    /** Repassa o áudio para transcrição no ia-service. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> transcrever(byte[] audio, String tipo) {
        try {
            org.springframework.util.LinkedMultiValueMap<String, Object> form = new org.springframework.util.LinkedMultiValueMap<>();
            form.add("audio", new org.springframework.core.io.ByteArrayResource(audio) {
                @Override
                public String getFilename() {
                    return "audio.webm";
                }
            });
            return ia.post().uri("/transcrever").contentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA).body(form).retrieve().body(Map.class);
        } catch (Exception e) {
            return Map.of("texto", "", "disponivel", false, "motivo", "Transcrição indisponível; use o microfone do navegador ou digite.");
        }
    }
}
