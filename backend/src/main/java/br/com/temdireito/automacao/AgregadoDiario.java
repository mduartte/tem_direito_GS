package br.com.temdireito.automacao;

import jakarta.persistence.*;


/**
 * Números por bairro e dia que ficam depois do expurgo das triagens individuais (LGPD).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "agregado_diario")
public class AgregadoDiario {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public java.time.LocalDate dia;
    public String bairro;
    public Integer triagens;
    public Integer encaminhados;
    public Integer conseguiram;
}
