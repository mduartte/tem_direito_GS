package br.com.temdireito.notificacao;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Lembretes de ida ao atendimento. */
public interface LembreteRepository extends JpaRepository<Lembrete, Long> {
    List<Lembrete> findByDataIdaAndEnviadoEmIsNull(LocalDate dia);
    List<Lembrete> findByTriagemCodigoOrderByDataIdaDesc(String codigo);
    @Transactional @Modifying void deleteByTriagemCodigo(String codigo);
}
