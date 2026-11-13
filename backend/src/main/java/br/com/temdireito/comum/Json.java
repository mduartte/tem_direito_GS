package br.com.temdireito.comum;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

/**
 * Pequeno atalho para guardar e ler JSON nas colunas CLOB (parâmetros de regra,
 * documentos do kit, horários da unidade). Erros de JSON viram exceção de estado,
 * porque indicam dado corrompido no banco, não erro da pessoa.
 */
@Component
public class Json {

    private final ObjectMapper mapper;

    public Json(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public String escrever(Object valor) {
        try {
            return mapper.writeValueAsString(valor);
        } catch (Exception e) {
            throw new IllegalStateException("JSON inválido", e);
        }
    }

    public <T> T ler(String json, TypeReference<T> tipo) {
        try {
            return json == null ? null : mapper.readValue(json, tipo);
        } catch (Exception e) {
            throw new IllegalStateException("JSON inválido no banco", e);
        }
    }

    public ObjectMapper mapper() {
        return mapper;
    }
}
