package br.com.temdireito.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

/**
 * Emite e valida os tokens JWT.
 *
 * <p>Dois tipos de usuário usam token:</p>
 * <ul>
 *   <li>equipe do painel (perfis ATENDENTE, COORDENACAO, GESTOR), depois da
 *   senha e do código da segunda etapa;</li>
 *   <li>cidadão com conta (perfil CIDADAO), depois do código por SMS.</li>
 * </ul>
 * <p>O cidadão sem conta não precisa de token: a triagem é anônima.</p>
 */
@Service
public class JwtService {

    private final SecretKey chave;
    private final int horas;

    public JwtService(AppProperties props) {
        byte[] bytes = props.jwtSegredo().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt-segredo precisa ter pelo menos 32 caracteres");
        }
        this.chave = Keys.hmacShaKeyFor(bytes);
        this.horas = props.jwtHoras();
    }

    public String emitir(String sujeito, String perfil, Map<String, Object> extras) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(sujeito)
                .claim("perfil", perfil)
                .claims(extras)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(horas, ChronoUnit.HOURS)))
                .signWith(chave)
                .compact();
    }

    /** Devolve as claims se o token for válido e não estiver vencido. */
    public Optional<Claims> validar(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(chave).build().parseSignedClaims(token).getPayload());
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
