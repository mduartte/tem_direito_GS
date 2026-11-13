package br.com.temdireito.triagem;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Situação de cada benefício informada pela família. */
public interface TriagemBeneficioStatusRepository extends JpaRepository<TriagemBeneficioStatus, Long> {
    List<TriagemBeneficioStatus> findByTriagemCodigo(String codigo);
    Optional<TriagemBeneficioStatus> findByTriagemCodigoAndBeneficioId(String codigo, String beneficioId);
    @Transactional @Modifying void deleteByTriagemCodigo(String codigo);
}
