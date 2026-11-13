package br.com.temdireito.regras.servico;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Versões das regras (publicadas, rascunhos e arquivadas). */
public interface RegraVersaoRepository extends JpaRepository<RegraVersao, Long> {
    List<RegraVersao> findBySituacao(String situacao);
    Optional<RegraVersao> findFirstByChaveAndSituacaoOrderByVersaoDesc(String chave, String situacao);
    List<RegraVersao> findByChaveOrderByVersaoDesc(String chave);
    Optional<RegraVersao> findFirstByChaveOrderByVersaoDesc(String chave);
}
