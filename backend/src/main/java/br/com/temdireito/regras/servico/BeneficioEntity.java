package br.com.temdireito.regras.servico;

import jakarta.persistence.*;


/**
 * Um dos 29 benefícios do catálogo, com o órgão responsável e se a unidade o orienta (tela E4).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "beneficio")
public class BeneficioEntity {

    /** Id usado no resultado do motor (bpci, tar, gas...). */
    @Id
    public String id;
    /** Chave nos parâmetros de regra (bpcI, tar, gas...). */
    @Column(name = "chave_regra")
    public String chaveRegra;
    public String nome;
    public String orgao;
    /** Federal, Estadual ou Municipal. */
    public String abrangencia;
    @Column(name = "ativo_unidade")
    public Boolean ativoUnidade;
    public Integer ordem;
}
