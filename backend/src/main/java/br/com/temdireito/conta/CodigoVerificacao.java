package br.com.temdireito.conta;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Código de 6 dígitos enviado por SMS (cidadão) ou para a segunda etapa do painel. Guardado só como hash.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "codigo_verificacao")
public class CodigoVerificacao {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "destino_hash")
    public String destinoHash;
    /** CIDADAO ou PAINEL. */
    public String finalidade;
    @Column(name = "codigo_hash")
    public String codigoHash;
    /** Dados do pedido (ex.: nome e consentimentos de uma conta nova), em JSON. */
    public String dados;
    @Column(name = "expira_em")
    public LocalDateTime expiraEm;
    public Integer tentativas;
    public Boolean usado;
}
