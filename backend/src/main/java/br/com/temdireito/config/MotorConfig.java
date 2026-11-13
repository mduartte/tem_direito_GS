package br.com.temdireito.config;

import br.com.temdireito.regras.KitService;
import br.com.temdireito.regras.MotorDeRegras;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra o motor de regras e o Kit como beans.
 *
 * <p>As duas classes ficam sem anotação do Spring de propósito: assim o motor
 * compila e é testado sozinho (inclusive pelo script de paridade com o
 * protótipo), sem depender do framework.</p>
 */
@Configuration
public class MotorConfig {

    @Bean
    public MotorDeRegras motorDeRegras() {
        return new MotorDeRegras();
    }

    @Bean
    public KitService kitService() {
        return new KitService();
    }
}
