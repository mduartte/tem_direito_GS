package br.com.temdireito.painel;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Pedidos de acesso ao painel. */
public interface SolicitacaoAcessoRepository extends JpaRepository<SolicitacaoAcesso, Long> {
    List<SolicitacaoAcesso> findAllByOrderByCriadaEmDesc();
}
