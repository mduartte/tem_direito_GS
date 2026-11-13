package br.com.temdireito.atendimento;

import jakarta.persistence.*;


/**
 * Ponto de atendimento: CRAS, UBS, farmácia credenciada ou Defensoria Pública.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "ponto_atendimento")
public class PontoAtendimento {

    @Id
    public String id;
    /** CRAS, UBS, Farmácia ou Defensoria. */
    public String tipo;
    public String nome;
    public String endereco;
    public String bairro;
    public String horario;
    public String telefone;
    public String obs;
    public Double lat;
    public Double lng;
    public Boolean ativo;
}
