package br.com.temdireito.comum;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Converte erros em respostas {@link ProblemDetail} (RFC 9457) com mensagens em
 * português simples, que o frontend mostra direto no aviso da tela.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /** Erro de regra de negócio com status e mensagem já pensados para a pessoa ler. */
    public static class ErroNegocio extends RuntimeException {
        private final HttpStatus status;

        public ErroNegocio(HttpStatus status, String mensagem) {
            super(mensagem);
            this.status = status;
        }

        public HttpStatus status() {
            return status;
        }
    }

    public static ErroNegocio naoEncontrado(String msg) {
        return new ErroNegocio(HttpStatus.NOT_FOUND, msg);
    }

    public static ErroNegocio invalido(String msg) {
        return new ErroNegocio(HttpStatus.BAD_REQUEST, msg);
    }

    public static ErroNegocio proibido(String msg) {
        return new ErroNegocio(HttpStatus.FORBIDDEN, msg);
    }

    @ExceptionHandler(ErroNegocio.class)
    public ProblemDetail negocio(ErroNegocio e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(e.status(), e.getMessage());
        p.setTitle(e.status().getReasonPhrase());
        return p;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validacao(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage()).collect(Collectors.joining("; "));
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Confira os dados: " + msg);
        p.setTitle("Dados inválidos");
        return p;
    }
}
