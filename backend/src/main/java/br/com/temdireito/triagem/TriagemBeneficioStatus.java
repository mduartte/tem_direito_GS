package br.com.temdireito.triagem;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Situação de um benefício para a família, informada por ela em "Meus direitos".
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "triagem_beneficio_status")
public class TriagemBeneficioStatus {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "triagem_codigo")
    public String triagemCodigo;
    @Column(name = "beneficio_id")
    public String beneficioId;
    /** fui, faltou, pedido, consegui ou negado. */
    public String situacao;
    @Column(name = "atualizado_em")
    public LocalDateTime atualizadoEm;
}
