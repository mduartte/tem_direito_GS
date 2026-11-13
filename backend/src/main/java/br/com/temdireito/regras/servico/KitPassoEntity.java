package br.com.temdireito.regras.servico;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Documentos-base e local de um passo do Kit do Direito, editáveis na tela "Documentos e passos" (C3).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "kit_passo")
public class KitPassoEntity {

    /** cras, inss, luz, mae ou casa. */
    @Id
    public String id;
    public String titulo;
    public String onde;
    /** JSON: lista de documentos, na ordem em que aparecem no app. */
    @Lob
    public String documentos;
    @Column(name = "atualizado_em")
    public LocalDateTime atualizadoEm;
    @Column(name = "atualizado_por")
    public String atualizadoPor;
}
