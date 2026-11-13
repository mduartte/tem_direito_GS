package br.com.temdireito.painel;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Computadores lembrados na segunda etapa. */
public interface DispositivoConfiavelRepository extends JpaRepository<DispositivoConfiavel, Long> {
    Optional<DispositivoConfiavel> findByUsuarioIdAndTokenHash(Long usuarioId, String tokenHash);
}
