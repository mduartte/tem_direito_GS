package br.com.temdireito.triagem;

import br.com.temdireito.notificacao.Lembrete;
import br.com.temdireito.regras.Respostas;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API do cidadão para a triagem. Público: não exige login.
 *
 * <p>Quem criou a triagem recebe uma chave e a manda no cabeçalho
 * {@code X-Chave} para ler, atualizar ou apagar. Sem conta, sem nome, sem CPF.</p>
 */
@RestController
@RequestMapping("/api/triagens")
@Tag(name = "Triagem", description = "Avaliação dos benefícios e acompanhamento anônimo")
public class TriagemController {

    private final TriagemService service;

    public TriagemController(TriagemService service) {
        this.service = service;
    }

    @PostMapping("/avaliar")
    @Operation(summary = "Avalia as respostas com as regras publicadas e devolve benefícios e Kit do Direito")
    public TriagemService.Avaliacao avaliar(@RequestBody Respostas respostas) {
        return service.avaliar(respostas);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra a triagem anônima (código T-xxxx)")
    public TriagemService.Registro registrar(@RequestBody TriagemService.NovaTriagem nova, Authentication auth) {
        Long conta = null;
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CIDADAO"))) {
            conta = Long.valueOf(auth.getName());
        }
        return service.registrar(nova, conta);
    }

    @GetMapping("/{codigo}")
    @Operation(summary = "Andamento, avisos e lembretes da triagem")
    public Map<String, Object> consultar(@PathVariable String codigo, @RequestHeader("X-Chave") String chave) {
        return service.consultar(codigo, chave);
    }

    @PatchMapping("/{codigo}")
    @Operation(summary = "Família informa andamento: retorno, situação de um benefício, autorização")
    public Map<String, Object> atualizar(@PathVariable String codigo, @RequestHeader("X-Chave") String chave,
                                         @RequestBody TriagemService.Atualizacao u) {
        return service.atualizar(codigo, chave, u);
    }

    @PostMapping("/{codigo}/lembretes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Marca o dia de ir ao atendimento; o aviso sai na véspera às 19h")
    public Lembrete lembrete(@PathVariable String codigo, @RequestHeader("X-Chave") String chave,
                             @RequestBody TriagemService.NovoLembrete n) {
        return service.criarLembrete(codigo, chave, n);
    }

    @PostMapping("/{codigo}/notificacoes/{id}/lida")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void lida(@PathVariable String codigo, @PathVariable Long id, @RequestHeader("X-Chave") String chave) {
        service.marcarLida(codigo, chave, id);
    }

    @DeleteMapping("/{codigo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Apaga a triagem e tudo ligado a ela")
    public void apagar(@PathVariable String codigo, @RequestHeader("X-Chave") String chave) {
        service.apagar(codigo, chave);
    }
}
