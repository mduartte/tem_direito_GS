// Única porta de saída HTTP do frontend (convenção do CLAUDE.md: chamadas só em src/api).
// Guarda o token do painel e o da conta do cidadão separados, porque são papéis diferentes.

// Em produção com frontend e API em domínios diferentes (ex.: Render), VITE_API_ORIGIN
// traz o endereço da API sem "/api"; sem ela, usa o proxy do mesmo domínio.
const ORIGEM = import.meta.env.VITE_API_ORIGIN;
const BASE = ORIGEM ? ORIGEM.replace(/\/$/, '') + '/api' : (import.meta.env.VITE_API_URL || '/api');

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

/** Faz a chamada e transforma ProblemDetail do Spring em mensagem legível. */
export async function api(caminho, { metodo = 'GET', corpo, token, chave, bruto } = {}) {
  const h = {};
  if (corpo !== undefined && !(corpo instanceof FormData)) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = 'Bearer ' + token;
  if (chave) h['X-Chave'] = chave;
  let r;
  try {
    r = await fetch(BASE + caminho, { method: metodo, headers: h, body: corpo === undefined ? undefined : corpo instanceof FormData ? corpo : JSON.stringify(corpo) });
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor. Confira a internet e tente de novo.');
  }
  if (bruto) return r;
  if (r.status === 204) return null;
  const tipo = r.headers.get('content-type') || '';
  const dados = tipo.includes('json') ? await r.json().catch(() => null) : await r.text();
  if (!r.ok) {
    const msg = (dados && (dados.detail || dados.message || dados.title)) || (typeof dados === 'string' && dados) || 'Algo deu errado.';
    throw new ErroApi(r.status, msg);
  }
  return dados;
}

export const sessaoPainel = {
  ler: () => { try { return JSON.parse(localStorage.getItem('td-painel-sessao')); } catch { return null; } },
  salvar: s => localStorage.setItem('td-painel-sessao', JSON.stringify(s)),
  sair: () => localStorage.removeItem('td-painel-sessao'),
  token: () => sessaoPainel.ler()?.token
};

/** Chamada autenticada do painel; 401 derruba a sessão e volta para o login. */
export async function apiPainel(caminho, opcoes = {}) {
  try {
    return await api(caminho, { ...opcoes, token: sessaoPainel.token() });
  } catch (e) {
    if (e.status === 401) {
      sessaoPainel.sair();
      window.location.assign('/painel/entrar');
    }
    throw e;
  }
}
