package br.com.temdireito.regras.servico;

import java.util.*;
import java.time.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;

/** Documentos-base dos passos do Kit do Direito. */
public interface KitPassoEntityRepository extends JpaRepository<KitPassoEntity, String> {

}
