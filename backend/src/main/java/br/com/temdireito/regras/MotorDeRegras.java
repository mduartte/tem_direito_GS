package br.com.temdireito.regras;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static br.com.temdireito.regras.Formatacao.brl;

/**
 * Motor de regras do Tem Direito: recebe as respostas da triagem e devolve,
 * para cada um dos 29 benefícios, se ele é provável, se pode usar, se vale
 * verificar, se já tem ou se não se aplica, com o porquê e a base legal.
 *
 * <p>É Java puro, sem Spring nem banco, de propósito:</p>
 * <ul>
 *   <li>roda igual no backend, nos testes e no simulador do painel;</li>
 *   <li>pode ser testado isoladamente (JUnit e {@code scripts/paridade-motor.mjs});</li>
 *   <li>os números vêm de {@link Parametros}, que o painel edita sem deploy.</li>
 * </ul>
 *
 * <p>É uma tradução fiel da função {@code avaliar()} do protótipo funcional.
 * Os cálculos usam {@code double}, como o JavaScript, para que os dois motores
 * deem exatamente o mesmo resultado, inclusive nos textos com valores.</p>
 *
 * <p>Importante: o motor <b>orienta, não concede</b>. Os textos dizem
 * "provável" e indicam quem decide (INSS, CRAS, distribuidora...).</p>
 */
public class MotorDeRegras {

    /** Área de cada um dos 6 benefícios iniciais; os demais já declaram a área ao serem criados. */
    private static final Map<String, String> CATEGORIA_BASE = Map.of(
            "cad", "Renda", "bolsa", "Renda", "bpci", "Renda", "bpcp", "Renda",
            "tar", "Contas da casa", "farm", "Saúde");

    /** Ordem das áreas no resultado do app. */
    public static final List<String> CATEGORIAS = List.of("Renda", "Contas da casa", "Saúde",
            "Educação e trabalho", "Transporte", "Moradia e alimentação", "Documentos e descontos", "Outros");

