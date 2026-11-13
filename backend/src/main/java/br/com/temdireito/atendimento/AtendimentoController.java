package br.com.temdireito.atendimento;

import br.com.temdireito.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Onde ir: CEP para bairro e pontos de atendimento do mapa.
 *
 * <p>O CEP é consultado no ViaCEP para mostrar a rua; se o serviço estiver
 * fora do ar (ou bloqueado na rede), o bairro sai das faixas de CEP do
 * território cadastradas na tabela {@code bairro}. O CEP não é guardado.</p>
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Atendimento", description = "CEP, bairros e pontos de atendimento")
public class AtendimentoController {

    private static final Logger log = LoggerFactory.getLogger(AtendimentoController.class);
    private final BairroRepository bairros;
    private final PontoAtendimentoRepository pontos;
    private final RestClient viacep;

    public AtendimentoController(BairroRepository bairros, PontoAtendimentoRepository pontos, AppProperties props) {
        this.bairros = bairros;
        this.pontos = pontos;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(2000);
        f.setReadTimeout(2500);
        this.viacep = RestClient.builder().baseUrl(props.viacepUrl() == null ? "https://viacep.com.br/ws" : props.viacepUrl()).requestFactory(f).build();
    }

    @GetMapping("/bairros")
    public List<Bairro> bairros() {
        return bairros.findAll();
    }

    @GetMapping("/pontos")
    @Operation(summary = "Pontos de atendimento ativos (CRAS, UBS, farmácias, Defensoria)")
    public List<PontoAtendimento> pontos(@RequestParam(required = false) String tipo) {
        return pontos.findByAtivoTrueOrderByTipoAscNomeAsc().stream()
                .filter(p -> tipo == null || tipo.isBlank() || p.tipo.equalsIgnoreCase(tipo)).toList();
    }

    @GetMapping("/cep/{cep}")
    @Operation(summary = "Descobre o bairro do CEP (ViaCEP com reserva pelas faixas do território)")
    public Map<String, Object> cep(@PathVariable String cep) {
        String d = cep.replaceAll("\\D", "");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("cep", d);
        if (d.length() != 8) {
            out.put("valido", false);
            return out;
        }
        out.put("valido", true);
        out.put("bairro", bairroPorFaixa(d));
        out.put("fonte", "faixas do território");
        try {
            JsonNode r = viacep.get().uri("/{cep}/json/", d).retrieve().body(JsonNode.class);
            if (r != null && !r.has("erro")) {
                out.put("logradouro", r.path("logradouro").asText(""));
                out.put("bairroViaCep", r.path("bairro").asText(""));
                out.put("cidade", r.path("localidade").asText(""));
                out.put("uf", r.path("uf").asText(""));
                out.put("fonte", "ViaCEP");
            }
        } catch (Exception e) {
            log.debug("ViaCEP indisponível, usando faixas: {}", e.getMessage());
        }
        return out;
    }

    /** Mesma lógica do bairroDoCep() do protótipo, mas lendo as faixas do banco. */
    String bairroPorFaixa(String cep8) {
        int n = Integer.parseInt(cep8.substring(0, 5));
        for (Bairro b : bairros.findAll()) {
            if (b.cepFaixas == null) continue;
            for (String faixa : b.cepFaixas.split(";")) {
                String[] p = faixa.trim().split("-");
                if (p.length == 2 && n >= Integer.parseInt(p[0]) && n <= Integer.parseInt(p[1])) return b.nome;
            }
        }
        return null;
    }
}
