package br.com.temdireito.notificacao;

import br.com.temdireito.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Envio de SMS. Em desenvolvimento ({@code app.sms.provider=log}) só registra
 * no log, mascarando o número; em produção usa a API REST do Twilio.
 *
 * <p>O número em claro só existe aqui, no instante do envio: ele chega
 * decifrado de {@code conta_cidadao.telefone_cifrado} e não é gravado em log.</p>
 */
@Component
public class SmsGateway {

    private static final Logger log = LoggerFactory.getLogger(SmsGateway.class);
    private final AppProperties.Sms cfg;

    public SmsGateway(AppProperties props) {
        this.cfg = props.sms() == null ? new AppProperties.Sms("log", null, null, null) : props.sms();
    }

    /** true quando há SMS de verdade; o código de teste não pode aparecer na tela. */
    public boolean real() {
        return "twilio".equalsIgnoreCase(cfg.provider());
    }

    public void enviar(String telefoneE164, String texto) {
        if (!real()) {
            String fim = telefoneE164 == null || telefoneE164.length() < 4 ? "****" : telefoneE164.substring(telefoneE164.length() - 4);
            log.info("[SMS simulado] para ****{}: {}", fim, texto);
            return;
        }
        try {
            LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("To", telefoneE164);
            form.add("From", cfg.twilioDe());
            form.add("Body", texto);
            String basic = Base64.getEncoder().encodeToString((cfg.twilioSid() + ":" + cfg.twilioToken()).getBytes(StandardCharsets.UTF_8));
            RestClient.create().post()
                    .uri("https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json", cfg.twilioSid())
                    .header("Authorization", "Basic " + basic)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form).retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.warn("Falha ao enviar SMS: {}", e.getMessage());
        }
    }
}
