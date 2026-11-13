package br.com.temdireito.conta;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Seguranca;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Códigos de 6 dígitos de uso único, para o SMS do cidadão e para a segunda
 * etapa do painel. Guardamos só o hash do código e do destino; o código vale
 * 10 minutos e aceita 5 tentativas.
 */
@Service
public class VerificacaoService {

    private final CodigoVerificacaoRepository repo;
    private final Seguranca seguranca;

    public VerificacaoService(CodigoVerificacaoRepository repo, Seguranca seguranca) {
        this.repo = repo;
        this.seguranca = seguranca;
    }

    /** Gera um código novo e devolve o código em claro (para enviar). */
    @Transactional
    public String gerar(String destino, String finalidade, String dados) {
        repo.deleteByExpiraEmBefore(LocalDateTime.now());
        String codigo = seguranca.codigo6();
        CodigoVerificacao c = new CodigoVerificacao();
        c.destinoHash = seguranca.hash(finalidade + ":" + destino);
        c.finalidade = finalidade;
        c.codigoHash = seguranca.hash(codigo);
        c.dados = dados;
        c.expiraEm = LocalDateTime.now().plusMinutes(10);
        c.tentativas = 0;
        c.usado = false;
        repo.save(c);
        return codigo;
    }

    /** Confere o código; devolve os dados guardados no pedido. Falha alto se errado ou vencido. */
    @Transactional(noRollbackFor = ApiExceptionHandler.ErroNegocio.class)
    public Optional<String> conferir(String destino, String finalidade, String codigo) {
        CodigoVerificacao c = repo.findFirstByDestinoHashAndFinalidadeAndUsadoFalseOrderByIdDesc(seguranca.hash(finalidade + ":" + destino), finalidade)
                .orElseThrow(() -> ApiExceptionHandler.invalido("Peça um código novo."));
        if (c.expiraEm.isBefore(LocalDateTime.now())) {
            throw ApiExceptionHandler.invalido("O código venceu. Peça um novo.");
        }
        if (c.tentativas >= 5) {
            throw ApiExceptionHandler.invalido("Muitas tentativas. Peça um código novo.");
        }
        String limpo = codigo == null ? "" : codigo.replaceAll("\\D", "");
        if (!c.codigoHash.equals(seguranca.hash(limpo))) {
            c.tentativas++;
            repo.save(c);
            throw ApiExceptionHandler.invalido("Código errado. Confira e tente de novo.");
        }
        c.usado = true;
        repo.save(c);
        return Optional.ofNullable(c.dados);
    }
}
