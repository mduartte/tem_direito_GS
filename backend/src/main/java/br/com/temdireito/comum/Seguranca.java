package br.com.temdireito.comum;

import br.com.temdireito.config.AppProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Funções de proteção de dados usadas em todo o backend (LGPD).
 *
 * <ul>
 *   <li>{@link #hash(String)}: SHA-256 com sal. Guarda o telefone de um jeito que
 *   permite reconhecer a pessoa no login sem saber o número.</li>
 *   <li>{@link #cifrar(String)} / {@link #decifrar(String)}: AES-256-GCM. Só para o
 *   telefone de quem pediu lembrete por SMS, porque para enviar SMS é preciso
 *   saber o número.</li>
 *   <li>{@link #codigo6()}: código de 6 dígitos com gerador seguro.</li>
 *   <li>{@link #token()}: segredo aleatório (chave da triagem, dispositivo confiável).</li>
 * </ul>
 */
@Component
public class Seguranca {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final byte[] chave;
    private final String sal;

    public Seguranca(AppProperties props) {
        this.chave = Base64.getDecoder().decode(props.criptoChave());
        this.sal = props.hashSal();
        if (chave.length != 16 && chave.length != 24 && chave.length != 32) {
            throw new IllegalStateException("app.cripto-chave precisa ser base64 de 16, 24 ou 32 bytes");
        }
    }

    public String hash(String valor) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest((sal + ":" + valor).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public String cifrar(String texto) {
        try {
            byte[] iv = new byte[12];
            RANDOM.nextBytes(iv);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(chave, "AES"), new GCMParameterSpec(128, iv));
            byte[] cifrado = c.doFinal(texto.getBytes(StandardCharsets.UTF_8));
            byte[] tudo = new byte[iv.length + cifrado.length];
            System.arraycopy(iv, 0, tudo, 0, iv.length);
            System.arraycopy(cifrado, 0, tudo, iv.length, cifrado.length);
            return Base64.getEncoder().encodeToString(tudo);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao cifrar", e);
        }
    }

    public String decifrar(String base64) {
        try {
            byte[] tudo = Base64.getDecoder().decode(base64);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(chave, "AES"), new GCMParameterSpec(128, tudo, 0, 12));
            return new String(c.doFinal(tudo, 12, tudo.length - 12), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao decifrar", e);
        }
    }

    public String codigo6() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    public String token() {
        byte[] b = new byte[24];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    /** Só os dígitos de um telefone. */
    public static String digitos(String telefone) {
        return telefone == null ? "" : telefone.replaceAll("\\D", "");
    }

    /** "(11) 9 ••••-1234": o suficiente para a pessoa reconhecer o número, sem expô-lo. */
    public static String mascarar(String telefone) {
        String d = digitos(telefone);
        return d.length() >= 8 ? "(" + d.substring(0, 2) + ") 9 ••••-" + d.substring(d.length() - 4) : "••••";
    }

    /** "a••••@prefeitura.sp.gov.br". */
    public static String mascararEmail(String email) {
        int at = email.indexOf('@');
        return at <= 0 ? "••••" : email.charAt(0) + "••••" + email.substring(at);
    }
}
