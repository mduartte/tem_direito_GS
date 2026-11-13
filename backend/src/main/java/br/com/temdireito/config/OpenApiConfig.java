package br.com.temdireito.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Documentação Swagger da API, em /swagger-ui.html, com o botão "Authorize" para o token do painel. */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info().title("Tem Direito · API").version("1.0.0")
                        .description("Triagem de benefícios sociais, Kit do Direito, painel do CRAS, gestão de regras e assistente. "
                                + "Projeto acadêmico FIAP · Global Solution 2026.2."))
                .components(new Components().addSecuritySchemes("jwt",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("jwt"));
    }
}
