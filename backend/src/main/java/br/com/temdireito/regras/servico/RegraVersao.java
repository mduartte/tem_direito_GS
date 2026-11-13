package br.com.temdireito.regras.servico;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Uma versão dos parâmetros de uma regra (PUBLICADA, RASCUNHO ou ARQUIVADA).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "regra_versao")
public class RegraVersao {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    /** Chave da regra; "_geral" guarda o salário mínimo. */
    public String chave;
    public Integer versao;
    /** JSON com os limites, no formato do REGRAS_PADRAO. */
    @Lob
    public String parametros;
    /** PUBLICADA, RASCUNHO ou ARQUIVADA. */
    public String situacao;
    public String autor;
    public String revisor;
    public String motivo;
    @Column(name = "criada_em")
    public LocalDateTime criadaEm;
    @Column(name = "publicada_em")
    public LocalDateTime publicadaEm;
}
