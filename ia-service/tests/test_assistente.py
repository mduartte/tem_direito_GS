from fastapi.testclient import TestClient

from app import llm
from app.main import app
from app.prompt import ler_fontes, regra_seguranca, tirar_fontes
from app.rag import normalizar, recuperar

cli = TestClient(app)


def perguntar(base, texto, contexto=None):
    corpo = {"pergunta": texto, "base": base}
    if contexto:
        corpo["contexto"] = contexto
    r = cli.post("/perguntar", json=corpo)
    assert r.status_code == 200
    return r.json()


def test_saude_em_modo_local():
    assert cli.get("/saude").json() == {"ok": True, "llm": "modo local"}


def test_normalizar_tira_acento():
    assert normalizar("Família Ângela") == "familia angela"


def test_rag_acha_beneficio_por_sinonimo(base):
    assert recuperar("como pago menos na conta de luz?", base["beneficios"])[0]["id"] == "tar"
    assert recuperar("minha mãe tem 70 anos, ela pode pedir o loas?", base["beneficios"])[0]["id"] == "bpci"


def test_golpe_tem_resposta_fixa(base):
    r = perguntar(base, "Um moço pediu um pix de 50 reais para liberar meu Bolsa Família")
    assert r["modo"] == "regra" and "golpe" in r["texto"]


def test_nao_aceita_cpf(base):
    r = perguntar(base, "meu cpf é 123.456.789-00, tenho direito?")
    assert r["regra"] == "dados" and "Não mande" in r["texto"]


def test_crise_indica_cvv(base):
    r = perguntar(base, "não quero mais viver")
    assert "188" in r["texto"]


def test_negado_orienta_recurso(base):
    assert "30 dias" in perguntar(base, "meu BPC foi negado")["texto"]


def test_modo_local_usa_status_da_triagem(base):
    r = perguntar(base, "Quem tem direito ao BPC?", {"feito": True, "texto": "...", "status": {"bpci": "prov"}})
    assert r["modo"] == "local" and r["fontes"] == ["bpci"]
    assert "provável" in r["texto"] and "você tem direito" not in r["texto"].lower()


def test_modo_local_documentos(base):
    r = perguntar(base, "O que eu levo no CRAS?")
    assert "Comprovante de endereço" in r["texto"]


def test_fora_da_base_encaminha(base):
    r = perguntar(base, "qual a previsão do tempo amanhã?")
    assert "121" in r["texto"] and "135" in r["texto"]


def test_fontes_so_aceita_ids_validos():
    bruto = "O BPC paga um salário.\nFONTES: bpci, inventado, cad"
    assert tirar_fontes(bruto) == "O BPC paga um salário."
    assert ler_fontes(bruto, {"bpci", "cad"}) == ["bpci", "cad"]


def test_regra_seguranca_nao_dispara_em_pergunta_normal():
    assert regra_seguranca("Quanto é o Bolsa Família?") is None


def test_com_llm_usa_so_base_recuperada(base, monkeypatch):
    capturado = {}

    def falso(sistema, mensagens):
        capturado["sistema"], capturado["msgs"] = sistema, mensagens
        return "A Tarifa Social dá desconto na luz.\nFONTES: tar"

    monkeypatch.setenv("ANTHROPIC_API_KEY", "teste")
    monkeypatch.setattr(llm, "gerar", falso)
    r = cli.post("/perguntar", json={"pergunta": "desconto na conta de luz", "base": base,
                                     "historico": [{"role": "assistant", "content": "Oi"}, {"role": "user", "content": "oi"}]}).json()
    assert r["modo"] == "ia" and r["fontes"] == ["tar"]
    assert "[tar]" in capturado["sistema"] and "[bpci]" not in capturado["sistema"]
    assert capturado["msgs"][0]["role"] == "user" and capturado["msgs"][-1]["content"].endswith("desconto na conta de luz")


def test_llm_falhando_cai_no_modo_local(base, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "teste")

    def quebra(*a):
        raise RuntimeError("fora do ar")

    monkeypatch.setattr(llm, "gerar", quebra)
    assert perguntar(base, "Quanto é o Bolsa Família?")["modo"] == "local"
