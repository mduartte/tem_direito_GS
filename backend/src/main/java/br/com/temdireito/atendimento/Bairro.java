package br.com.temdireito.atendimento;

import jakarta.persistence.*;


/**
 * Bairro do território do piloto, com as faixas de CEP e o ponto central no mapa.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "bairro")
public class Bairro {

    @Id
    public String nome;
    /** Faixas dos 5 primeiros dígitos do CEP: "04930-04949;05840-05859". */
    @Column(name = "cep_faixas")
    public String cepFaixas;
    public Double lat;
    public Double lng;
    /** Famílias no Cadastro Único no bairro (referência para a busca ativa). */
    @Column(name = "familias_cad")
    public Integer familiasCad;
}
