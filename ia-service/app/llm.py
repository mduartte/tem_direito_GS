"""Chamada ao LLM. Suporta a API da Anthropic e qualquer endpoint compatível
com OpenAI (Azure OpenAI, Ollama, vLLM). Sem chave configurada, ``disponivel()``
devolve False e o serviço usa o modo local.

Variáveis de ambiente:
- ANTHROPIC_API_KEY e IA_MODELO (padrão claude-haiku-5-5);
- ou OPENAI_API_KEY, OPENAI_BASE_URL e IA_MODELO.
"""
from __future__ import annotations

import os

import httpx

TIMEOUT = float(os.getenv("IA_TIMEOUT", "30"))


def provedor() -> str | None:
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    return None


def disponivel() -> bool:
    return provedor() is not None


def gerar(sistema: str, mensagens: list[dict]) -> str:
    """Gera a resposta. Levanta exceção em falha (quem chama cai no modo local)."""
    p = provedor()
    if p == "anthropic":
        r = httpx.post(
            os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com") + "/v1/messages",
            headers={"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": os.getenv("IA_MODELO", "claude-haiku-5-5"), "max_tokens": 400, "temperature": 0.2, "system": sistema, "messages": mensagens},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        return "".join(b.get("text", "") for b in r.json().get("content", []) if b.get("type") == "text")
    if p == "openai":
        base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        r = httpx.post(
            base + "/chat/completions",
            headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]},
            json={"model": os.getenv("IA_MODELO", "gpt-4o-mini"), "max_tokens": 400, "temperature": 0.2,
                  "messages": [{"role": "system", "content": sistema}] + mensagens},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    raise RuntimeError("Nenhum provedor de LLM configurado")
