package br.com.temdireito.conta;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Conta opcional do cidadão: entrar com o celular, preferências, exportar e apagar. */
@RestController
@RequestMapping("/api/contas")
@Tag(name = "Conta do cidadão")
public class ContaController {

    private final ContaService service;

    public ContaController(ContaService service) {
        this.service = service;
    }

    @PostMapping("/codigo")
    @Operation(summary = "Envia o código por SMS (em desenvolvimento, devolve codigoTeste)")
    public Map<String, Object> codigo(@RequestBody ContaService.PedidoCodigo p) {
        return service.pedirCodigo(p);
    }

    @PostMapping("/confirmar")
    @Operation(summary = "Confere o código e devolve o token da conta")
    public Map<String, Object> confirmar(@RequestBody ContaService.Confirmacao c) {
        return service.confirmar(c);
    }

    @GetMapping("/eu")
    public Map<String, Object> eu(Authentication auth) {
        return service.resumo(service.conta(id(auth)));
    }

    @PatchMapping("/eu")
    public Map<String, Object> atualizar(Authentication auth, @RequestBody ContaService.Preferencias p) {
        return service.atualizar(id(auth), p);
    }

    @PostMapping("/eu/triagens/{codigo}")
    public Map<String, Object> vincular(Authentication auth, @PathVariable String codigo, @RequestHeader("X-Chave") String chave) {
        return service.vincular(id(auth), codigo, chave);
    }

    @GetMapping("/eu/dados")
    @Operation(summary = "Exporta todos os dados da conta (LGPD, art. 18)")
    public Map<String, Object> dados(Authentication auth) {
        return service.exportar(id(auth));
    }

    @DeleteMapping("/eu")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Apaga a conta e as triagens ligadas a ela")
    public void apagar(Authentication auth) {
        service.apagar(id(auth));
    }

    private Long id(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
