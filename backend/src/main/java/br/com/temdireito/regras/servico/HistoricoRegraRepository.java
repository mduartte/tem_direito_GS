package br.com.temdireito.regras.servico;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Trilha de auditoria das publicações. */
public interface HistoricoRegraRepository extends JpaRepository<HistoricoRegra, Long> {
    List<HistoricoRegra> findAllByOrderByDataHoraDesc();
}
