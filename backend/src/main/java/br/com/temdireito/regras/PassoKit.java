package br.com.temdireito.regras;

import java.util.ArrayList;
import java.util.List;

/**
 * Um passo do Kit do Direito: aonde ir, o que levar e o que dizer no balcão.
 *
 * <p>O Kit transforma o resultado em ação: cada passo vira uma aba no app,
 * com uma lista de documentos para marcar e a frase pronta para quem tem
 * vergonha ou dificuldade de explicar o pedido.</p>
 */
public class PassoKit {

    /** Identificador estável do passo (cras, inss, luz, farm...), usado no estado do app. */
    public String id;
    /** Nome curto para a aba ("CRAS", "INSS", "Luz"). */
    public String curto;
    public String titulo;
    public String onde;
    /** Frase para dizer no balcão. */
    public String frase;
    public List<String> docs = new ArrayList<>();

    public PassoKit() {
    }

    public PassoKit(String id, String curto, String titulo, String onde, String frase, List<String> docs) {
        this.id = id;
        this.curto = curto;
        this.titulo = titulo;
        this.onde = onde;
        this.frase = frase;
        this.docs = new ArrayList<>(docs);
    }
}
