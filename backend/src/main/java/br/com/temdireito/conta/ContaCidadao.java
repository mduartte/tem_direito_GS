package br.com.temdireito.conta;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Conta opcional do cidadão, só com o celular. O número fica em hash (login) e cifrado (SMS).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "conta_cidadao")
public class ContaCidadao {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    /** Como a pessoa quer ser chamada (opcional). */
    public String nome;
    @Column(name = "telefone_hash")
    public String telefoneHash;
    @Column(name = "telefone_cifrado")
    public String telefoneCifrado;
    @Column(name = "telefone_mascara")
    public String telefoneMascara;
    @Column(name = "aceite_termos")
    public Boolean aceiteTermos;
    /** Consentimento destacado para renda e saúde (LGPD, art. 11). */
    @Column(name = "aceite_sensiveis")
    public Boolean aceiteSensiveis;
    @Column(name = "aviso_cras")
    public Boolean avisoCras;
    @Column(name = "aviso_novos")
    public Boolean avisoNovos;
    @Column(name = "aviso_prazos")
    public Boolean avisoPrazos;
    @Column(name = "criada_em")
    public LocalDateTime criadaEm;
}
