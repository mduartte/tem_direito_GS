package br.com.temdireito.regras;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Respostas da triagem, exatamente como o cidadão informou no app.
 *
 * <p>É a entrada do {@link MotorDeRegras}. Os campos de escolha usam os mesmos
 * códigos curtos das perguntas do frontend ({@code "sim"}, {@code "nao"},
 * {@code "naosei"}, {@code "semluz"}), para que app, API e protótipo falem a
 * mesma língua.</p>
 *
 * <p>Nada aqui identifica a pessoa: não há nome, CPF, NIS nem telefone. Por
 * isso a triagem pode ser avaliada sem login (regra 1 do CLAUDE.md).</p>
 */
public class Respostas {

    /** Pessoas que moram na casa, contando quem responde. Mínimo 1. */
    public int pessoas = 1;
    /** Idade de quem responde (ou da pessoa ajudada). {@code null} se não informou. */
    public Integer idade;
    /** Alguém com deficiência de longo prazo: sim, nao, naosei. */
    public String pcd;
    /** Renda total da casa por mês, em reais. {@code null} se não informou. */
    public Double renda;
    /** Alguém já recebe aposentadoria, pensão ou BPC: sim, nao. */
    public String aposent;
    /** Há crianças ou adolescentes: sim, nao (derivado dos grupos no app). */
    public String criancas;
    /** Situações da casa marcadas na pergunta de múltipla escolha (c06, gest, des...). */
    public Set<String> grupos = new LinkedHashSet<>();
    /** Família já está no Cadastro Único: sim, nao, naosei. */
    public String cad;
    /** Alguém usa remédio de uso contínuo: sim, nao. */
    public String remedio;
    /** Conta de luz: sim (no nome da casa), nao (no nome do dono), semluz. */
    public String luz;
    /** CEP informado, só para achar o atendimento mais perto. */
    public String cep;
    /** Bairro (vem do CEP ou da escolha manual). */
    public String bairro;
    /** Cidade e UF: decidem se os benefícios do Estado e da cidade de São Paulo valem. O motor não usa. */
    public String cidade;
    public String uf;

    public Respostas() {
    }

    /** Atalho usado nos casos de teste e no simulador. */
    public static Respostas de(int pessoas, Integer idade, String pcd, Double renda, String aposent,
                               String criancas, String cad, String remedio, String luz, List<String> grupos) {
        Respostas r = new Respostas();
        r.pessoas = pessoas;
        r.idade = idade;
        r.pcd = pcd;
        r.renda = renda;
        r.aposent = aposent;
        r.criancas = criancas;
        r.cad = cad;
        r.remedio = remedio;
        r.luz = luz;
        if (grupos != null) {
            r.grupos.addAll(grupos);
        }
        return r;
    }

    /** Renda por pessoa, do mesmo jeito do protótipo: renda negativa ou vazia vira zero. */
    public double rendaPorPessoa() {
        int p = Math.max(1, pessoas);
        double rd = renda == null ? 0 : Math.max(0, renda);
        return rd / p;
    }
}
