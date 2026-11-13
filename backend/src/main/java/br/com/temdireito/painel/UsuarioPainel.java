package br.com.temdireito.painel;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Pessoa da equipe que usa o painel: atendente, coordenação ou gestor de regras.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "usuario_painel")
public class UsuarioPainel {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String email;
    public String nome;
    /** ATENDENTE, COORDENACAO ou GESTOR. */
    public String perfil;
    /** BCrypt. Nulo enquanto o convite não foi aceito. */
    @Column(name = "senha_hash")
    public String senhaHash;
    /** ATIVO, CONVIDADO ou INATIVO. */
    public String situacao;
    @Column(name = "unidade_id")
    public Long unidadeId;
    @Column(name = "criado_em")
    public LocalDateTime criadoEm;
}
