package br.com.temdireito.painel;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Equipe do painel. */
public interface UsuarioPainelRepository extends JpaRepository<UsuarioPainel, Long> {
    Optional<UsuarioPainel> findByEmailIgnoreCase(String email);
    List<UsuarioPainel> findAllByOrderByNomeAsc();
}
