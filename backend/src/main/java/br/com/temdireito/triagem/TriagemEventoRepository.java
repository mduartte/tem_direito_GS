package br.com.temdireito.triagem;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Linha do tempo das triagens. */
public interface TriagemEventoRepository extends JpaRepository<TriagemEvento, Long> {
    List<TriagemEvento> findByTriagemCodigoOrderByDataHoraAsc(String codigo);
    @Transactional @Modifying void deleteByTriagemCodigo(String codigo);
}
