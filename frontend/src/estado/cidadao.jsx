// Estado do cidadão. As respostas ficam SÓ no aparelho e SÓ enquanto o site está aberto
// (sessionStorage): fechou a aba, zera. Em aparelho compartilhado ou de outra pessoa, a próxima
// consulta não vê as respostas de quem usou antes (LGPD: renda e saúde são dados sensíveis).
// Só as preferências de acessibilidade (letras maiores, leitura em voz alta) continuam guardadas.
// no CLAUDE.md; o servidor recebe a triagem anônima e devolve um código e uma chave.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { triagemApi } from '../api/servicos.js';
import { paraMotor, respostasVazias } from './perguntas.js';

const CHAVE = 'td-cidadao';
const PREF = 'td-preferencias';
const sessao = window.sessionStorage;
// Versões antigas guardavam tudo no localStorage: apaga para não reaparecer.
try { localStorage.removeItem(CHAVE); localStorage.removeItem('td-avaliacao'); Object.keys(localStorage).filter(k => k.startsWith('td-perto:')).forEach(k => localStorage.removeItem(k)); } catch { /* navegador sem armazenamento */ }
const novo = () => ({ modo: null, q: 0, ans: respostasVazias(), feito: false, kit: {}, lembrete: null, status: {}, code: null, chave: null,
  conta: null, token: null, avisos: [], tts: false, big: false, autorizou: true, criado: null, viuKit: false, falta: null, negadoEm: null, usouVoz: false, consentimento: false });

function carregar() {
  let pref = {};
  try { pref = JSON.parse(localStorage.getItem(PREF)) || {}; } catch { /* sem preferências */ }
  try { const s = JSON.parse(sessao.getItem(CHAVE)) || {}; return { ...novo(), ...pref, ...s, ans: { ...respostasVazias(), ...(s.ans || {}) } }; } catch { return novo(); }
}

const Ctx = createContext(null);

export function CidadaoProvider({ children }) {
  const [c, setC] = useState(carregar);
  const [aval, setAval] = useState(() => { try { return JSON.parse(sessao.getItem('td-avaliacao')); } catch { return null; } });
  const [erro, setErro] = useState(null);
  const ultimo = useRef('');

  useEffect(() => { sessao.setItem(CHAVE, JSON.stringify(c)); }, [c]);
  useEffect(() => { try { localStorage.setItem(PREF, JSON.stringify({ big: !!c.big, tts: !!c.tts })); } catch { /* ignora */ } }, [c.big, c.tts]);
  useEffect(() => { document.body.classList.toggle('big', !!c.big); }, [c.big]);

  const atualizar = useCallback(mud => setC(x => ({ ...x, ...(typeof mud === 'function' ? mud(x) : mud) })), []);
  const responder = useCallback((k, v) => setC(x => ({ ...x, ans: { ...x.ans, [k]: v } })), []);

  // Reavalia no servidor sempre que as respostas mudam depois da triagem pronta.
  const avaliar = useCallback(async ans => {
    const corpo = paraMotor(ans);
    const assinatura = JSON.stringify(corpo);
    ultimo.current = assinatura;
    try {
      const r = await triagemApi.avaliar(corpo);
      if (ultimo.current === assinatura) { setAval(r); sessao.setItem('td-avaliacao', JSON.stringify(r)); setErro(null); }
      return r;
    } catch (e) { setErro(e.message); throw e; }
  }, []);
  useEffect(() => { if (c.feito) avaliar(c.ans).catch(() => {}); }, [c.feito, c.ans, avaliar]);

  /** Fecha a triagem: registra o código anônimo (se a pessoa consentiu). */
  const concluir = useCallback(async () => {
    const r = await avaliar(c.ans);
    let reg = {};
    if (c.consentimento && !c.code) {
      try {
        reg = await triagemApi.registrar({ respostas: paraMotor(c.ans), canal: c.usouVoz ? 'App · voz' : 'App', autorizou: c.autorizou, consentimento: true }, c.token);
      } catch { /* sem rede: segue só no aparelho e tenta de novo depois */ }
    }
    setC(x => ({ ...x, feito: true, code: reg.codigo || x.code, chave: reg.chave || x.chave, criado: x.criado || new Date().toISOString() }));
    return r;
  }, [avaliar, c.ans, c.consentimento, c.code, c.usouVoz, c.autorizou, c.token]);

  const sincronizar = useCallback(async corpo => {
    if (!c.code || !c.chave) return null;
    try { return await triagemApi.atualizar(c.code, c.chave, corpo); } catch { return null; }
  }, [c.code, c.chave]);

  const apagarTudo = useCallback(async () => {
    if (c.code && c.chave) { try { await triagemApi.apagar(c.code, c.chave); } catch { /* já apagada */ } }
    sessao.removeItem(CHAVE);
    sessao.removeItem('td-avaliacao');
    setAval(null);
    setC(novo());
  }, [c.code, c.chave]);

  const refazer = useCallback(() => { setAval(null); setC(x => ({ ...novo(), big: x.big, tts: x.tts, conta: x.conta, token: x.token })); }, []);

  const valor = useMemo(() => ({ c, atualizar, responder, aval, res: aval?.resultado || [], kit: aval?.kit || [], erro, avaliar, concluir, sincronizar, apagarTudo, refazer, outra: c.modo === 'outra' }),
    [c, atualizar, responder, aval, erro, avaliar, concluir, sincronizar, apagarTudo, refazer]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useCidadao = () => useContext(Ctx);
