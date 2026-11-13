package br.com.temdireito.triagem;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Triagens anônimas. */
public interface TriagemRepository extends JpaRepository<Triagem, String> {
    List<Triagem> findByCriadaEmAfterOrderByCriadaEmDesc(LocalDateTime desde);
    List<Triagem> findByCriadaEmBefore(LocalDateTime limite);
    List<Triagem> findByContaId(Long contaId);
    List<Triagem> findAllByOrderByCriadaEmDesc();
}
