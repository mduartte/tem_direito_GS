package br.com.temdireito.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Segurança da API.
 *
 * <p>Regra geral: o que o cidadão usa é aberto (a triagem é anônima e não pede
 * login); o que mostra dados de atendimento exige login no painel, com perfil:</p>
 * <ul>
 *   <li>{@code /api/painel/**}: qualquer perfil da equipe;</li>
 *   <li>{@code /api/painel/relatorios/**}: coordenação e gestor;</li>
 *   <li>{@code /api/gestao/**} (leitura): qualquer perfil; (escrita): só gestor de regras;</li>
 *   <li>{@code /api/config/**}: só coordenação (configuração da unidade e da equipe);</li>
 *   <li>{@code /api/contas/eu/**}: cidadão com conta.</li>
 * </ul>
 * <p>Sem sessão no servidor: cada chamada traz o token JWT no cabeçalho Authorization.</p>
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filtro(HttpSecurity http, JwtService jwt, AppProperties props) throws Exception {
        http.csrf(c -> c.disable())
                .cors(c -> c.configurationSource(cors(props)))
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/painel/relatorios/**").hasAnyRole("COORDENACAO", "GESTOR")
                        .requestMatchers("/api/painel/automacoes/**").hasAnyRole("COORDENACAO", "GESTOR")
                        .requestMatchers("/api/painel/**").hasAnyRole("ATENDENTE", "COORDENACAO", "GESTOR")
                        .requestMatchers(HttpMethod.GET, "/api/gestao/**").hasAnyRole("ATENDENTE", "COORDENACAO", "GESTOR")
                        .requestMatchers(HttpMethod.POST, "/api/gestao/simular").hasAnyRole("ATENDENTE", "COORDENACAO", "GESTOR")
                        .requestMatchers("/api/gestao/**").hasRole("GESTOR")
                        .requestMatchers(HttpMethod.GET, "/api/config/**").hasAnyRole("ATENDENTE", "COORDENACAO", "GESTOR")
                        .requestMatchers("/api/config/**").hasRole("COORDENACAO")
                        .requestMatchers("/api/contas/eu/**").hasRole("CIDADAO")
                        .anyRequest().permitAll())
                .addFilterBefore(new FiltroJwt(jwt), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> res.sendError(401, "Entre no painel para continuar."))
                        .accessDeniedHandler((req, res, ex) -> res.sendError(403, "Seu perfil não pode fazer isso.")));
        return http.build();
    }

    private CorsConfigurationSource cors(AppProperties props) {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(props.corsOrigens() == null ? List.of() : props.corsOrigens());
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setExposedHeaders(List.of("Content-Disposition"));
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Lê o "Authorization: Bearer ..." e coloca o usuário e o perfil no contexto do Spring Security. */
    static class FiltroJwt extends OncePerRequestFilter {
        private final JwtService jwt;

        FiltroJwt(JwtService jwt) {
            this.jwt = jwt;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            String h = req.getHeader("Authorization");
            if (h != null && h.startsWith("Bearer ")) {
                jwt.validar(h.substring(7)).ifPresent(c -> {
                    String perfil = String.valueOf(c.get("perfil"));
                    var auth = new UsernamePasswordAuthenticationToken(c.getSubject(), c,
                            List.of(new SimpleGrantedAuthority("ROLE_" + perfil)));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
            chain.doFilter(req, res);
        }
    }
}
