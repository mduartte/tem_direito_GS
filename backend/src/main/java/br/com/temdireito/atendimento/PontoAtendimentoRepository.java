package br.com.temdireito.atendimento;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Pontos de atendimento do mapa. */
public interface PontoAtendimentoRepository extends JpaRepository<PontoAtendimento, String> {
    List<PontoAtendimento> findByAtivoTrueOrderByTipoAscNomeAsc();
}
