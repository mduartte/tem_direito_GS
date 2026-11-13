"""API do ia-service.

POST /perguntar   — assistente de dúvidas. Recebe a pergunta, o histórico, a
                    base (montada pelo backend a partir do motor de regras) e
                    o contexto da família; devolve texto, fontes e o modo usado.
POST /transcrever — transcrição de áudio com faster-whisper, se instalado.
GET  /saude       — usado pelo Docker e pelo smoke test.
"""
from __future__ import annotations

import logging
import tempfile

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import llm
from .local import resposta_local
from .prompt import ENCAMINHAR, instrucoes, ler_fontes, regra_seguranca, tirar_fontes
from .rag import recuperar

log = logging.getLogger("ia-service")
app = FastAPI(title="Tem Direito · ia-service", version="1.0.0",
              description="Assistente de dúvidas com RAG sobre as regras do motor e transcrição de voz.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Mensagem(BaseModel):
    role: str
    content: str


class Base(BaseModel):
    beneficios: list[dict] = Field(default_factory=list)
    kit: list[str] = Field(default_factory=list)


class Contexto(BaseModel):
    feito: bool = False
    texto: str = "A pessoa ainda não fez a triagem do app."
    status: dict[str, str] = Field(default_factory=dict)


class Pergunta(BaseModel):
    pergunta: str
    historico: list[Mensagem] = Field(default_factory=list)
    base: Base = Field(default_factory=Base)
    contexto: Contexto = Field(default_factory=Contexto)


@app.get("/saude")
def saude() -> dict:
    return {"ok": True, "llm": llm.provedor() or "modo local"}


@app.post("/perguntar")
def perguntar(p: Pergunta) -> dict:
    texto = p.pergunta.strip()[:500]
    if not texto:
        return {"texto": "Escreva sua dúvida sobre benefícios, documentos ou o app.", "fontes": [], "modo": "local"}

    fixa = regra_seguranca(texto)
    if fixa:
        return {"texto": fixa["texto"], "fontes": [], "modo": "regra", "regra": fixa["regra"]}

    bens = p.base.beneficios
    recuperados = recuperar(texto, bens, k=4)
    ids = {b["id"] for b in bens}

    if llm.disponivel():
        try:
            sistema = instrucoes(recuperados, p.base.kit, p.contexto.texto)
            msgs = [m.model_dump() for m in p.historico if m.role in ("user", "assistant") and m.content][-8:]
            while msgs and msgs[0]["role"] != "user":
                msgs.pop(0)
            # A API exige alternância user/assistant: junta mensagens seguidas do mesmo papel.
            juntas: list[dict] = []
            for m in msgs + [{"role": "user", "content": texto}]:
                if juntas and juntas[-1]["role"] == m["role"]:
                    juntas[-1]["content"] += "\n" + m["content"]
                else:
                    juntas.append(dict(m))
            bruto = llm.gerar(sistema, juntas)
            resposta = tirar_fontes(bruto) or ENCAMINHAR
            return {"texto": resposta, "fontes": ler_fontes(bruto, ids), "modo": "ia",
                    "recuperados": [b["id"] for b in recuperados]}
        except Exception as e:  # noqa: BLE001 — qualquer falha do provedor cai no modo local
            log.warning("LLM falhou, usando modo local: %s", e)

    r = resposta_local(texto, bens, p.base.kit, p.contexto.status if p.contexto.feito else None)
    return {**r, "modo": "local", "recuperados": [b["id"] for b in recuperados]}


_modelo_whisper = None


@app.post("/transcrever")
async def transcrever(audio: UploadFile = File(...)) -> dict:
    """Transcreve com faster-whisper (modelo "small", português). Sem a biblioteca, avisa e o app usa o microfone do navegador."""
    global _modelo_whisper
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError:
        return {"texto": "", "disponivel": False, "motivo": "Transcrição no servidor não instalada; use o reconhecimento de voz do navegador."}
    if _modelo_whisper is None:
        _modelo_whisper = WhisperModel("small", device="cpu", compute_type="int8")
    with tempfile.NamedTemporaryFile(suffix=".webm") as f:
        f.write(await audio.read())
        f.flush()
        partes, _ = _modelo_whisper.transcribe(f.name, language="pt")
        return {"texto": " ".join(s.text.strip() for s in partes).strip(), "disponivel": True}
