package br.com.temdireito.painel;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Painel do CRAS: visão geral, mapa, encaminhamentos, detalhe e relatórios. */
@RestController
@RequestMapping("/api/painel")
@Tag(name = "Painel do CRAS")
public class PainelController {

    private final PainelService service;

    public PainelController(PainelService service) {
        this.service = service;
    }

    private static PainelService.Filtro f(String bairro, String ben, String per, String etapa, String q) {
        return new PainelService.Filtro(bairro, ben, per == null ? "30" : per, etapa, q);
    }

    @GetMapping("/visao-geral")
    public Map<String, Object> visao(@RequestParam(required = false) String bairro, @RequestParam(required = false) String ben,
                                     @RequestParam(required = false) String per) {
        return service.visaoGeral(f(bairro, ben, per, null, null));
    }

    @GetMapping("/mapa")
    public List<Map<String, Object>> mapa(@RequestParam(required = false) String bairro, @RequestParam(required = false) String ben,
                                          @RequestParam(required = false) String per) {
        return service.mapa(f(bairro, ben, per, null, null));
    }

    @GetMapping("/encaminhamentos")
    public List<Map<String, Object>> encaminhamentos(@RequestParam(required = false) String bairro, @RequestParam(required = false) String ben,
                                                     @RequestParam(required = false) String per, @RequestParam(required = false) String etapa,
                                                     @RequestParam(required = false) String q) {
        return service.encaminhamentos(f(bairro, ben, per, etapa, q));
    }

    @GetMapping("/triagens/{codigo}")
    public Map<String, Object> detalhe(@PathVariable String codigo) {
        return service.detalhe(codigo.toUpperCase());
    }

    @PatchMapping("/triagens/{codigo}")
    @Operation(summary = "Muda a etapa, o documento que falta ou a observação interna")
    public Map<String, Object> atualizar(@PathVariable String codigo, @RequestBody PainelService.Mudanca m, Authentication auth) {
        return service.atualizar(codigo.toUpperCase(), m, nome(auth));
    }

    public record Aviso(String texto) {
    }

    @PostMapping("/triagens/{codigo}/avisar")
    @Operation(summary = "Manda aviso para a família (só se ela autorizou)")
    public Map<String, Object> avisar(@PathVariable String codigo, @RequestBody(required = false) Aviso a, Authentication auth) {
        return service.avisar(codigo.toUpperCase(), a == null ? null : a.texto(), nome(auth));
    }

    @GetMapping(value = "/relatorios/bairros.csv", produces = "text/csv")
    @Operation(summary = "Relatório agregado por bairro em CSV")
    public ResponseEntity<String> csv(@RequestParam(required = false) String bairro, @RequestParam(required = false) String ben,
                                      @RequestParam(required = false) String per) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tem-direito-" + LocalDate.now() + ".csv")
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .body(service.relatorioCsv(f(bairro, ben, per, null, null)));
    }

    static String nome(Authentication auth) {
        if (auth != null && auth.getCredentials() instanceof Claims c && c.get("nome") != null) return String.valueOf(c.get("nome"));
        return "equipe";
    }
}
