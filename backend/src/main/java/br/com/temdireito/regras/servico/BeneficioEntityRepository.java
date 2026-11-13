package br.com.temdireito.regras.servico;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Catálogo de benefícios. */
public interface BeneficioEntityRepository extends JpaRepository<BeneficioEntity, String> {
    List<BeneficioEntity> findAllByOrderByOrdemAsc();
}
