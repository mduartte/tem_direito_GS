package br.com.temdireito.regras;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Formata valores em reais exatamente como o app (Intl pt-BR): "R$ 1.621" ou "R$ 405,25".
 *
 * <p>Os textos das condições ("Renda por pessoa até R$ 405,25") são gerados no
 * backend e mostrados como estão no app, por isso a formatação precisa ser
 * idêntica à do navegador. Arredonda "metade para cima", como o JavaScript.</p>
 */
public final class Formatacao {

    private Formatacao() {
    }

    /** Valor em reais sem centavos: "R$ 1.621". */
    public static String brl(double v) {
        return brl(v, false);
    }

    /** Valor em reais; com {@code centavos} mostra sempre duas casas: "R$ 380,00". */
    public static String brl(double v, boolean centavos) {
        BigDecimal bd = BigDecimal.valueOf(v).setScale(centavos ? 2 : 0, RoundingMode.HALF_UP);
        String plain = bd.abs().toPlainString();
        String inteiro = plain.contains(".") ? plain.substring(0, plain.indexOf('.')) : plain;
        String dec = plain.contains(".") ? plain.substring(plain.indexOf('.') + 1) : "";
        StringBuilder sb = new StringBuilder();
        int n = inteiro.length();
        for (int i = 0; i < n; i++) {
            sb.append(inteiro.charAt(i));
            int resto = n - 1 - i;
            if (resto > 0 && resto % 3 == 0) {
                sb.append('.');
            }
        }
        String num = sb + (centavos ? "," + dec : "");
        return "R$ " + (bd.signum() < 0 ? "-" : "") + num;
    }

    /** Número inteiro com separador de milhar: 1.234. */
    public static String inteiro(long v) {
        return brl(v).substring(3);
    }
}