    /**
     * Avalia os 29 benefícios.
     *
     * @param a respostas da triagem
     * @param p parâmetros publicados (ou um rascunho, no simulador)
     * @return lista na ordem do app: os 6 benefícios iniciais e depois os demais por área
     */
    public List<ResultadoBeneficio> avaliar(Respostas a, Parametros p) {
        final double sm = p.sm();
        final int pessoas = Math.max(1, a.pessoas);
        final double renda = a.renda == null ? 0 : Math.max(0, a.renda);
        final double pc = renda / pessoas;
        final boolean inCad = "sim".equals(a.cad);
        final Set<String> g = a.grupos;
        final boolean kids = "sim".equals(a.criancas) || g.contains("c06") || g.contains("c717");
        final int idade = a.idade == null ? 0 : a.idade;
        final List<ResultadoBeneficio> out = new ArrayList<>();

        // ---------- Cadastro Único: a porta de entrada ----------
        double cadLim = sm * p.num("cad", "frac");
        double cadTot = sm * p.num("cad", "totSM");
        boolean cadOk = pc <= cadLim || renda <= cadTot;
        ResultadoBeneficio cad = novo("cad", "Cadastro Único", "doc", p.versao("cad"), "CRAS");
        cad.status = inCad ? "tem" : (cadOk ? "prov" : "nao");
        cad.resumo = "Cadastro que abre a porta para os outros benefícios";
        cad.valor = "Gratuito, feito no CRAS";
        cad.desc = "É o cadastro das famílias de baixa renda. Sem ele não dá para pedir BPC, Bolsa Família nem Tarifa Social.";
        cad.conds.add(Condicao.de("Renda por pessoa até " + brl(cadLim, true) + " (meio salário mínimo)", brl(pc, true), pc <= cadLim));
        cad.conds.add(Condicao.de("ou renda da casa até " + brl(cadTot) + " (3 salários mínimos)", brl(renda), renda <= cadTot));
        cad.logica = "basta uma";
        cad.lei = "Decreto 11.016/2022";
        out.add(cad);

        // ---------- BPC Idoso ----------
        double bpcIFrac = p.num("bpcI", "frac");
        double bpcLim = sm * bpcIFrac;
        int bpcIdade = (int) p.num("bpcI", "idade");
        List<Condicao> ci = List.of(
                Condicao.de("Ter " + bpcIdade + " anos ou mais", (a.idade == null ? "—" : String.valueOf(a.idade)) + " anos", idade >= bpcIdade),
                Condicao.de("Renda por pessoa até " + brl(bpcLim, true) + " (" + (bpcIFrac == 0.25 ? "¼" : "½") + " do salário mínimo)", brl(pc, true), pc <= bpcLim),
                Condicao.de("Ninguém da casa recebe aposentadoria ou BPC", "sim".equals(a.aposent) ? "recebe" : "não recebe", !"sim".equals(a.aposent)));
        boolean bpcIok = ci.stream().allMatch(Condicao::ok);
        ResultadoBeneficio bpci = novo("bpci", "BPC Idoso", "wallet", p.versao("bpcI"), "INSS");
        bpci.status = bpcIok ? "prov" : "nao";
        bpci.resumo = "1 salário mínimo por mês · " + brl(sm);
        bpci.valor = brl(sm) + " por mês";
        bpci.texto = p.txt("bpcI", "texto");
        bpci.desc = "Benefício de Prestação Continuada: um salário mínimo por mês para quem tem 65 anos ou mais e renda baixa. Não precisa ter contribuído com o INSS.";
        bpci.conds.addAll(ci);
        bpci.conds.add(cadastro(inCad, "Estar no Cadastro Único"));
        bpci.lei = "Lei 8.742/1993 (LOAS), art. 20";
        out.add(bpci);

        // ---------- BPC Pessoa com Deficiência ----------
        double bpcPLim = sm * p.num("bpcP", "frac");
        List<Condicao> cp = List.of(
                Condicao.talvez("Pessoa com deficiência de longo prazo na casa",
                        "sim".equals(a.pcd) ? "sim" : "naosei".equals(a.pcd) ? "não sabe" : "não", "sim".equals(a.pcd), "naosei".equals(a.pcd)),
                Condicao.de("Renda por pessoa até " + brl(bpcPLim, true), brl(pc, true), pc <= bpcPLim),
                Condicao.de("Ninguém da casa recebe BPC ou aposentadoria", "sim".equals(a.aposent) ? "recebe" : "não recebe", !"sim".equals(a.aposent)));
        String bpcPst = cp.stream().allMatch(Condicao::ok) ? "prov"
                : (cp.get(0).talvez() && cp.get(1).ok() && cp.get(2).ok() ? "ver" : "nao");
        ResultadoBeneficio bpcp = novo("bpcp", "BPC Pessoa com Deficiência", "heart", p.versao("bpcP"), "INSS");
        bpcp.status = bpcPst;
        bpcp.resumo = "1 salário mínimo por mês, com perícia";
        bpcp.valor = brl(sm) + " por mês";
        bpcp.desc = "Um salário mínimo por mês para pessoa com deficiência de qualquer idade, em família de baixa renda. Tem perícia médica e avaliação social no INSS.";
        bpcp.conds.addAll(cp);
        bpcp.conds.add(cadastro(inCad, "Estar no Cadastro Único"));
        bpcp.lei = "Lei 8.742/1993 (LOAS), art. 20";
        out.add(bpcp);

        // ---------- Bolsa Família ----------
        double bfLim = p.num("bolsa", "lim");
        boolean bfOk = pc <= bfLim;
        double bfBase = p.num("bolsa", "base"), bfPessoa = p.num("bolsa", "pessoa");
        double bfCrianca = p.num("bolsa", "crianca"), bfVar = p.num("bolsa", "variavel"), bfProt = p.num("bolsa", "protecao");
        ResultadoBeneficio bolsa = novo("bolsa", "Bolsa Família", "users", p.versao("bolsa"), "CRAS / MDS");
        bolsa.status = bfOk ? "prov" : "nao";
        bolsa.resumo = "A partir de " + brl(bfBase) + " por mês";
        bolsa.valor = "A partir de " + brl(bfBase) + " por mês: " + brl(bfPessoa) + " por pessoa"
                + (kids || g.contains("gest") ? ", mais " + brl(bfCrianca) + " por criança de até 6 anos e " + brl(bfVar) + " por gestante ou criança de 7 a 17" : "");
        bolsa.desc = "Transferência de renda para famílias em situação de pobreza. Desde outubro de 2026 paga " + brl(bfPessoa)
                + " por pessoa, com piso de " + brl(bfBase) + " por família e adicionais por criança, gestante e mãe que amamenta. Se a renda subir até "
                + brl(bfProt) + " por pessoa, a família pode manter metade do valor por até 12 meses.";
        bolsa.conds.add(Condicao.de("Renda por pessoa até " + brl(bfLim), brl(pc, true), bfOk));
        bolsa.conds.add(cadastro(inCad, "Estar no Cadastro Único"));
        bolsa.lei = "Lei 14.601/2023 · Decreto 13.120/2026";
        out.add(bolsa);

        // ---------- Tarifa Social de Energia (Luz do Povo) ----------
        double tarLim = sm * p.num("tar", "frac");
        int kwh = (int) p.num("tar", "kwh");
        boolean tarRenda = pc <= tarLim || bpcIok || "prov".equals(bpcPst);
        ResultadoBeneficio tar = novo("tar", "Tarifa Social de Energia (Luz do Povo)", "bolt", p.versao("tar"), "Distribuidora de energia (Enel SP)");
        tar.status = "semluz".equals(a.luz) ? "nao" : (tarRenda ? "prov" : "nao");
        tar.resumo = "Conta de luz sem cobrança de energia até " + kwh + " kWh por mês";
        tar.valor = "100% de desconto na energia até " + kwh + " kWh por mês; acima disso, paga só o que passar";
        tar.desc = "Desde julho de 2025, famílias do Cadastro Único com renda de até meio salário mínimo por pessoa, ou que recebem BPC, não pagam a energia dos primeiros "
                + kwh + " kWh do mês. O desconto entra sozinho na conta quando o cadastro está em dia. Iluminação pública e impostos continuam na fatura.";
        tar.conds.add(Condicao.de("Renda por pessoa até " + brl(tarLim, true) + " ou receber BPC", brl(pc, true), tarRenda));
        tar.conds.add(Condicao.de("Ter conta de luz", "semluz".equals(a.luz) ? "não tem" : "tem", !"semluz".equals(a.luz)));
        tar.conds.add(Condicao.passo("Conta no nome de alguém da casa", "sim".equals(a.luz) ? "sim" : "não", "sim".equals(a.luz)));
        tar.conds.add(cadastro(inCad, "Estar no Cadastro Único"));
        tar.lei = "Lei 12.212/2010, alterada pela Lei 15.235/2025";
        out.add(tar);

        // ---------- Farmácia Popular ----------
        ResultadoBeneficio farm = novo("farm", "Farmácia Popular", "pill", p.versao("farm"), "Ministério da Saúde");
        farm.status = "sim".equals(a.remedio) ? "pode" : "nao";
        farm.resumo = "Remédios de uso contínuo de graça";
        farm.valor = "Grátis, com receita médica";
        farm.desc = "São 41 itens gratuitos: remédios para pressão, diabetes, asma, colesterol, osteoporose, Parkinson, glaucoma e rinite, além de anticoncepcionais e fraldas geriátricas (60 anos ou mais, ou laudo). Basta receita, documento com foto e CPF. Não precisa ser de baixa renda.";
        farm.conds.add(Condicao.de("Usar remédio de uso contínuo ou anticoncepcional", "sim".equals(a.remedio) ? "sim" : "não", "sim".equals(a.remedio)));
        farm.lei = "Programa Farmácia Popular do Brasil (Ministério da Saúde)";
        out.add(farm);

        Contexto ctx = new Contexto(sm, pessoas, renda, pc, inCad, cadOk, g, kids, bpcIok, bpcPst, idade);
        out.addAll(novos(a, p, ctx));

        for (ResultadoBeneficio b : out) {
            if (b.cat == null) {
                b.cat = CATEGORIA_BASE.getOrDefault(b.id, "Outros");
            }
            if (b.esf == null) {
                b.esf = "Federal";
            }
        }
        return out;
    }

