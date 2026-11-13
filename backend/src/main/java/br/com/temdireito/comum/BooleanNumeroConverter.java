package br.com.temdireito.comum;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Grava {@code Boolean} como {@code NUMBER(1)} (0/1).
 *
 * <p>O Oracle não tem tipo booleano em tabela (antes da 23ai) e o esquema usa
 * {@code NUMBER(1)} nos dois bancos. Com {@code autoApply = true}, todo campo
 * {@code Boolean} das entidades passa por aqui sem precisar de anotação.</p>
 */
@Converter(autoApply = true)
public class BooleanNumeroConverter implements AttributeConverter<Boolean, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Boolean valor) {
        return valor == null ? null : (valor ? 1 : 0);
    }

    @Override
    public Boolean convertToEntityAttribute(Integer valor) {
        return valor == null ? null : valor != 0;
    }
}
