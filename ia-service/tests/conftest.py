"""Base de teste parecida com a que o backend manda (subset dos 29 benefícios)."""
import pytest

BASE = {
    "beneficios": [
        {"id": "cad", "nome": "Cadastro Único", "orgao": "CRAS", "desc": "É a porta de entrada dos benefícios.", "valor": "Não é dinheiro",
         "texto": "[cad] Cadastro Único (Federal · Renda). Quem decide: CRAS. É a porta de entrada dos benefícios. Condições: renda por pessoa até meio salário mínimo."},
        {"id": "bpci", "nome": "BPC Idoso", "orgao": "INSS", "desc": "Um salário mínimo por mês para pessoa idosa.", "valor": "R$ 1.621 por mês",
         "texto": "[bpci] BPC Idoso (Federal · Renda). Quem decide: INSS. Um salário mínimo por mês. Condições: 65 anos ou mais; renda por pessoa até 1/4 do salário mínimo."},
        {"id": "tar", "nome": "Tarifa Social de Energia", "orgao": "Distribuidora", "desc": "Desconto na conta de luz.", "valor": "Até 100% de desconto",
         "texto": "[tar] Tarifa Social de Energia (Federal · Contas da casa). Quem decide: distribuidora. Desconto na conta de luz."},
        {"id": "bolsa", "nome": "Bolsa Família", "orgao": "CRAS / MDS", "desc": "Dinheiro todo mês para famílias.", "valor": "A partir de R$ 600",
         "texto": "[bolsa] Bolsa Família (Federal · Renda). Quem decide: MDS. Dinheiro todo mês. Condições: renda por pessoa até R$ 218."},
    ],
    "kit": ["Cadastro Único no CRAS (onde: CRAS): Documento com foto e CPF de todos; Comprovante de endereço; Carteira de trabalho. Frase para o balcão: \"Quero fazer o Cadastro Único.\""],
}


@pytest.fixture
def base():
    return BASE


@pytest.fixture(autouse=True)
def sem_chave(monkeypatch):
    """Por padrão os testes rodam em modo local, sem chamar nenhum LLM."""
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
