package br.com.temdireito.notificacao;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Avisos mostrados no app. */
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    List<Notificacao> findByTriagemCodigoOrderByCriadaEmDesc(String codigo);
    boolean existsByTriagemCodigoAndTipo(String codigo, String tipo);
    long countByCriadaEmAfter(LocalDateTime desde);
    @Transactional @Modifying void deleteByTriagemCodigo(String codigo);
}
