package br.com.temdireito.painel;

import jakarta.persistence.*;


/**
 * Unidade de atendimento (CRAS) e a configuração feita nas telas E2 a E4.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "unidade")
public class Unidade {

    @Id
    public Long id;
    public String nome;
    public String telefone;
    public String endereco;
    @Column(name = "sem_agendamento")
    public Boolean semAgendamento;
    /** JSON: [{dia, abre, fecha, aberto}]. */
    @Lob
    public String horarios;
    /** JSON: bairros atendidos. */
    @Lob
    public String territorio;
    /** JSON: serviços oferecidos. */
    @Lob
    public String servicos;
    /** Texto do aviso quando o CRAS pede retorno à família. */
    @Column(name = "mensagem_retorno")
    public String mensagemRetorno;
    /** Depois disso, as triagens individuais são apagadas e ficam só os números agregados. */
    @Column(name = "retencao_dias")
    public Integer retencaoDias;
    @Column(name = "resumo_semanal")
    public Boolean resumoSemanal;
    public Boolean configurada;
}
