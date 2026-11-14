package br.com.temdireito.regras.servico;

import br.com.temdireito.regras.Condicao;
import br.com.temdireito.regras.Respostas;
import br.com.temdireito.regras.ResultadoBeneficio;

import java.text.Normalizer;
import java.util.List;

/**
 * Ajusta o resultado do motor para quem mora fora de São Paulo.
 *
 * <p>O app vale para o Brasil todo: os 20 benefícios federais seguem o motor.
 * Os do Estado de São Paulo (esfera "Estado de SP") e da cidade de São Paulo
 * ("Cidade de SP") só se aplicam a quem mora lá. A regra fica FORA do motor de
 * propósito: o motor precisa continuar dando o mesmo resultado do protótipo
 * (paridade), e a localização é uma camada por cima dele.</p>
 *
 * <p>Sem cidade e UF informadas, nada muda (o motor decide como sempre).</p>
 */
public final class FiltroRegional {

    private FiltroRegional() {
    }

    public static List<ResultadoBeneficio> aplicar(List<ResultadoBeneficio> res, Respostas a) {
        if (a == null || a.uf == null || a.uf.isBlank()) return res;
        boolean estadoSp = "SP".equalsIgnoreCase(a.uf.trim());
        boolean cidadeSp = estadoSp && a.cidade != null && "sao paulo".equals(normalizar(a.cidade));
        String onde = (a.cidade == null || a.cidade.isBlank() ? "" : a.cidade.trim() + " - ") + a.uf.trim().toUpperCase();
        for (ResultadoBeneficio b : res) {
            if ("Estado de SP".equals(b.esf) && !estadoSp) {
                bloquear(b, "Mora no Estado de São Paulo", onde);
            } else if ("Cidade de SP".equals(b.esf) && !cidadeSp) {
                bloquear(b, "Mora na cidade de São Paulo", onde);
            }
        }
        return res;
    }

    private static void bloquear(ResultadoBeneficio b, String condicao, String onde) {
        b.status = "nao";
        // Copia a lista: o motor pode devolver listas imutáveis.
        java.util.List<Condicao> c = new java.util.ArrayList<>(b.conds);
        c.add(0, Condicao.de(condicao, onde, false));
        b.conds = c;
        b.nota = "Só para quem mora em São Paulo. Pergunte no CRAS se sua cidade tem um programa parecido.";
    }

    static String normalizar(String s) {
        return Normalizer.normalize(s.trim().toLowerCase(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
