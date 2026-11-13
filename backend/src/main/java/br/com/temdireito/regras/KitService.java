package br.com.temdireito.regras;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

/**
 * Monta o Kit do Direito a partir do resultado do motor de regras.
 *
 * <p>Tradução da função {@code montarKit()} do protótipo. Cada passo só entra
 * se algum benefício ativo precisar dele, e na ordem em que a família deve
 * resolver: primeiro o Cadastro Único no CRAS (porta de entrada), depois os
 * pedidos em cada órgão.</p>
 *
 * <p>Os documentos-base de cada passo podem ser trocados pelo painel (tela
 * "Documentos e passos"): quem chama pode passar {@code docsBase} com a lista
 * editada. Documentos condicionais (ex.: laudo médico só para BPC de pessoa
 * com deficiência) continuam aqui, porque dependem da regra.</p>
 */
public class KitService {

    /** Documentos-base padrão de cada passo, iguais aos do protótipo. */
    public static final Map<String, List<String>> DOCS_PADRAO = Map.of(
            "cras", List.of("Documento com foto do responsável (RG ou CNH)", "RG ou certidão de nascimento de cada morador",
                    "CPF de todos da casa", "Comprovante de endereço recente", "Carteira de trabalho, se tiver"),
            "inss", List.of("Número do CPF", "Comprovante do Cadastro Único atualizado", "Documento com foto"),
            "luz", List.of("Conta de luz recente", "Número do NIS (vem do Cadastro Único)"),
            "mae", List.of("Cartão SUS (ou RG e comprovante de endereço para fazer)", "Teste de gravidez, se tiver"),
            "casa", List.of("Documento com foto e CPF de todos", "Comprovante do Cadastro Único", "Comprovante de renda", "Comprovante de endereço"));

    public List<PassoKit> montar(Respostas a, List<ResultadoBeneficio> res) {
        return montar(a, res, DOCS_PADRAO);
    }

