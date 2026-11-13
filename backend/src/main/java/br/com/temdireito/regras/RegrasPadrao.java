package br.com.temdireito.regras;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Valores padrão das regras, vigentes em novembro de 2026.
 *
 * <p>São usados na primeira carga do banco e nos testes. Depois disso, a fonte
 * da verdade é a tabela de versões de regra, editada pelo painel de gestão
 * com revisão de uma assistente social. Mudar aqui não muda a produção.</p>
 *
 * <p>Salário mínimo de 2026: R$ 1.621 (Decreto 12.797/2025).</p>
 */
public final class RegrasPadrao {

    public static final double SALARIO_MINIMO = 1621;

    private RegrasPadrao() {
    }

    public static Parametros criar() {
        Parametros p = new Parametros(SALARIO_MINIMO);
        p.regra("cad", m("v", 5, "frac", 0.5, "totSM", 3));
        p.regra("bolsa", m("v", 5, "lim", 218, "base", 691, "pessoa", 164, "crianca", 173, "variavel", 58, "protecao", 706));
        p.regra("bpcI", m("v", 3, "idade", 65, "frac", 0.25, "texto",
                "Você tem 65 anos ou mais e a renda da casa é baixa. Então pode ter direito ao BPC, um salário mínimo por mês."));
        p.regra("bpcP", m("v", 2, "frac", 0.25));
        p.regra("tar", m("v", 4, "frac", 0.5, "kwh", 80));
        p.regra("farm", m("v", 3));
        p.regra("desc", m("v", 1, "ate", 1, "kwh", 120));
        p.regra("gas", m("v", 1, "frac", 0.5));
        p.regra("agua", m("v", 1, "frac", 0.5, "vuln", 218));
        p.regra("pdm", m("v", 1, "frac", 0.5));
        p.regra("dign", m("v", 1, "lim", 218, "fracEst", 0.5));
        p.regra("idj", m("v", 1, "totSM", 2));
        p.regra("cpi", m("v", 1, "idade", 60, "sm2", 2));
        p.regra("mcmv", m("v", 1, "lim", 3200));
        p.regra("abono", m("v", 1, "lim", 2766));
        p.regra("segd", m("v", 1));
        p.regra("incl", m("v", 1));
        p.regra("isen", m("v", 1, "frac", 0.5));
        p.regra("prouni", m("v", 1, "integral", 1.5, "parcial", 3));
        p.regra("fies", m("v", 1, "frac", 0.5));
        p.regra("plpcd", m("v", 1, "frac", 1));
        p.regra("sup", m("v", 1, "frac", 0.5, "lim", 218, "valor", 150.33));
        p.regra("bom", m("v", 1));
        p.regra("ple", m("v", 1, "frac", 1.5));
        p.regra("tid", m("v", 1, "idade", 60));
        p.regra("bupcd", m("v", 1));
        p.regra("ctd", m("v", 1));
        p.regra("mae", m("v", 1));
        p.regra("pot", m("v", 1, "bolsa", 1702.05));
        return p;
    }

    /** Mapa ordenado a partir de pares chave/valor, para o código acima ficar legível. */
    static Map<String, Object> m(Object... kv) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            out.put((String) kv[i], kv[i + 1]);
        }
        return out;
    }
}
