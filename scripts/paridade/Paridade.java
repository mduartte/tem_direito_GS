import br.com.temdireito.regras.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Lado Java do teste de paridade (scripts/paridade-motor.mjs).
 *
 * <p>Lê perfis de família de um arquivo (um por linha, campos separados por
 * "|"), roda o MotorDeRegras e o KitService e imprime o resultado no mesmo
 * formato texto que o lado JavaScript imprime para o motor do protótipo.
 * O script compara as duas saídas linha a linha.</p>
 *
 * <p>Formato da linha de entrada:
 * pessoas|idade|pcd|renda|aposent|criancas|cad|remedio|luz|grupos(separados por vírgula)</p>
 */
public class Paridade {

    public static void main(String[] args) throws Exception {
        List<String> linhas = Files.readAllLines(Path.of(args[0]));
        MotorDeRegras motor = new MotorDeRegras();
        KitService kit = new KitService();
        Parametros p = RegrasPadrao.criar();
        StringBuilder out = new StringBuilder();
        for (String l : linhas) {
            if (l.isBlank()) continue;
            String[] f = l.split("\\|", -1);
            Respostas a = new Respostas();
            a.pessoas = Integer.parseInt(f[0]);
            a.idade = f[1].isEmpty() ? null : Integer.valueOf(f[1]);
            a.pcd = f[2];
            a.renda = f[3].isEmpty() ? null : Double.valueOf(f[3]);
            a.aposent = f[4];
            a.criancas = f[5];
            a.cad = f[6];
            a.remedio = f[7];
            a.luz = f[8];
            if (!f[9].isEmpty()) a.grupos.addAll(Arrays.asList(f[9].split(",")));
            List<ResultadoBeneficio> res = motor.avaliar(a, p);
            for (ResultadoBeneficio b : res) {
                List<String> cs = new ArrayList<>();
                for (Condicao c : b.conds) {
                    cs.add(c.t() + "~" + c.val() + "~" + c.ok() + "~" + c.passo() + "~" + c.info() + "~" + c.talvez());
                }
                out.append(String.join("|", b.id, b.status, String.valueOf(b.v), b.nome, s(b.resumo), s(b.valor), s(b.desc), s(b.texto),
                        s(b.nota), s(b.lei), s(b.cat), s(b.esf), s(b.orgao), s(b.logica), String.join("¦", cs))).append('\n');
            }
            for (PassoKit k : kit.montar(a, res)) {
                out.append("KIT|").append(String.join("|", k.id, k.curto, k.titulo, k.onde, k.frase, String.join("¦", k.docs))).append('\n');
            }
            out.append("--\n");
        }
        System.out.print(out);
    }

    private static String s(String v) {
        return v == null ? "" : v;
    }
}
