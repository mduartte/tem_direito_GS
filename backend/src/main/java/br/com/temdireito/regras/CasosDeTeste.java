package br.com.temdireito.regras;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Casos de teste obrigatórios antes de publicar uma regra.
 *
 * <p>São perfis de família reais do piloto com o resultado esperado para
 * alguns benefícios. O Editor de regras só libera "Publicar" quando todos
 * passam, e os mesmos casos rodam no JUnit. Se uma mudança de limite fizer a
 * avó de 67 anos com renda de R$ 760 perder o BPC, o teste avisa antes de
 * chegar ao app.</p>
 */
public final class CasosDeTeste {

    /** Um caso: nome, respostas e o status esperado por benefício. */
    public record Caso(String nome, Respostas respostas, Map<String, String> esperado) {
    }

    /** Resultado de rodar um caso contra um conjunto de parâmetros. */
    public record Execucao(String nome, boolean passou, List<String> falhas, Map<String, String> esperado, Respostas respostas) {
    }

    private CasosDeTeste() {
    }

    public static List<Caso> todos() {
        List<Caso> c = new ArrayList<>();
        c.add(new Caso("Idosa sozinha, renda 0", Respostas.de(1, 70, "nao", 0.0, "nao", "nao", "nao", "nao", "sim", null), esp("bpci", "prov")));
        c.add(new Caso("Avó e neto, renda R$ 760", Respostas.de(2, 67, "nao", 760.0, "nao", "sim", "nao", "sim", "nao", null),
                esp("bpci", "prov", "tar", "prov", "farm", "pode")));
        c.add(new Caso("Família de 4, renda R$ 3 mil", Respostas.de(4, 40, "nao", 3000.0, "nao", "sim", "nao", "nao", "sim", null),
                esp("bpci", "nao", "bolsa", "nao")));
        c.add(new Caso("Aposentado de 66, sozinho", Respostas.de(1, 66, "nao", 1621.0, "sim", "nao", "sim", "sim", "sim", null),
                esp("bpci", "nao", "farm", "pode")));
        c.add(new Caso("Mãe e filho PcD, renda R$ 300", Respostas.de(2, 35, "sim", 300.0, "nao", "sim", "sim", "nao", "sim", null),
                esp("bpcp", "prov", "bolsa", "prov")));
        c.add(new Caso("Família de 5, renda R$ 900", Respostas.de(5, 38, "nao", 900.0, "nao", "sim", "nao", "nao", "sim", null),
                esp("bolsa", "prov", "cad", "prov", "gas", "prov", "agua", "prov")));
        c.add(new Caso("Estudante do médio, família de 4, R$ 1.800", Respostas.de(4, 42, "nao", 1800.0, "nao", "sim", "sim", "nao", "sim",
                List.of("c717", "emp", "jov", "men")), esp("pdm", "prov", "idj", "prov", "ple", "prov", "bolsa", "nao")));
        c.add(new Caso("Gestante sozinha, sem renda", Respostas.de(1, 24, "nao", 0.0, "nao", "nao", "nao", "nao", "nao",
                List.of("gest", "men", "jov")), esp("bolsa", "prov", "mae", "pode", "dign", "prov", "bom", "pode")));
        c.add(new Caso("Demitido há 2 meses, casal, R$ 2.400", Respostas.de(2, 45, "nao", 2400.0, "nao", "nao", "nao", "nao", "sim",
                List.of("des", "clt")), esp("segd", "ver", "ctd", "prov", "abono", "ver", "desc", "prov", "tar", "nao")));
        c.add(new Caso("Idoso de 62, renda R$ 2.000, sozinho", Respostas.de(1, 62, "nao", 2000.0, "nao", "nao", "nao", "sim", "sim",
                List.of("ido")), esp("tid", "pode", "cpi", "prov", "bpci", "nao", "farm", "pode")));
        return c;
    }

    /** Roda todos os casos com os parâmetros dados (publicados ou rascunho). */
    public static List<Execucao> rodar(MotorDeRegras motor, Parametros p) {
        List<Execucao> out = new ArrayList<>();
        for (Caso caso : todos()) {
            List<ResultadoBeneficio> res = motor.avaliar(caso.respostas(), p);
            List<String> falhas = new ArrayList<>();
            caso.esperado().forEach((id, st) -> {
                String obtido = res.stream().filter(b -> b.id.equals(id)).map(b -> b.status).findFirst().orElse("ausente");
                if (!obtido.equals(st)) {
                    falhas.add(id + ": esperado " + st + ", obtido " + obtido);
                }
            });
            out.add(new Execucao(caso.nome(), falhas.isEmpty(), falhas, caso.esperado(), caso.respostas()));
        }
        return out;
    }

    private static Map<String, String> esp(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put(kv[i], kv[i + 1]);
        }
        return m;
    }
}