    public List<PassoKit> montar(Respostas a, List<ResultadoBeneficio> res, Map<String, List<String>> docsBase) {
        Predicate<String> on = id -> res.stream().anyMatch(b -> b.id.equals(id)
                && ("prov".equals(b.status) || "ver".equals(b.status) || "pode".equals(b.status)));
        java.util.function.Function<String, List<String>> base = k -> new ArrayList<>(docsBase.getOrDefault(k, DOCS_PADRAO.getOrDefault(k, List.of())));

        boolean precisaCad = !"sim".equals(a.cad) && res.stream().anyMatch(b ->
                ("cad".equals(b.id) && on.test("cad"))
                        || (on.test(b.id) && b.conds.stream().anyMatch(c -> c.passo() && !c.ok() && c.t().contains("Cadastro"))));

        List<PassoKit> passos = new ArrayList<>();
        if (precisaCad) {
            passos.add(new PassoKit("cras", "CRAS", "Cadastro Único no CRAS", "CRAS",
                    "Quero fazer o Cadastro Único" + (on.test("bpci") || on.test("bpcp") ? " para pedir o BPC" : "") + ".", base.apply("cras")));
        }
        if (on.test("bpci") || on.test("bpcp")) {
            List<String> d = base.apply("inss");
            if (on.test("bpcp")) d.add("Laudo médico com CID e assinatura");
            passos.add(new PassoKit("inss", "INSS", "Pedido do BPC no INSS", "Meu INSS ou telefone 135",
                    "Quero pedir o Benefício de Prestação Continuada.", d));
        }
        if (on.test("tar")) {
            List<String> d = base.apply("luz");
            if ("nao".equals(a.luz)) d.add("Pedido de troca de titularidade da conta");
            passos.add(new PassoKit("luz", "Luz", "Tarifa Social na conta de luz", "Distribuidora (Enel SP)",
                    "Quero a Tarifa Social de Energia Elétrica.", d));
        }
        if (on.test("farm") || on.test("dign")) {
            List<String> d = new ArrayList<>();
            if (on.test("farm")) d.add("Receita médica dentro da validade");
            d.add("Documento com foto e CPF");
            if (on.test("dign")) d.add("Autorização do Dignidade Menstrual (app Meu SUS Digital)");
            passos.add(new PassoKit("farm", "Farmácia", on.test("farm") ? "Retirar na Farmácia Popular" : "Absorventes na Farmácia Popular",
                    "Farmácia com o selo “Aqui tem Farmácia Popular”",
                    on.test("farm") ? "Quero retirar pelo Farmácia Popular." : "Quero retirar os absorventes do Dignidade Menstrual.", d));
        }
        if (List.of("gas", "agua", "desc", "pdm", "sup").stream().anyMatch(on)) {
            List<String> d = new ArrayList<>(List.of("Manter o Cadastro Único atualizado (pelo menos a cada 2 anos)"));
            if (on.test("gas")) d.add("Gás do Povo: ver o vale no app Meu Social");
            if (on.test("agua")) d.add("Água: se o desconto não vier na conta, ligar para a Sabesp com CPF e NIS");
            if (on.test("desc")) d.add("Luz: conferir “Desconto Social” na conta");
            if (on.test("pdm")) d.add("Pé-de-Meia: estudante frequentando 80% das aulas");
            if (on.test("sup")) d.add("SuperAção SP: perguntar no CRAS se a cidade aderiu");
            passos.add(new PassoKit("auto", "Automáticos", "Benefícios que chegam sozinhos depois do cadastro",
                    "Não precisa pedir: o governo cruza o Cadastro Único",
                    "Meu Cadastro Único está atualizado? Quero conferir se meus dados estão certos.", d));
        }
        if (List.of("idj", "cpi", "isen").stream().anyMatch(on)) {
            List<String> d = new ArrayList<>(List.of("Número do NIS"));
            if (on.test("idj")) d.add("ID Jovem: emitir no app ID Jovem");
            if (on.test("cpi")) d.add("Carteira da Pessoa Idosa: emitir no site do gov.br ou no CRAS");
            if (on.test("isen")) d.add("Isenção: informar o NIS na inscrição, dentro do prazo do edital");
            passos.add(new PassoKit("docs", "Carteirinhas", "Documentos digitais e isenções", "Pelo celular, depois do Cadastro Único",
                    "Quero emitir minha carteirinha com o meu NIS.", d));
        }
        boolean sp = List.of("tid", "bupcd", "ple", "ctd").stream().anyMatch(on);
        if (sp || on.test("plpcd")) {
            List<String> d = new ArrayList<>(List.of("Documento com foto e CPF", "Comprovante de endereço"));
            if (on.test("tid")) d.add("60+: Bilhete Único cadastrado (65+ pode usar só o documento)");
            if (on.test("bupcd")) d.add("PcD: relatório médico no modelo da SPTrans");
            if (on.test("ple")) d.add("Estudante: matrícula e NIS");
            if (on.test("ctd")) d.add("Desempregado: carteira de trabalho e termo de rescisão");
            if (on.test("plpcd")) d.add("Viagem entre estados: atestado do médico no sistema do Passe Livre");
            passos.add(new PassoKit("transp", "Transporte", "Transporte grátis",
                    sp ? "Site da SPTrans (atendimento.sptrans.com.br)" : "passelivre.antt.gov.br",
                    "Quero pedir a gratuidade no transporte.", d));
        }
        if (List.of("segd", "abono", "pot", "incl").stream().anyMatch(on)) {
            List<String> d = new ArrayList<>(List.of("CPF e carteira de trabalho"));
            if (on.test("segd")) d.add("Seguro-desemprego: termo de rescisão (pedir em até 120 dias)");
            if (on.test("abono")) d.add("Abono: consultar na Carteira de Trabalho Digital até 30/12/2026");
            if (on.test("pot")) d.add("POT: inscrição no Portal Cate quando abrir vaga");
            if (on.test("incl")) d.add("Auxílio-Inclusão: pedir no Meu INSS ou pelo 135");
            passos.add(new PassoKit("trab", "Trabalho", "Trabalho e renda", "Carteira de Trabalho Digital, Meu INSS ou Portal Cate",
                    "Quero pedir o meu benefício de trabalhador.", d));
        }
        if (on.test("prouni") || on.test("fies")) {
            List<String> d = new ArrayList<>(List.of("Número de inscrição e notas do Enem", "Comprovante de renda da família", "Histórico do ensino médio"));
            if (on.test("fies")) d.add("Comprovante do Cadastro Único");
            passos.add(new PassoKit("estudo", "Faculdade", "Bolsa ou financiamento na faculdade", "Portal Acesso Único (com a conta gov.br)",
                    "Quero me inscrever no Prouni e no Fies Social.", d));
        }
        if (on.test("mae")) {
            passos.add(new PassoKit("mae", "UBS", "Pré-natal pelo Mãe Paulistana", "UBS mais perto",
                    "Quero começar o pré-natal pelo Mãe Paulistana.", base.apply("mae")));
        }
        if (on.test("mcmv")) {
            passos.add(new PassoKit("casa", "Moradia", "Inscrição no Minha Casa, Minha Vida", "Prefeitura (SEHAB/COHAB)",
                    "Quero me inscrever na Faixa 1 do Minha Casa, Minha Vida.", base.apply("casa")));
        }
        return passos;
    }
}
