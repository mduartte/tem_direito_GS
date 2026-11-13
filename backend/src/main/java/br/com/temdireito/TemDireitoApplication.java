package br.com.temdireito;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ponto de entrada do backend do Tem Direito.
 *
 * <p>{@code @EnableScheduling} liga as automações (lembrete na véspera,
 * retornos de 7 e 30 dias, expurgo LGPD e resumo semanal) do pacote
 * {@code br.com.temdireito.automacao}.</p>
 */
@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class TemDireitoApplication {

    public static void main(String[] args) {
        SpringApplication.run(TemDireitoApplication.class, args);
    }
}
