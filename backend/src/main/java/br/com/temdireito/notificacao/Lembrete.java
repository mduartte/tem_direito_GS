package br.com.temdireito.notificacao;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Dia marcado para ir ao atendimento. A automação avisa na véspera às 19h.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "lembrete")
public class Lembrete {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "triagem_codigo")
    public String triagemCodigo;
    @Column(name = "data_ida")
    public java.time.LocalDate dataIda;
    /** app, sms ou ambos. */
    public String canal;
    @Column(name = "local_nome")
    public String localNome;
    @Column(name = "local_endereco")
    public String localEndereco;
    /** Primeiros documentos do kit, para o texto do aviso. */
    public String documentos;
    /** Preenchido quando o aviso da véspera sai; evita aviso duplicado. */
    @Column(name = "enviado_em")
    public LocalDateTime enviadoEm;
    @Column(name = "criado_em")
    public LocalDateTime criadoEm;
}
