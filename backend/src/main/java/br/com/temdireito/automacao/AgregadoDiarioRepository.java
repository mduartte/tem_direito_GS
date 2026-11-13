package br.com.temdireito.automacao;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Números agregados que sobrevivem ao expurgo. */
public interface AgregadoDiarioRepository extends JpaRepository<AgregadoDiario, Long> {
    Optional<AgregadoDiario> findByDiaAndBairro(LocalDate dia, String bairro);
    List<AgregadoDiario> findByDiaAfter(LocalDate dia);
}
