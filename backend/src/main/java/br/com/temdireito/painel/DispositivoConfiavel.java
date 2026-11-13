package br.com.temdireito.painel;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Computador lembrado por 30 dias na verificação em duas etapas.
 *
 * <p>Entidade simples, sem relacionamentos JPA: as ligações são pelo código
 * (ex.: {@code triagemCodigo}), o que deixa as consultas previsíveis e evita
 * carregar dados da família sem querer.</p>
 */
@Entity
@Table(name = "dispositivo_confiavel")
public class DispositivoConfiavel {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "usuario_id")
    public Long usuarioId;
    @Column(name = "token_hash")
    public String tokenHash;
    @Column(name = "expira_em")
    public LocalDateTime expiraEm;
}
