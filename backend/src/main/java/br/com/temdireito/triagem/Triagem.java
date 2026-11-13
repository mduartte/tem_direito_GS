package br.com.temdireito.triagem;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Triagem anônima: o que o painel do CRAS enxerga de uma família. Sem nome, CPF, NIS nem telefone.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "triagem")
public class Triagem {

    /** Código curto mostrado à família e ao CRAS: T-5231. */
    @Id
    public String codigo;
    /** Hash da chave guardada só no aparelho que criou a triagem; protege as atualizações. */
    @Column(name = "chave_hash")
    public String chaveHash;
    @Column(name = "criada_em")
    public LocalDateTime criadaEm;
    @Column(name = "atualizada_em")
    public LocalDateTime atualizadaEm;
    public String bairro;
    public Integer pessoas;
    /** Renda por pessoa, arredondada (não a renda exata da casa). */
    @Column(name = "renda_pc")
    public java.math.BigDecimal rendaPc;
    /** Ids dos benefícios ativos, separados por vírgula. */
    public String beneficios;
    /** triagem, kit, agendado, atendido, conseguiu ou travado. */
    public String etapa;
    @Column(name = "etapa_texto")
    public String etapaTexto;
    /** Documento que faltou, quando travou. */
    public String falta;
    /** A família autorizou o CRAS a mandar aviso pelo app. */
    public Boolean autorizou;
    public String canal;
    /** Versões de regra usadas no resultado (auditoria). */
    @Column(name = "regras_usadas")
    public String regrasUsadas;
    /** Observação interna da equipe, nunca mostrada à família. */
    @Column(name = "obs_cras")
    public String obsCras;
    @Column(name = "conta_id")
    public Long contaId;
    /** Dado de demonstração gerado no primeiro start. */
    public Boolean demo;
}