    /** Valores já calculados que os 23 benefícios adicionais reaproveitam. */
    private record Contexto(double sm, int pessoas, double renda, double pc, boolean inCad, boolean cadOk,
                            Set<String> g, boolean kids, boolean bpcIok, String bpcPst, int idade) {
    }

    /**
     * Decide o status a partir das condições "duras" (as que não são passo nem informação).
     * Tradução do {@code st()} do protótipo.
     */
    private static String status(List<Condicao> conds, boolean ver, boolean pode, boolean talvez) {
        List<Condicao> duro = conds.stream().filter(c -> !c.passo() && !c.info()).toList();
        if (duro.stream().allMatch(Condicao::ok)) {
            return ver ? "ver" : (pode ? "pode" : "prov");
        }
        if (talvez && duro.stream().allMatch(c -> c.ok() || c.talvez())) {
            return "ver";
        }
        return "nao";
    }

    private static String status(List<Condicao> conds) {
        return status(conds, false, false, false);
    }

    /** Benefícios que só ganham status "vale verificar", porque dependem de fato que o app não pergunta. */
    private static String soVerificar(String s) {
        return "prov".equals(s) ? "ver" : s;
    }

    private List<ResultadoBeneficio> novos(Respostas a, Parametros p, Contexto x) {
        final double sm = x.sm(), pc = x.pc(), renda = x.renda();
        final Set<String> g = x.g();
        final boolean inCad = x.inCad();
        final boolean idoso = x.idade() >= 60 || g.contains("ido");
        final boolean pcd = "sim".equals(a.pcd), pcdTalvez = "naosei".equals(a.pcd);
        final boolean temBPC = "sim".equals(a.aposent) || x.bpcIok() || "prov".equals(x.bpcPst());
        final boolean cadPos = inCad || x.cadOk();
        final double meio = sm * 0.5;
        final String pcTxt = brl(pc, true);
        final List<ResultadoBeneficio> L = new ArrayList<>();

        // ---------- Contas da casa ----------
        {
            double lim1 = sm * p.num("desc", "ate");
            int kwh = (int) p.num("desc", "kwh");
            List<Condicao> c = List.of(
                    Condicao.de("Renda por pessoa entre " + brl(meio, true) + " e " + brl(lim1, true), pcTxt, pc > meio && pc <= lim1),
                    Condicao.de("Ter conta de luz", "semluz".equals(a.luz) ? "não tem" : "tem", !"semluz".equals(a.luz)),
                    Condicao.de("Poder entrar no Cadastro Único (renda da casa até 3 salários mínimos)", brl(renda), cadPos),
                    Condicao.passo("Conta no nome de alguém da casa", "sim".equals(a.luz) ? "sim" : "não", "sim".equals(a.luz)),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "desc", "Desconto Social de Energia", "bolt", "Distribuidora de energia (Enel SP)", status(c), "Contas da casa", null,
                    "Desconto na conta de luz para quem consome até " + kwh + " kWh",
                    "Desconto médio de cerca de 12% na conta, para consumo de até " + kwh + " kWh por mês",
                    "Novo desde 1º de janeiro de 2026, para quem ganha um pouco mais do que o limite da conta zerada: famílias do Cadastro Único com renda entre meio e um salário mínimo por pessoa deixam de pagar um encargo da conta (a CDE).",
                    null, c, "Lei 15.235/2025 (programa Luz do Povo)"));
        }
        {
            List<Condicao> c = List.of(
                    Condicao.de("Renda por pessoa até " + brl(meio, true) + " (meio salário mínimo)", pcTxt, pc <= meio),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"),
                    Condicao.passo("Cadastro atualizado nos últimos 2 anos", inCad ? "confirmar no CRAS" : "depois do cadastro", inCad));
            L.add(add(p, "gas", "Gás do Povo", "flame", "MDS · revendas credenciadas", status(c), "Contas da casa", null,
                    "Botijão de gás de 13 kg de graça, por vale",
                    "Recarga gratuita do botijão de 13 kg, com vale no app Meu Social",
                    "Substituiu o Auxílio Gás. A família é escolhida automaticamente pelo Cadastro Único, com prioridade para quem recebe o Bolsa Família e tem duas pessoas ou mais. O vale aparece no app Meu Social e é usado em revendas credenciadas.",
                    x.pessoas() < 2 ? "Prioridade para famílias com 2 ou mais pessoas" : "", c, "Lei 15.348/2026"));
        }
        {
            boolean ok = pc <= meio || temBPC;
            boolean vuln = pc <= p.num("agua", "vuln");
            List<Condicao> c = List.of(
                    Condicao.de("Renda por pessoa até " + brl(meio, true) + " ou alguém com BPC", pcTxt, ok),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "agua", "Tarifa Social de Água (Sabesp)", "drop", "Sabesp · Arsesp", status(c), "Contas da casa", "Estado de SP",
                    vuln ? "Conta de água a partir de R$ 16,42" : "Conta de água com cerca de 70% de desconto",
                    vuln ? "Tarifa Vulnerável: R$ 16,42 para até 10 mil litros por mês" : "Tarifa Social: cerca de R$ 21,52 para até 10 mil litros por mês",
                    "A lei federal garante pelo menos 50% de desconto nos primeiros 15 m³ para famílias do Cadastro Único com renda até meio salário mínimo por pessoa ou com BPC. Em São Paulo, a Sabesp aplica a Tarifa Vulnerável (renda até R$ 218 por pessoa) e a Tarifa Social (até meio salário mínimo), de forma automática para quem tem o cadastro em dia.",
                    null, c, "Lei 14.898/2024 · Deliberação Arsesp 1.544/2024"));
        }

        // ---------- Renda ----------
        {
            double supLim = p.num("sup", "lim"), supValor = p.num("sup", "valor");
            List<Condicao> c = List.of(
                    Condicao.de("Renda por pessoa até " + brl(meio, true), pcTxt, pc <= meio),
                    Condicao.info("Morar em cidade que aderiu ao programa", "o CRAS confirma"),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "sup", "SuperAção SP", "wallet", "Governo do Estado de SP (SEDS)", soVerificar(status(c)), "Renda", "Estado de SP",
                    pc < supLim ? brl(supValor) + " por pessoa por mês e acompanhamento" : "Acompanhamento, cursos e apoio para gerar renda",
                    pc < supLim ? brl(supValor) + " por pessoa por mês, para renda abaixo de " + brl(supLim) : "Trilhas de autonomia: cursos, emprego e acompanhamento por até 2 anos",
                    "Programa estadual de superação da pobreza. Agentes buscam as famílias pelo Cadastro Único e acompanham por até dois anos, com transferência de renda para quem está abaixo de R$ 218 por pessoa e cursos e encaminhamento para trabalho. Atende só municípios que aderiram.",
                    "O CRAS confirma se a sua cidade aderiu", c, "Lei Estadual 18.176/2025"));
        }
        {
            boolean bpct = g.contains("bpct");
            List<Condicao> c = List.of(
                    Condicao.de("Pessoa com deficiência que recebe BPC", pcd || bpct ? "sim" : "não", bpct),
                    Condicao.de("Começou a trabalhar com carteira, ganhando até 2 salários mínimos", bpct ? "sim" : "não", bpct));
            L.add(add(p, "incl", "Auxílio-Inclusão", "wallet", "INSS", status(c), "Renda", null,
                    "Meio salário mínimo por mês para quem saiu do BPC para trabalhar",
                    brl(sm * 0.5, true) + " por mês, somados ao salário",
                    "Quem recebe o BPC por deficiência e consegue emprego formal não fica sem proteção: o BPC é suspenso e passa a receber meio salário mínimo por mês junto com o salário. Se perder o emprego, pode voltar ao BPC.",
                    null, c, "Lei 14.176/2021"));
        }

        // ---------- Saúde ----------
        {
            double dLim = p.num("dign", "lim"), dEst = p.num("dign", "fracEst");
            boolean men = g.contains("men");
            boolean estudante = g.contains("emp") || g.contains("est");
            boolean rendaOk = pc <= dLim || (estudante && pc <= sm * dEst) || g.contains("rua");
            boolean ok = men && rendaOk;
            List<Condicao> c = List.of(
                    Condicao.de("Pessoa de 10 a 49 anos que menstrua", men ? "sim" : "não", men),
                    Condicao.de("Renda por pessoa até " + brl(dLim) + ", ou estudante de escola pública com renda até " + brl(sm * dEst, true) + ", ou em situação de rua",
                            pcTxt, (ok || !men) ? rendaOk : false),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "dign", "Dignidade Menstrual", "heart", "Ministério da Saúde", status(c), "Saúde", null,
                    "40 absorventes grátis a cada 56 dias",
                    "40 absorventes a cada 56 dias, na Farmácia Popular",
                    "Absorventes gratuitos para quem tem de 10 a 49 anos e está no Cadastro Único em situação de pobreza, é estudante de baixa renda da rede pública ou está em situação de rua. A autorização sai no app Meu SUS Digital e é usada em farmácias credenciadas.",
                    null, c, "Lei 14.214/2021"));
        }
        {
            boolean gest = g.contains("gest");
            List<Condicao> c = List.of(
                    Condicao.de("Gestante na casa", gest ? "sim" : "não", gest),
                    Condicao.info("Fazer o pré-natal em UBS da cidade de São Paulo", "na UBS mais perto"));
            L.add(add(p, "mae", "Mãe Paulistana", "heart", "Prefeitura de SP · UBS", status(c, false, true, false), "Saúde", "Cidade de SP",
                    "Pré-natal, transporte grátis, enxoval e vaga em creche",
                    "Transporte grátis para o pré-natal, enxoval com 24 itens e vaga em creche",
                    "Gestante que faz o pré-natal na UBS tem consultas e exames, bilhete de transporte gratuito para ir às consultas (e para o bebê até 2 anos), enxoval com 24 itens a partir de 36 semanas com 7 consultas, e vaga garantida em creche se começar o pré-natal até o 4º mês.",
                    null, c, "Lei Municipal 13.211/2001 · Rede Mãe Paulistana"));
        }

        // ---------- Transporte ----------
        {
            List<Condicao> c = List.of(Condicao.de("Pessoa com 60 anos ou mais na casa", idoso ? "sim" : "não", idoso));
            L.add(add(p, "tid", "Ônibus, metrô e trem grátis 60+", "bus", "SPTrans · Metrô · CPTM", status(c, false, true, false), "Transporte", "Cidade de SP",
                    "Transporte público grátis em São Paulo para 60 anos ou mais",
                    "De 60 a 64 anos: Bilhete Único cadastrado. Com 65 ou mais: Bilhete Único Especial ou documento com foto",
                    "Na cidade de São Paulo, quem tem 60 anos ou mais não paga ônibus, metrô nem trem. De 60 a 64 anos é preciso cadastrar o Bilhete Único e recarregar a gratuidade todo mês; a partir de 65, basta o Bilhete Único Especial ou um documento com foto. Não depende de renda.",
                    null, c, "Estatuto da Pessoa Idosa, art. 39 · regras SPTrans"));
        }
        {
            List<Condicao> c = List.of(
                    Condicao.talvez("Pessoa com deficiência na casa", pcd ? "sim" : pcdTalvez ? "não sabe" : "não", pcd, pcdTalvez),
                    Condicao.info("Relatório médico no modelo da SPTrans", "o médico preenche"));
            L.add(add(p, "bupcd", "Bilhete Único Especial PcD", "bus", "SPTrans", status(c, false, false, true), "Transporte", "Cidade de SP",
                    "Ônibus, metrô e trem grátis para pessoa com deficiência",
                    "Gratuidade no transporte público, com acompanhante quando o laudo indicar",
                    "Pessoas com deficiência física, intelectual, visual, auditiva ou múltipla que gere incapacidade total ou parcial têm transporte gratuito em São Paulo. O pedido é feito no site da SPTrans, com relatório médico no modelo deles. Não depende de renda.",
                    null, c, "Decreto Municipal 58.639/2019 · regras SPTrans"));
        }
        {
            double lim = sm * p.num("plpcd", "frac");
            List<Condicao> c = List.of(
                    Condicao.talvez("Pessoa com deficiência na casa", pcd ? "sim" : pcdTalvez ? "não sabe" : "não", pcd, pcdTalvez),
                    Condicao.de("Renda por pessoa até " + brl(lim, true) + " (1 salário mínimo)", pcTxt, pc <= lim),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "plpcd", "Passe Livre Interestadual PcD", "bus", "Ministério dos Transportes · ANTT", status(c, false, false, true), "Transporte", null,
                    "Viagem grátis entre estados para pessoa com deficiência",
                    "Passagem grátis de ônibus, trem e barco entre estados, com acompanhante se o médico indicar",
                    "Para pessoa com deficiência e renda de até um salário mínimo por pessoa. Quem recebe BPC já comprova; os demais precisam estar no Cadastro Único e ter a deficiência atestada por médico no sistema do Passe Livre. O pedido é feito em passelivre.antt.gov.br com a conta gov.br.",
                    null, c, "Lei 8.899/1994 · Portaria Interministerial 2/2026"));
        }
        {
            boolean est = g.contains("emp") || g.contains("est");
            double lim = sm * p.num("ple", "frac");
            List<Condicao> c = List.of(
                    Condicao.de("Estudante na casa", est ? "sim" : "não", est),
                    Condicao.de("Renda por pessoa abaixo de " + brl(lim, true) + " (1,5 salário mínimo) para técnico e faculdade", pcTxt, g.contains("emp") || pc < lim),
                    Condicao.passo("Número do NIS informado à SPTrans", inCad ? "tem NIS" : "vem do Cadastro Único", inCad));
            L.add(add(p, "ple", "Passe Livre Estudantil", "bus", "SPTrans · EMTU", status(c), "Transporte", "Cidade de SP",
                    "Ônibus grátis para ir à escola ou faculdade",
                    "Gratuidade no Bilhete Único Estudante (e no intermunicipal da EMTU, se estudar em outra cidade)",
                    "Alunos de escola pública do fundamental e do médio têm passe livre nos ônibus municipais. Estudantes de técnico e faculdade também têm, se a renda da família for menor que 1,5 salário mínimo por pessoa ou se tiverem Prouni, Fies ou cota social. O pedido é feito no site da SPTrans.",
                    null, c, "Regras SPTrans do Bilhete Único Estudante"));
        }
        {
            boolean des = g.contains("des");
            List<Condicao> c = List.of(Condicao.de("Alguém demitido há mais de 30 e menos de 180 dias", des ? "sim" : "não", des));
            L.add(add(p, "ctd", "Cartão do Trabalhador Desempregado", "bus", "Metrô · CPTM (Governo de SP)", status(c), "Transporte", "Estado de SP",
                    "Metrô e trem grátis por 90 dias para quem foi demitido",
                    "Metrô e trem grátis por 90 dias, sem renovação",
                    "Para quem está sem emprego formal há mais de 30 e menos de 180 dias. O pedido é feito pela internet com RG, CPF, carteira de trabalho e termo de rescisão; o cartão chega em até 10 dias úteis.",
                    null, c, "Regras Metrô e CPTM"));
        }

        // ---------- Educação e trabalho ----------
        {
            boolean emp = g.contains("emp");
            List<Condicao> c = List.of(
                    Condicao.de("Estudante do ensino médio em escola pública", emp ? "sim" : "não", emp),
                    Condicao.de("Renda por pessoa até " + brl(meio, true), pcTxt, pc <= meio),
                    Condicao.info("Frequência mínima de 80% nas aulas", "manter"),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "pdm", "Pé-de-Meia", "cap", "MEC · Caixa", status(c), "Educação e trabalho", null,
                    "Poupança de até R$ 9.200 para terminar o ensino médio",
                    "Até R$ 9.200 ao longo do ensino médio, em parcelas de R$ 200 e prêmios de R$ 1.000",
                    "Incentivo para o estudante do ensino médio público, inclusive EJA, de família do Cadastro Único com renda até meio salário mínimo por pessoa. Não tem inscrição: o MEC cruza os dados da escola com o Cadastro Único, e o dinheiro cai numa poupança no Caixa Tem.",
                    null, c, "Lei 14.818/2024"));
        }
        {
            boolean quer = g.contains("fac");
            double integral = sm * p.num("prouni", "integral"), parcial = sm * p.num("prouni", "parcial");
            List<Condicao> c = List.of(
                    Condicao.de("Quer fazer faculdade e fez o Enem (média 450, redação não zerada)", quer ? "sim" : "não", quer),
                    Condicao.de("Renda por pessoa até " + brl(parcial) + " (3 salários mínimos)", pcTxt, pc <= parcial),
                    Condicao.info("Ensino médio em escola pública ou como bolsista", "confirmar"));
            L.add(add(p, "prouni", "Prouni", "cap", "MEC", status(c), "Educação e trabalho", null,
                    pc <= integral ? "Bolsa de 100% em faculdade particular" : "Bolsa de 50% em faculdade particular",
                    pc <= integral ? "Bolsa integral (renda até " + brl(integral, true) + " por pessoa)" : "Bolsa parcial de 50% (renda até " + brl(parcial) + " por pessoa)",
                    "Bolsas em faculdades particulares para quem fez o Enem. A seleção usa a nota e acontece duas vezes por ano, no Portal Acesso Único, com a conta gov.br.",
                    null, c, "Lei 11.096/2005"));
        }
        {
            boolean quer = g.contains("fac");
            List<Condicao> c = List.of(
                    Condicao.de("Quer fazer faculdade e fez o Enem", quer ? "sim" : "não", quer),
                    Condicao.de("Renda por pessoa até " + brl(meio, true), pcTxt, pc <= meio),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "fies", "Fies Social", "cap", "MEC · FNDE", status(c), "Educação e trabalho", null,
                    "Financiamento de até 100% da faculdade",
                    "Financiamento de até 100% do curso, com metade das vagas do Fies reservada",
                    "Modalidade do Fies para estudantes do Cadastro Único com renda até meio salário mínimo por pessoa: metade das vagas é reservada e o financiamento pode cobrir todo o curso.",
                    null, c, "Lei 10.260/2001 (Fies)"));
        }
        {
            boolean alvo = g.contains("fac") || g.contains("jov") || g.contains("des") || g.contains("des6");
            List<Condicao> c = List.of(
                    Condicao.de("Alguém vai prestar concurso federal ou o Enem", alvo ? "provável" : "não informado", alvo),
                    Condicao.de("Renda por pessoa até " + brl(meio, true), pcTxt, pc <= meio),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "isen", "Isenção de taxa em concursos e no Enem", "doc", "Órgão do concurso · Inep", status(c), "Educação e trabalho", null,
                    "Inscrição grátis em concursos federais e no Enem",
                    "Não paga a taxa de inscrição; basta informar o NIS no prazo do edital",
                    "Quem é de família do Cadastro Único com renda até meio salário mínimo por pessoa pode pedir isenção da taxa em concursos federais. O pedido é feito na inscrição, informando o NIS, dentro do prazo do edital.",
                    null, c, "Lei 13.656/2018"));
        }
        {
            boolean clt = g.contains("clt");
            double lim = p.num("abono", "lim");
            List<Condicao> c = List.of(
                    Condicao.de("Alguém trabalhou com carteira assinada em 2024", clt ? "sim" : "não", clt),
                    Condicao.info("Média de salário em 2024 até " + brl(lim) + " e PIS há 5 anos ou mais", "confirmar no app"));
            L.add(add(p, "abono", "Abono salarial (PIS/Pasep)", "brief", "Ministério do Trabalho · Caixa e Banco do Brasil", soVerificar(status(c)), "Educação e trabalho", null,
                    "Até " + brl(sm) + " por ano para quem trabalhou com carteira",
                    "Até " + brl(sm) + ", proporcional aos meses trabalhados em 2024",
                    "Pago uma vez por ano a quem trabalhou com carteira pelo menos 30 dias no ano-base, com média de até " + brl(lim) + " por mês. Empregados domésticos não recebem. A consulta é feita na Carteira de Trabalho Digital; o calendário de 2026 vai até 30 de dezembro.",
                    "Confira na Carteira de Trabalho Digital · saque até 30/12/2026", c, "Lei 7.998/1990 · Emenda Constitucional 135/2024"));
        }
        {
            boolean des = g.contains("des");
            List<Condicao> c = List.of(
                    Condicao.de("Alguém demitido sem justa causa há até 4 meses", des ? "sim" : "não", des),
                    Condicao.info("Tempo de carteira: 12 meses (1º pedido), 9 meses (2º) ou 6 meses (3º em diante)", "confirmar"));
            L.add(add(p, "segd", "Seguro-desemprego", "brief", "Ministério do Trabalho", soVerificar(status(c)), "Educação e trabalho", null,
                    "De 3 a 5 parcelas para quem foi demitido",
                    "De 3 a 5 parcelas, conforme o tempo trabalhado",
                    "Para quem foi demitido sem justa causa. O pedido é feito na Carteira de Trabalho Digital ou no gov.br, entre 7 e 120 dias depois da demissão, com o termo de rescisão.",
                    "Peça em até 120 dias da demissão", c, "Lei 7.998/1990 · Lei 13.134/2015"));
        }
        {
            boolean des6 = g.contains("des6");
            List<Condicao> c = List.of(
                    Condicao.de("Sem emprego formal há 6 meses ou mais, sem seguro-desemprego", des6 ? "sim" : "não", des6),
                    Condicao.info("Ter 18 anos ou mais e morar em São Paulo há 2 anos", "confirmar"));
            L.add(add(p, "pot", "POT · Programa Operação Trabalho", "brief", "Prefeitura de SP (SMDET)", soVerificar(status(c)), "Educação e trabalho", "Cidade de SP",
                    "Bolsa e curso para voltar ao trabalho",
                    "Bolsa de " + brl(p.num("pot", "bolsa")) + " por mês nos projetos atuais, com 30 horas semanais de atividade e qualificação",
                    "Programa da Prefeitura para desempregados de baixa renda: a pessoa trabalha em projetos públicos e faz cursos nos Centros POT, recebendo uma bolsa. As vagas abrem por projeto, no Portal Cate.",
                    "Depende de vagas abertas no Portal Cate", c, "Lei Municipal 18.064/2023"));
        }

        // ---------- Moradia e alimentação ----------
        {
            boolean semCasa = g.contains("casa");
            double lim = p.num("mcmv", "lim");
            List<Condicao> c = List.of(
                    Condicao.de("A família não tem casa própria", semCasa ? "sim" : "não", semCasa),
                    Condicao.de("Renda da casa até " + brl(lim) + " (sem contar Bolsa Família e BPC)", brl(renda), renda <= lim),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "mcmv", "Minha Casa, Minha Vida (Faixa 1)", "home", "Prefeitura (SEHAB/COHAB) · Caixa", soVerificar(status(c)), "Moradia e alimentação", null,
                    "Casa com até 95% de subsídio; sem parcelas para quem tem Bolsa Família ou BPC",
                    "Subsídio de até 95%; imóvel sem prestações para quem recebe Bolsa Família ou BPC",
                    "A Faixa 1 é para famílias com renda bruta de até " + brl(lim) + " por mês em 2026. A inscrição é feita na prefeitura, que seleciona as famílias. Quem recebe Bolsa Família ou BPC não paga prestações.",
                    "A inscrição é na prefeitura; estar inscrito não garante a casa", c, "Lei 14.620/2023 · Portaria MCID 333/2026"));
        }
        {
            List<Condicao> c = List.of(Condicao.de("Renda por pessoa até 1 salário mínimo ou em situação de rua", pcTxt, pc <= sm || g.contains("rua")));
            L.add(add(p, "bom", "Bom Prato", "food", "Governo do Estado de SP", status(c, false, true, false), "Moradia e alimentação", "Estado de SP",
                    "Almoço por R$ 1 e café da manhã por R$ 0,50",
                    "Almoço e jantar a R$ 1; café da manhã a R$ 0,50",
                    "Restaurantes do Governo de SP com refeição completa (arroz, feijão, proteína, salada e fruta) a preço simbólico. Não precisa de cadastro: é só chegar.",
                    null, c, "Decreto Estadual 70.225/2025"));
        }

        // ---------- Documentos e descontos ----------
        {
            boolean jov = g.contains("jov");
            double lim = sm * p.num("idj", "totSM");
            List<Condicao> c = List.of(
                    Condicao.de("Jovem de 15 a 29 anos na casa", jov ? "sim" : "não", jov),
                    Condicao.de("Renda da casa até " + brl(lim) + " (2 salários mínimos)", brl(renda), renda <= lim),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "idj", "ID Jovem", "id", "Secretaria Nacional de Juventude", status(c), "Documentos e descontos", null,
                    "Meia-entrada e viagens grátis entre estados",
                    "Meia-entrada em cultura e esporte e 2 vagas grátis por ônibus interestadual",
                    "Documento digital para jovens de 15 a 29 anos de família com renda de até 2 salários mínimos no Cadastro Único atualizado. Não precisa ser estudante. É emitido no app ID Jovem.",
                    null, c, "Decreto 8.537/2015"));
        }
        {
            double lim = sm * p.num("cpi", "sm2");
            double propria = x.pessoas() == 1 ? renda : pc;
            List<Condicao> c = List.of(
                    Condicao.de("Pessoa com 60 anos ou mais na casa", idoso ? "sim" : "não", idoso),
                    Condicao.de("Renda própria até " + brl(lim) + " (2 salários mínimos)", brl(propria), propria <= lim),
                    cadastro(inCad, "Estar no Cadastro Único (feito no CRAS)"));
            L.add(add(p, "cpi", "Carteira da Pessoa Idosa", "id", "MDS", status(c), "Documentos e descontos", null,
                    "Viagem grátis ou com 50% de desconto entre estados",
                    "2 vagas grátis por ônibus interestadual e 50% de desconto quando acabarem",
                    "Documento digital que comprova renda para usar o direito do Estatuto da Pessoa Idosa no transporte interestadual: duas vagas gratuitas por veículo e, depois, desconto de pelo menos 50%.",
                    null, c, "Lei 10.741/2003 (Estatuto da Pessoa Idosa), art. 40"));
        }
        return L;
    }

    private static Condicao cadastro(boolean inCad, String texto) {
        return Condicao.passo(texto, inCad ? "já está" : "falta fazer", inCad);
    }

    private static ResultadoBeneficio novo(String id, String nome, String icon, int v, String orgao) {
        ResultadoBeneficio b = new ResultadoBeneficio();
        b.id = id;
        b.nome = nome;
        b.icon = icon;
        b.v = v;
        b.orgao = orgao;
        return b;
    }

    /** Monta um dos 23 benefícios adicionais; a versão vem da chave de mesmo nome nos parâmetros. */
    private static ResultadoBeneficio add(Parametros p, String id, String nome, String icon, String orgao, String status,
                                          String cat, String esf, String resumo, String valor, String desc, String nota,
                                          List<Condicao> conds, String lei) {
        ResultadoBeneficio b = novo(id, nome, icon, p.versao(id), orgao);
        b.status = status;
        b.cat = cat;
        b.esf = esf;
        b.resumo = resumo;
        b.valor = valor;
        b.desc = desc;
        b.nota = nota;
        b.conds.addAll(conds);
        b.lei = lei;
        return b;
    }
}
