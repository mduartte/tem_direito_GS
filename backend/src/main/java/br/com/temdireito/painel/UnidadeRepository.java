package br.com.temdireito.painel;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Unidade de atendimento configurada. */
public interface UnidadeRepository extends JpaRepository<Unidade, Long> {

}
