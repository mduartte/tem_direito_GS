package br.com.temdireito.painel;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Seguranca;
import br.com.temdireito.config.AppProperties;
import br.com.temdireito.config.JwtService;
import br.com.temdireito.conta.VerificacaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Entrada no painel do CRAS em duas etapas (telas B1 e E5).
 *
 * <p>1) e-mail e senha; 2) código de 6 dígitos mandado ao e-mail. Se a pessoa
 * marcar "lembrar este computador", recebe um token que pula a segunda etapa
 * por 30 dias; no banco fica só o hash desse token.</p>
 */
@RestController
@RequestMapping("/api/auth/painel")
@Tag(name = "Painel · acesso")
public class PainelAuthController {

    private static final Logger log = LoggerFactory.getLogger(PainelAuthController.class);
    public static final Map<String, String> PERFIL_TXT = Map.of("ATENDENTE", "Atendente", "COORDENACAO", "Coordenação", "GESTOR", "Gestor de regras");

    private final UsuarioPainelRepository usuarios;
    private final DispositivoConfiavelRepository dispositivos;
    private final VerificacaoService verificacao;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final Seguranca seguranca;
    private final AppProperties props;

    public PainelAuthController(UsuarioPainelRepository usuarios, DispositivoConfiavelRepository dispositivos, VerificacaoService verificacao,
                                PasswordEncoder encoder, JwtService jwt, Seguranca seguranca, AppProperties props) {
        this.usuarios = usuarios;
        this.dispositivos = dispositivos;
        this.verificacao = verificacao;
        this.encoder = encoder;
        this.jwt = jwt;
        this.seguranca = seguranca;
        this.props = props;
    }

    public record Login(String email, String senha, String dispositivo) {
    }

    @PostMapping("/login")
    @Operation(summary = "Primeira etapa: e-mail e senha")
    public Map<String, Object> login(@RequestBody Login l) {
        UsuarioPainel u = usuarios.findByEmailIgnoreCase(l.email() == null ? "" : l.email().trim())
                .filter(x -> "ATIVO".equals(x.situacao) && x.senhaHash != null && encoder.matches(l.senha() == null ? "" : l.senha(), x.senhaHash))
                .orElseThrow(() -> ApiExceptionHandler.invalido("E-mail ou senha não conferem."));
        if (l.dispositivo() != null && dispositivos.findByUsuarioIdAndTokenHash(u.id, seguranca.hash(l.dispositivo()))
                .filter(d -> d.expiraEm.isAfter(LocalDateTime.now())).isPresent()) {
            return sessao(u, null);
        }
        return desafio(u);
    }

    private Map<String, Object> desafio(UsuarioPainel u) {
        String codigo = verificacao.gerar(u.email.toLowerCase(), "PAINEL", null);
        // Sem servidor de e-mail no piloto: o código vai para o log e, em desenvolvimento, para a tela.
        log.info("[2FA simulado] código para {}: enviado", Seguranca.mascararEmail(u.email));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("etapa", "codigo");
        out.put("email", Seguranca.mascararEmail(u.email));
        if (props.exporCodigoTeste()) out.put("codigoTeste", codigo);
        return out;
    }

    public record Verificar(String email, String codigo, Boolean lembrar) {
    }

    @PostMapping("/verificar")
    @Operation(summary = "Segunda etapa: código de 6 dígitos")
    @Transactional
    public Map<String, Object> verificar(@RequestBody Verificar v) {
        UsuarioPainel u = usuarios.findByEmailIgnoreCase(v.email() == null ? "" : v.email().trim())
                .orElseThrow(() -> ApiExceptionHandler.invalido("Comece de novo pelo e-mail e senha."));
        verificacao.conferir(u.email.toLowerCase(), "PAINEL", v.codigo());
        String disp = null;
        if (Boolean.TRUE.equals(v.lembrar())) {
            disp = seguranca.token();
            DispositivoConfiavel d = new DispositivoConfiavel();
            d.usuarioId = u.id;
            d.tokenHash = seguranca.hash(disp);
            d.expiraEm = LocalDateTime.now().plusDays(30);
            dispositivos.save(d);
        }
        return sessao(u, disp);
    }

    @PostMapping("/reenviar")
    public Map<String, Object> reenviar(@RequestBody Login l) {
        return login(l);
    }

    private Map<String, Object> sessao(UsuarioPainel u, String dispositivo) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("etapa", "ok");
        out.put("token", jwt.emitir(String.valueOf(u.id), u.perfil, Map.of("nome", u.nome, "email", u.email)));
        out.put("nome", u.nome);
        out.put("perfil", u.perfil);
        out.put("perfilTexto", PERFIL_TXT.getOrDefault(u.perfil, u.perfil));
        if (dispositivo != null) out.put("dispositivo", dispositivo);
        return out;
    }
}
