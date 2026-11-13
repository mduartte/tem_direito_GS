package br.com.temdireito.triagem;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Um item da linha do tempo de uma triagem.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "triagem_evento")
public class TriagemEvento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "triagem_codigo")
    public String triagemCodigo;
    public String texto;
    /** Marca em vermelho no painel (ex.: faltou documento). */
    public Boolean alerta;
    @Column(name = "data_hora")
    public LocalDateTime dataHora;
}
