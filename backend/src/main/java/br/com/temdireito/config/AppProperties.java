package br.com.temdireito.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Configurações próprias do Tem Direito (prefixo {@code app} no application.yml).
 *
 * <p>Segredos (JWT, chave de criptografia, credenciais de SMS) chegam por
 * variável de ambiente; os valores padrão servem só para desenvolvimento.</p>
 *
 * @param corsOrigens       origens do frontend que podem chamar a API
 * @param jwtSegredo        segredo HMAC dos tokens (mínimo 32 caracteres)
 * @param jwtHoras          validade do token em horas
 * @param criptoChave       chave AES-256 em base64 para cifrar o telefone
 * @param hashSal           sal do hash do telefone e dos códigos
 * @param iaServiceUrl      endereço do serviço de IA (Python)
 * @param demo              gera triagens de demonstração quando o banco está vazio
 * @param exporCodigoTeste  devolve o código de verificação na resposta (só sem SMS real)
 * @param viacepUrl         endereço do ViaCEP
 * @param sms               provedor de SMS e credenciais
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(List<String> corsOrigens, String jwtSegredo, int jwtHoras, String criptoChave, String hashSal,
                            String iaServiceUrl, boolean demo, boolean exporCodigoTeste, String viacepUrl, Sms sms) {

    /** Provedor de SMS: "log" (só registra) ou "twilio" (envia de verdade). */
    public record Sms(String provider, String twilioSid, String twilioToken, String twilioDe) {
    }
}
