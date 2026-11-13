package br.com.temdireito.regras;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Parâmetros editáveis das regras: salário mínimo, limites de renda, idades e
 * valores de cada benefício, com a versão de cada regra.
 *
 * <p>Por que um mapa e não uma classe por benefício? Porque o painel de gestão
 * edita esses números sem novo deploy (Editor de regras), e eles ficam
 * guardados como JSON no banco, uma linha por versão. O formato é o mesmo do
 * objeto {@code REGRAS_PADRAO} do protótipo, o que garante a paridade.</p>
 *
 * <p>Chaves de benefício: {@code cad, bolsa, bpcI, bpcP, tar, farm, desc, gas,
 * agua, pdm, dign, idj, cpi, mcmv, abono, segd, incl, isen, prouni, fies,
 * plpcd, sup, bom, ple, tid, bupcd, ctd, mae, pot}. Cada uma tem o campo
 * {@code v} (versão) e os limites próprios.</p>
 */
public class Parametros {

    private double salarioMinimo;
    private final Map<String, Map<String, Object>> regras = new LinkedHashMap<>();

    public Parametros(double salarioMinimo) {
        this.salarioMinimo = salarioMinimo;
    }

    public double sm() {
        return salarioMinimo;
    }

    public void setSalarioMinimo(double sm) {
        this.salarioMinimo = sm;
    }

    /** Define (ou substitui) os campos de uma regra. */
    public Parametros regra(String chave, Map<String, Object> campos) {
        regras.put(chave, new LinkedHashMap<>(campos));
        return this;
    }

    public Map<String, Map<String, Object>> todas() {
        return regras;
    }

    public Map<String, Object> campos(String chave) {
        return regras.getOrDefault(chave, Map.of());
    }

    /** Valor numérico de um campo. Falha alto se a regra estiver incompleta, para não avaliar errado em silêncio. */
    public double num(String chave, String campo) {
        Object v = campos(chave).get(campo);
        if (v instanceof Number n) {
            return n.doubleValue();
        }
        if (v instanceof String s && !s.isBlank()) {
            return Double.parseDouble(s.replace(',', '.'));
        }
        throw new IllegalStateException("Parâmetro ausente: " + chave + "." + campo);
    }

    public String txt(String chave, String campo) {
        Object v = campos(chave).get(campo);
        return v == null ? "" : String.valueOf(v);
    }

    /** Versão publicada da regra; 1 quando a regra ainda não tem histórico. */
    public int versao(String chave) {
        Object v = campos(chave).get("v");
        return v instanceof Number n ? n.intValue() : 1;
    }

    /** Cópia profunda: o simulador mexe em rascunhos sem tocar na versão publicada. */
    public Parametros copia() {
        Parametros p = new Parametros(salarioMinimo);
        regras.forEach((k, v) -> p.regras.put(k, new LinkedHashMap<>(v)));
        return p;
    }
}
