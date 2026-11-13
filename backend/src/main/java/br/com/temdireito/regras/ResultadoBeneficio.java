package br.com.temdireito.regras;

import java.util.ArrayList;
import java.util.List;

/**
 * Resultado da avaliação de um benefício para uma família.
 *
 * <p>Carrega tudo o que o app mostra no cartão e na tela de detalhe: status,
 * resumo, valor, explicação, condições, quem decide e a base legal, além da
 * versão da regra usada (auditoria: "por que o app disse isso?").</p>
 *
 * <p>Status possíveis (mesmos códigos do app):</p>
 * <ul>
 *   <li>{@code prov}: provável, precisa pedir;</li>
 *   <li>{@code pode}: pode usar já, sem pedido (ex.: Farmácia Popular);</li>
 *   <li>{@code ver}: vale verificar, depende de fato que o app não pergunta;</li>
 *   <li>{@code tem}: já tem (ex.: já está no Cadastro Único);</li>
 *   <li>{@code nao}: não se aplica pelo que a pessoa contou.</li>
 * </ul>
 */
public class ResultadoBeneficio {

    public String id;
    public String nome;
    public String icon;
    public int v;
    public String orgao;
    public String status;
    public String resumo;
    public String valor;
    public String desc;
    /** Texto simples revisado pela assistente social (só alguns benefícios têm). */
    public String texto;
    /** Aviso curto que aparece no cartão ("Depende de vagas abertas no Portal Cate"). */
    public String nota;
    public List<Condicao> conds = new ArrayList<>();
    /** "basta uma" quando basta cumprir uma das condições de renda (Cadastro Único). */
    public String logica;
    public String lei;
    /** Área do resultado: Renda, Contas da casa, Saúde, Educação e trabalho, Transporte, Moradia e alimentação, Documentos e descontos. */
    public String cat;
    /** Esfera: Federal, Estado de SP ou Cidade de SP. */
    public String esf;

    /** Ativo = aparece na lista principal do resultado (provável, pode usar ou vale verificar). */
    public boolean ativo() {
        return "prov".equals(status) || "pode".equals(status) || "ver".equals(status);
    }

    /** Falta fazer o Cadastro Único para este benefício. */
    public boolean precisaCadastro() {
        return conds.stream().anyMatch(c -> c.passo() && !c.ok() && c.t().contains("Cadastro"));
    }
}
