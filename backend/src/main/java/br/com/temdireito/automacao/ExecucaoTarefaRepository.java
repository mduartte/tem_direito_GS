package br.com.temdireito.automacao;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Registro das automações. */
public interface ExecucaoTarefaRepository extends JpaRepository<ExecucaoTarefa, Long> {
    List<ExecucaoTarefa> findTop30ByOrderByInicioDesc();
}
