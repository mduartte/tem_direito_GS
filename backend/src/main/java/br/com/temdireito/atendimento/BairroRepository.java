package br.com.temdireito.atendimento;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Bairros do território. */
public interface BairroRepository extends JpaRepository<Bairro, String> {

}
