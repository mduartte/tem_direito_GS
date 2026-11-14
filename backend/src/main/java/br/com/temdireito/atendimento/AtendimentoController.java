package br.com.temdireito.atendimento;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Onde ir, para o Brasil todo: CEP para endereço, cidade para coordenadas e
 * pontos de atendimento por perto. O CEP e a localização não são guardados.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Atendimento", description = "CEP, localização e pontos de atendimento")
public class AtendimentoController {

    private final BairroRepository bairros;
    private final PontoAtendimentoRepository pontos;
    private final LocalizacaoService local;

    public AtendimentoController(BairroRepository bairros, PontoAtendimentoRepository pontos, LocalizacaoService local) {
        this.bairros = bairros;
        this.pontos = pontos;
        this.local = local;
    }

    /** Bairros do território da unidade (usados no mapa de demanda do painel). */
    @GetMapping("/bairros")
    public List<Bairro> bairros() {
        return bairros.findAll();
    }

    @GetMapping("/pontos")
    @Operation(summary = "Pontos cadastrados na gestão")
    public List<PontoAtendimento> pontos(@RequestParam(required = false) String tipo) {
        return pontos.findByAtivoTrueOrderByTipoAscNomeAsc().stream()
                .filter(p -> tipo == null || tipo.isBlank() || p.tipo.equalsIgnoreCase(tipo)).toList();
    }

    @GetMapping("/pontos/perto")
    @Operation(summary = "CRAS, UBS, farmácias e Defensoria perto de uma coordenada (cadastro + OpenStreetMap)")
    public List<Map<String, Object>> perto(@RequestParam double lat, @RequestParam double lng, @RequestParam(required = false) String tipo) {
        return local.perto(lat, lng, tipo);
    }

    @GetMapping("/cep/{cep}")
    @Operation(summary = "Endereço e coordenadas de qualquer CEP do Brasil")
    public Map<String, Object> cep(@PathVariable String cep) {
        return local.cep(cep);
    }

    @GetMapping("/local")
    @Operation(summary = "Coordenadas de um endereço ou cidade (o app busca o CEP direto no ViaCEP e pede só as coordenadas)")
    public Map<String, Object> cidade(@RequestParam String cidade, @RequestParam String uf, @RequestParam(required = false) String bairro,
                                      @RequestParam(required = false) String rua) {
        double[] c = local.geocodificar(rua, bairro, cidade, uf);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("cidade", cidade);
        m.put("uf", uf.toUpperCase());
        m.put("bairro", bairro);
        m.put("encontrado", c != null);
        if (c != null) {
            m.put("lat", c[0]);
            m.put("lng", c[1]);
        }
        return m;
    }
}
