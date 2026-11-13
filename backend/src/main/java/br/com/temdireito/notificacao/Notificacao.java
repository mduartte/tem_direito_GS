package br.com.temdireito.notificacao;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Aviso que a família vê no app (e recebe por SMS, se pediu).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "notificacao")
public class Notificacao {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "triagem_codigo")
    public String triagemCodigo;
    /** LEMBRETE, RETORNO_7, RETORNO_30, AVISO_CRAS ou PRAZO. */
    public String tipo;
    public String texto;
    public String canal;
    @Column(name = "criada_em")
    public LocalDateTime criadaEm;
    @Column(name = "lida_em")
    public LocalDateTime lidaEm;
}
