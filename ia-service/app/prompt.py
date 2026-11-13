"""Regras do assistente (regra 4 do CLAUDE.md: o assistente não inventa).

Duas camadas:
1. ``regra_seguranca``: respostas fixas para golpe, dados pessoais, crise e
   pedido negado. Rodam ANTES do LLM e valem com ou sem chave, porque nesses
   casos uma frase errada pode custar caro para a família.
2. ``instrucoes``: o prompt do LLM, igual ao instrucoesIA() do protótipo,
   mas com a base reduzida aos documentos recuperados (RAG).
"""
from __future__ import annotations

import re

from .rag import normalizar

ENCAMINHAR = ("Não encontrei isso nas regras do app. Pergunte no CRAS mais perto ou ligue no Disque Social 121 "
              "(benefícios do governo federal) ou no 135 (INSS).")


def _tem(q: str, *palavras: str) -> bool:
    return any(p in q for p in palavras)


def regra_seguranca(pergunta: str) -> dict | None:
    """Resposta fixa quando a pergunta cai num caso sensível; None caso contrário."""
    q = normalizar(pergunta)
    if _tem(q, "me matar", "tirar minha vida", "tirar a propria vida", "suicid", "nao quero mais viver", "acabar com tudo"):
        return {"texto": "Sinto muito que você esteja passando por isso. Você não está sozinho. Ligue agora para o CVV, no 188. "
                         "A ligação é gratuita e funciona 24 horas. Se estiver em perigo, ligue 190.", "fontes": [], "regra": "crise"}
    if _tem(q, "correndo perigo", "estou em perigo", "me bater", "ameaca", "violencia"):
        return {"texto": "Se você corre perigo agora, ligue 190. Para violência contra a mulher, ligue 180. "
                         "O CRAS e o CREAS também podem ajudar.", "fontes": [], "regra": "perigo"}
    if _tem(q, "cobr", "pagar", "pix", "golpe", "taxa para liberar", "deposito"):
        return {"texto": "Benefício social é de graça. Ninguém do governo nem do Tem Direito cobra para liberar. Se alguém pediu "
                         "dinheiro, é golpe: não pague e não passe seus dados. Procure o CRAS ou ligue no Disque Social 121.",
                "fontes": [], "regra": "golpe"}
    if re.search(r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}", pergunta) or _tem(q, "cpf", "senha", "meus dados", "privacidade", "nis"):
        if not _tem(q, "cadastro"):
            return {"texto": "O Tem Direito não pede CPF, NIS nem senha. Não mande esses dados aqui. As respostas da triagem ficam "
                             "só no seu aparelho, e você pode apagar tudo quando quiser. Os documentos você mostra só no CRAS ou no INSS.",
                    "fontes": [], "regra": "dados"}
    if _tem(q, "negad", "recurso", "recorrer", "indeferid"):
        return {"texto": "Se o pedido foi negado, você pode recorrer em até 30 dias.\n• Leia o motivo na carta ou no Meu INSS.\n"
                         "• Procure a Defensoria Pública: o atendimento é de graça.\n• A Defensoria ajuda a escrever o recurso.",
                "fontes": [], "regra": "negado"}
    return None


def instrucoes(beneficios: list[dict], kit: list[str], contexto: str) -> str:
    """Prompt de sistema com a base recuperada. Mesmas 9 regras do protótipo."""
    bens = "\n".join(b["texto"] for b in beneficios) or "(nenhum benefício combina com a pergunta)"
    passos = "\n".join(kit)
    return f"""Você é o assistente de dúvidas do Tem Direito, um app que ajuda famílias de baixa renda a descobrir a quais benefícios sociais têm direito no Brasil e como pedir. Responda em português do Brasil, falando com "você".

REGRAS
1. Use somente a BASE e o CONTEXTO DA FAMÍLIA abaixo. Se a resposta não estiver neles, diga que não sabe com certeza e indique onde perguntar: o CRAS, o Disque Social 121 (benefícios do governo federal) ou o 135 (INSS).
2. Você não decide direitos. Nunca afirme que a pessoa tem direito com certeza. Para "tenho direito a X?", explique as condições e, se houver triagem, diga "pelo que você contou na triagem, é provável…". Sem triagem, convide a fazer (leva 5 minutos). Quem decide é o órgão responsável.
3. Linguagem simples para quem lê com dificuldade: frases curtas, palavras do dia a dia, no máximo 90 palavras. Sem markdown, sem tabelas, sem asteriscos. Para listar, use até 4 linhas começando com "• ".
4. Não peça nem aceite CPF, NIS, senha, dados de banco ou nome completo. Se a pessoa enviar algum, peça para não compartilhar.
5. Benefícios são gratuitos. Ninguém do governo nem do Tem Direito cobra para liberar benefício: qualquer cobrança é golpe. Oriente a não pagar e a procurar o CRAS.
6. Assunto fora de benefícios sociais, documentos e uso do app: diga com gentileza que só ajuda com isso.
7. Se a pessoa disser que corre perigo, indique o 190. Se falar em tirar a própria vida, acolha e indique o CVV, ligação gratuita no 188, 24 horas.
8. Valores e regras mudam. Ao citar um valor, diga que é o valor atual na base do app.
9. Termine sempre com uma última linha neste formato: FONTES: ids da BASE que você usou, separados por vírgula (exemplo: FONTES: bpci, cad), ou FONTES: nenhuma.

BASE · benefícios ligados à pergunta (id entre colchetes)
{bens}

BASE · documentos e onde pedir
{passos}
Pedido negado: dá para recorrer em até 30 dias. Leia o motivo na carta ou no Meu INSS e procure a Defensoria Pública, que ajuda de graça.
O app: não pede CPF nem senha, funciona por toque, texto e voz, e a triagem tem 10 perguntas.

CONTEXTO DA FAMÍLIA
{contexto}"""


def tirar_fontes(texto: str) -> str:
    """Remove a linha FONTES e asteriscos de markdown que o modelo deixar escapar."""
    return re.split(r"\n?\s*FONTES\s*:", str(texto or ""), flags=re.I)[0].replace("**", "").strip()


def ler_fontes(texto: str, ids_validos: set[str]) -> list[str]:
    """Lê os ids da linha FONTES, aceitando só ids que existem na base (até 4)."""
    m = re.search(r"FONTES\s*:\s*([^\n]*)", str(texto or ""), flags=re.I)
    if not m:
        return []
    vistos: list[str] = []
    for parte in re.split(r"[,;\s]+", m.group(1)):
        i = re.sub(r"[^\w]", "", parte.strip().lower())
        if i in ids_validos and i not in vistos:
            vistos.append(i)
    return vistos[:4]
