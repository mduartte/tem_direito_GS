package br.com.temdireito.painel;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pedido de uma organização para usar o painel (tela E1).
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "solicitacao_acesso")
public class SolicitacaoAcesso {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "tipo_org")
    public String tipoOrg;
    @Column(name = "nome_org")
    public String nomeOrg;
    public String cnpj;
    public String municipio;
    public String responsavel;
    public String cargo;
    public String email;
    public String telefone;
    public String situacao;
    @Column(name = "criada_em")
    public LocalDateTime criadaEm;
}
