package br.com.temdireito.automacao;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Registro de uma execução de automação (lembretes, retornos, expurgo, resumo).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "execucao_tarefa")
public class ExecucaoTarefa {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String tarefa;
    public LocalDateTime inicio;
    public LocalDateTime fim;
    /** Quantos avisos, triagens ou linhas a tarefa tratou. */
    public Integer itens;
    public String detalhe;
    /** Disparada pelo botão do painel (demonstração), não pelo agendador. */
    public Boolean manual;
}
