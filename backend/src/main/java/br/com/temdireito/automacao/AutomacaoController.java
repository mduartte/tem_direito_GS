package br.com.temdireito.automacao;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Automações vistas pelo painel: histórico de execuções e disparo manual. */
@RestController
@RequestMapping("/api/painel/automacoes")
@Tag(name = "Automações")
public class AutomacaoController {

    private final AutomacaoService service;

    public AutomacaoController(AutomacaoService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> listar() {
        return Map.of("tarefas", AutomacaoService.TAREFAS, "execucoes", service.ultimas());
    }

    @PostMapping("/{tarefa}/executar")
    @Operation(summary = "Executa agora uma automação (lembretes, retornos, expurgo, resumo)")
    public ExecucaoTarefa executar(@PathVariable String tarefa) {
        return service.executar(tarefa, true);
    }

    @GetMapping("/execucoes")
    public List<ExecucaoTarefa> execucoes() {
        return service.ultimas();
    }
}
