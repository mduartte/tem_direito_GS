package br.com.temdireito.conta;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Códigos de verificação (SMS e segunda etapa do painel). */
public interface CodigoVerificacaoRepository extends JpaRepository<CodigoVerificacao, Long> {
    Optional<CodigoVerificacao> findFirstByDestinoHashAndFinalidadeAndUsadoFalseOrderByIdDesc(String destinoHash, String finalidade);
    @Transactional @Modifying void deleteByExpiraEmBefore(LocalDateTime limite);
}
