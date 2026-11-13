package br.com.temdireito.regras.servico;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registro de auditoria de uma publicação de regra: quem mudou, quem revisou, por quê e o que mudou.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "historico_regra")
public class HistoricoRegra {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    /** Ex.: "BPC Idoso v4". */
    public String titulo;
    public String chave;
    public Integer versao;
    public String autor;
    public String revisor;
    public String motivo;
    /** JSON: lista de [campo, antes, depois]. */
    @Lob
    public String mudancas;
    @Column(name = "data_hora")
    public LocalDateTime dataHora;
}
