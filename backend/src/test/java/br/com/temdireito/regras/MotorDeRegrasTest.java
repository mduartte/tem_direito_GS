package br.com.temdireito.regras;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Testes do motor puro, sem Spring: os mesmos casos que travam a publicação de uma regra. */
class MotorDeRegrasTest {

    private final MotorDeRegras motor = new MotorDeRegras();

    @Test
    void osDezCasosDeTestePassamComAsRegrasPadrao() {
        List<CasosDeTeste.Execucao> r = CasosDeTeste.rodar(motor, RegrasPadrao.criar());
        assertEquals(10, r.size());
        r.forEach(c -> assertTrue(c.passou(), c.nome() + ": " + c.falhas()));
    }

    @Test
    void avaliaSempreOs29Beneficios() {
        Respostas a = new Respostas();
        a.pessoas = 2;
        assertEquals(29, motor.avaliar(a, RegrasPadrao.criar()).size());
    }

    @Test
    void idosoSozinhoSemRendaTemBpcProvavel() {
        Respostas a = Respostas.de(1, 70, "nao", 0.0, "nao", "nao", "nao", "nao", "sim", List.of());
        ResultadoBeneficio bpc = motor.avaliar(a, RegrasPadrao.criar()).stream().filter(b -> b.id.equals("bpci")).findFirst().orElseThrow();
        assertEquals("prov", bpc.status);
    }

    @Test
    void mudarLimiteNoRascunhoMudaOResultado() {
        Respostas a = Respostas.de(1, 70, "nao", 300.0, "nao", "nao", "nao", "nao", "sim", List.of());
        Parametros p = RegrasPadrao.criar();
        assertEquals("prov", status(a, p, "bpci"));
        java.util.Map<String, Object> c = new java.util.LinkedHashMap<>(p.campos("bpcI"));
        c.put("frac", 0.1);
        p.regra("bpcI", c);
        assertEquals("nao", status(a, p, "bpci"));
    }

    @Test
    void kitPedeCadastroUnicoQuandoPrecisa() {
        Respostas a = Respostas.de(3, 35, "nao", 900.0, "nao", "sim", "nao", "nao", "sim", List.of());
        List<PassoKit> kit = new KitService().montar(a, motor.avaliar(a, RegrasPadrao.criar()));
        assertFalse(kit.isEmpty());
        assertEquals("cras", kit.get(0).id);
    }

    @Test
    void formatacaoIgualAoNavegador() {
        assertEquals("R$ 1.621", Formatacao.brl(1621));
    }

    private String status(Respostas a, Parametros p, String id) {
        return motor.avaliar(a, p).stream().filter(b -> b.id.equals(id)).findFirst().orElseThrow().status;
    }
}
