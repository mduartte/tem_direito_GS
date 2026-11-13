package br.com.temdireito.conta;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Contas opcionais do cidadão. */
public interface ContaCidadaoRepository extends JpaRepository<ContaCidadao, Long> {
    Optional<ContaCidadao> findByTelefoneHash(String hash);
}
