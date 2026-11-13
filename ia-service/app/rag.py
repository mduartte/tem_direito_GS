"""Recuperação (o "R" do RAG) sobre a base que o backend manda.

A base é pequena (29 benefícios e 5 passos do Kit), então não precisamos de
banco vetorial: uma pontuação lexical com sinônimos acerta melhor que
embeddings para perguntas curtas em português popular, roda sem GPU e é
fácil de testar. Cada documento recebe pontos por:

- nome do benefício ou sinônimo contido na pergunta (peso = tamanho do termo,
  como no protótipo, para "conta de luz" valer mais que "luz");
- palavras da pergunta que aparecem no texto do documento (BM25 simplificado).
"""
from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter

from .aliases import ALIAS

PARADAS = set(
    "a o as os de da do das dos e em no na nos nas um uma que para por com como qual quais quem eu meu minha "
    "voce tem ter tenho e ou se ao aos pra pro sobre isso esse essa ja nao sim mais menos muito".split()
)


def normalizar(texto: str) -> str:
    """Minúsculas e sem acento, igual ao normTxt() do protótipo."""
    t = unicodedata.normalize("NFD", str(texto or "").lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def tokens(texto: str) -> list[str]:
    return [w for w in re.split(r"[^a-z0-9]+", normalizar(texto)) if len(w) > 2 and w not in PARADAS]


def pontuar_alias(pergunta: str, beneficios: list[dict]) -> dict[str, int]:
    """Pontos por nome/sinônimo, como o respostaLocal() do protótipo."""
    q = normalizar(pergunta)
    score: dict[str, int] = {}
    for b in beneficios:
        termos = [normalizar(b.get("nome", ""))] + ALIAS.get(b["id"], [])
        for termo in termos:
            t = normalizar(termo)
            if t and t in q:
                score[b["id"]] = score.get(b["id"], 0) + len(t)
    return score


def recuperar(pergunta: str, beneficios: list[dict], k: int = 4) -> list[dict]:
    """Devolve os k benefícios mais relevantes, com a pontuação em 'score'."""
    alias = pontuar_alias(pergunta, beneficios)
    qt = tokens(pergunta)
    docs = [tokens(b.get("texto", "")) for b in beneficios]
    n = len(docs) or 1
    media = sum(len(d) for d in docs) / n if docs else 1
    df = Counter(w for d in docs for w in set(d))
    out = []
    for b, d in zip(beneficios, docs):
        tf = Counter(d)
        bm25 = 0.0
        for w in qt:
            if w not in tf:
                continue
            idf = math.log(1 + (n - df[w] + 0.5) / (df[w] + 0.5))
            bm25 += idf * (tf[w] * 2.2) / (tf[w] + 1.2 * (0.25 + 0.75 * len(d) / (media or 1)))
        s = alias.get(b["id"], 0) * 2 + bm25
        if s > 0:
            out.append({**b, "score": round(s, 3)})
    out.sort(key=lambda x: x["score"], reverse=True)
    return out[:k]
