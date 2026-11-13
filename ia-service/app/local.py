"""Modo local: responde sem IA, só com a base recuperada.

É o respostaLocal() do protótipo. Roda quando não há chave de LLM configurada
ou quando o provedor falha, para o assistente nunca ficar mudo.
"""
from __future__ import annotations

from .prompt import ENCAMINHAR
from .rag import normalizar, recuperar

FRASE_STATUS = {
    "prov": "Pelo que você contou na triagem, é provável que você possa receber.",
    "pode": "Pelo que você contou, você já pode usar.",
    "ver": "Pelo que você contou, vale verificar no órgão responsável.",
    "tem": "Pela triagem, você já recebe.",
    "nao": "Pelo que você contou na triagem, este não se aplica agora.",
}


def resposta_local(pergunta: str, beneficios: list[dict], kit: list[str], status: dict[str, str] | None) -> dict:
    q = normalizar(pergunta)
    achados = recuperar(pergunta, beneficios, k=1)
    # Sem benefício citado, mas pergunta sobre documentos: mostra o passo do CRAS (primeiro do Kit).
    if (not achados or achados[0]["score"] < 1.5) and any(p in q for p in ("levar", "documento", "cras", "papel")) and kit:
        passo = kit[0]
        titulo, _, resto = passo.partition(": ")
        docs, _, frase = resto.partition(". Frase para o balcão: ")
        linhas = "\n".join("• " + d.strip() for d in docs.split(";")[:4])
        return {"texto": f"Para o {titulo.split(' (')[0]}, leve:\n{linhas}\nNo balcão, diga: “{frase.strip(chr(34))}”", "fontes": ["cad"]}
    if not achados:
        return {"texto": ENCAMINHAR, "fontes": []}
    b = achados[0]
    st = (status or {}).get(b["id"])
    frase = FRASE_STATUS.get(st, "Faça a triagem para saber se combina com a sua família.")
    return {"texto": f"{b['nome']}: {b.get('desc', '')}\nValor: {b.get('valor', '')}.\n{frase} Quem decide é {b.get('orgao', 'o órgão responsável')}.",
            "fontes": [b["id"]]}
