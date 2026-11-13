package br.com.temdireito.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de ponta a ponta da API com H2 e os dados de demonstração.
 * Cobrem o fluxo do cidadão, a LGPD (consentimento e apagar), o login em duas
 * etapas do painel, as permissões por perfil, a publicação de regra e as automações.
 */
@SpringBootTest(properties = {"app.ia-service-url=http://localhost:1", "app.viacep-url=http://localhost:1"})
@AutoConfigureMockMvc
class ApiTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;

    private static final String RESPOSTAS = """
            {"pessoas":1,"idade":70,"pcd":"nao","renda":0,"aposent":"nao","criancas":"nao","grupos":[],"cad":"nao","remedio":"sim","luz":"sim","bairro":"Jardim Ângela"}""";

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void avaliarDevolve29BeneficiosEKit() throws Exception {
        JsonNode r = json(mvc.perform(post("/api/triagens/avaliar").contentType(MediaType.APPLICATION_JSON).content(RESPOSTAS))
                .andExpect(status().isOk()).andReturn());
        assertEquals(29, r.get("resultado").size());
        assertTrue(r.get("kit").size() > 0);
        assertEquals(1621.0, r.get("salarioMinimo").asDouble());
    }

    @Test
    void registrarSemConsentimentoEhRecusado() throws Exception {
        mvc.perform(post("/api/triagens").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"respostas\":" + RESPOSTAS + ",\"consentimento\":false}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void fluxoDoCidadaoDoRegistroAteApagar() throws Exception {
        JsonNode reg = json(mvc.perform(post("/api/triagens").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"respostas\":" + RESPOSTAS + ",\"consentimento\":true,\"autorizou\":true}"))
                .andExpect(status().isCreated()).andReturn());
        String codigo = reg.get("codigo").asText(), chave = reg.get("chave").asText();
        assertTrue(codigo.startsWith("T-"));
        // sem a chave, ninguém lê
        mvc.perform(get("/api/triagens/" + codigo).header("X-Chave", "errada")).andExpect(status().isForbidden());
        mvc.perform(post("/api/triagens/" + codigo + "/lembretes").header("X-Chave", chave).contentType(MediaType.APPLICATION_JSON)
                .content("{\"data\":\"" + java.time.LocalDate.now().plusDays(1) + "\",\"canal\":\"app\",\"localNome\":\"CRAS Vila Santa Lúcia\"}"))
                .andExpect(status().isCreated());
        JsonNode t = json(mvc.perform(get("/api/triagens/" + codigo).header("X-Chave", chave)).andExpect(status().isOk()).andReturn());
        assertEquals("agendado", t.get("etapa").asText());
        mvc.perform(patch("/api/triagens/" + codigo).header("X-Chave", chave).contentType(MediaType.APPLICATION_JSON)
                .content("{\"retorno\":\"faltou\",\"falta\":\"Comprovante de endereço\"}")).andExpect(jsonPath("$.etapa").value("travado"));
        mvc.perform(delete("/api/triagens/" + codigo).header("X-Chave", chave)).andExpect(status().isNoContent());
        mvc.perform(get("/api/triagens/" + codigo).header("X-Chave", chave)).andExpect(status().isNotFound());
    }

    private String loginPainel(String email) throws Exception {
        JsonNode l = json(mvc.perform(post("/api/auth/painel/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"demo2026\"}")).andExpect(status().isOk()).andReturn());
        assertEquals("codigo", l.get("etapa").asText());
        JsonNode v = json(mvc.perform(post("/api/auth/painel/verificar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"codigo\":\"" + l.get("codigoTeste").asText() + "\"}")).andExpect(status().isOk()).andReturn());
        return v.get("token").asText();
    }

    @Test
    void painelExigeLoginEmDuasEtapas() throws Exception {
        mvc.perform(get("/api/painel/visao-geral")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/painel/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana.ribeiro@prefeitura.sp.gov.br\",\"senha\":\"errada\"}")).andExpect(status().isBadRequest());
        String token = loginPainel("ana.ribeiro@prefeitura.sp.gov.br");
        JsonNode v = json(mvc.perform(get("/api/painel/visao-geral?per=60").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn());
        assertTrue(v.get("atual").get("tri").asInt() > 1000, "dados de demonstração carregados");
        assertEquals(8, v.get("semanas").size());
        mvc.perform(get("/api/painel/relatorios/bairros.csv").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("Jardim Ângela")));
    }

    @Test
    void atendenteNaoPublicaRegraNemRodaAutomacao() throws Exception {
        String token = loginPainel("marcos.lima@prefeitura.sp.gov.br");
        mvc.perform(put("/api/gestao/regras/tar/rascunho").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"frac\":0.5,\"kwh\":80}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/painel/automacoes/retornos/executar").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
        mvc.perform(post("/api/gestao/simular").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"respostas\":" + RESPOSTAS + "}")).andExpect(status().isOk()).andExpect(jsonPath("$.casos.length()").value(10));
    }

    @Test
    void gestorPublicaRegraComRevisaoEHistorico() throws Exception {
        String token = loginPainel("mateus.duarte@temdireito.org");
        mvc.perform(put("/api/gestao/regras/tar/rascunho").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"frac\":0.5,\"kwh\":90}")).andExpect(status().isOk());
        mvc.perform(post("/api/gestao/regras/tar/publicar").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"teste\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/gestao/regras/tar/publicar").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"revisor\":\"Ana Ribeiro\",\"motivo\":\"Novo limite de consumo\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.versao").value(5));
        mvc.perform(get("/api/gestao/historico").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].motivo").value("Novo limite de consumo"));
    }

    @Test
    void coordenacaoRodaAutomacoesEAssistenteResponde() throws Exception {
        String token = loginPainel("ana.ribeiro@prefeitura.sp.gov.br");
        for (String t : new String[]{"lembretes", "retornos", "expurgo", "resumo"}) {
            mvc.perform(post("/api/painel/automacoes/" + t + "/executar").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.tarefa").value(t));
        }
        // ia-service fora do ar no teste: o backend indica CRAS, 121 e 135
        mvc.perform(post("/api/assistente/perguntar").contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Quem tem direito ao BPC?\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.modo").value("indisponivel"));
    }

    @Test
    void contaDoCidadaoComCodigoPorSms() throws Exception {
        JsonNode c = json(mvc.perform(post("/api/contas/codigo").contentType(MediaType.APPLICATION_JSON)
                .content("{\"telefone\":\"(11) 98765-4321\",\"nome\":\"Rita\",\"aceiteTermos\":true,\"aceiteSensiveis\":true}"))
                .andExpect(status().isOk()).andReturn());
        assertTrue(c.get("mascara").asText().endsWith("4321"));
        JsonNode ok = json(mvc.perform(post("/api/contas/confirmar").contentType(MediaType.APPLICATION_JSON)
                .content("{\"telefone\":\"11987654321\",\"codigo\":\"" + c.get("codigoTeste").asText() + "\"}")).andExpect(status().isOk()).andReturn());
        String token = ok.get("token").asText();
        mvc.perform(get("/api/contas/eu/dados").header("Authorization", "Bearer " + token)).andExpect(jsonPath("$.nome").value("Rita"));
        mvc.perform(delete("/api/contas/eu").header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
    }

    @Test
    void cepCaiNaFaixaDoTerritorio() throws Exception {
        mvc.perform(get("/api/cep/04935-000")).andExpect(jsonPath("$.bairro").value("Jardim Ângela"));
        mvc.perform(get("/api/pontos?tipo=CRAS")).andExpect(jsonPath("$.length()").value(6));
    }
}
