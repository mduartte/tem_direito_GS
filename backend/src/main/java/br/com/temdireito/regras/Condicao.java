package br.com.temdireito.regras;

/**
 * Uma condição de um benefício, do jeito que o cidadão vê na tela "Por que achamos que você tem direito".
 *
 * @param t      texto da condição ("Renda por pessoa até R$ 405,25")
 * @param val    o que a pessoa informou ("R$ 380,00")
 * @param ok     se a condição foi cumprida
 * @param passo  {@code true} quando é um passo que dá para resolver depois (ex.: fazer o Cadastro Único);
 *               não reprova o benefício, só vira tarefa no Kit do Direito
 * @param info   {@code true} quando é só informativa (ex.: "o CRAS confirma"); não entra na decisão
 * @param talvez {@code true} quando a pessoa respondeu "não sei"; pode levar ao status "vale verificar"
 */
public record Condicao(String t, String val, boolean ok, boolean passo, boolean info, boolean talvez) {

    public static Condicao de(String t, String val, boolean ok) {
        return new Condicao(t, val, ok, false, false, false);
    }

    public static Condicao passo(String t, String val, boolean ok) {
        return new Condicao(t, val, ok, true, false, false);
    }

    public static Condicao info(String t, String val) {
        return new Condicao(t, val, true, false, true, false);
    }

    public static Condicao talvez(String t, String val, boolean ok, boolean talvez) {
        return new Condicao(t, val, ok, false, false, talvez);
    }
}
