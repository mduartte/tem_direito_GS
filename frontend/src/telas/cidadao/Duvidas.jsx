// A11 · Tire dúvidas: chat com o assistente (RAG + LLM no ia-service, ou modo local sem IA).
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CidadaoPagina from '../../componentes/CidadaoPagina.jsx';
import { Ic, Ouvir } from '../../componentes/ui.jsx';
import { assistenteApi } from '../../api/servicos.js';
import { useCidadao } from '../../estado/cidadao.jsx';
import { BEN_NOME } from '../../estado/formato.js';
import { paraMotor } from '../../estado/perguntas.js';
import { ouvir, temReconhecimento } from '../../estado/voz.js';

const SUGESTOES = ['Preciso estar no Cadastro Único?', 'Quem tem direito ao BPC?', 'Quanto é o Bolsa Família?', 'O que eu levo no CRAS?', 'Meu pedido foi negado. E agora?', 'Me cobraram para liberar um benefício. É golpe?'];
const MODO_TXT = { local: 'Resposta automática, sem IA', regra: 'Resposta padrão de segurança', indisponivel: 'Assistente fora do ar' };

export default function Duvidas() {
  const { c, outra } = useCidadao();
  const nav = useNavigate();
  const { state } = useLocation();
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem('td-chat')) || []; } catch { return []; } });
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const fim = useRef(null);
  const parar = useRef(() => {});
  const enviada = useRef(false);

  useEffect(() => { sessionStorage.setItem('td-chat', JSON.stringify(msgs.slice(-30))); fim.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [msgs]);

  const perguntar = async t => {
    t = String(t || '').trim().slice(0, 500);
    if (!t || ocupado) return;
    const historico = msgs.filter(m => m.texto && !m.erro).slice(-8).map(m => ({ role: m.role, content: m.texto }));
    setMsgs(m => [...m, { role: 'user', texto: t }, { role: 'assistant', texto: '', pend: true }]);
    setTexto(''); setOcupado(true);
    try {
      const r = await assistenteApi.perguntar({ pergunta: t, historico, respostas: c.feito ? paraMotor(c.ans) : null, outraPessoa: outra });
      setMsgs(m => [...m.slice(0, -1), { role: 'assistant', texto: r.texto, fontes: r.fontes || [], modo: r.modo }]);
    } catch (e) {
      setMsgs(m => [...m.slice(0, -1), { role: 'assistant', texto: 'Não consegui responder agora. Pergunte no CRAS mais perto ou ligue no Disque Social 121 ou no 135 (INSS).', erro: true, fontes: [] }]);
    } finally { setOcupado(false); }
  };

  useEffect(() => { if (state?.pergunta && !enviada.current) { enviada.current = true; perguntar(state.pergunta); nav('.', { replace: true, state: null }); } }); // eslint-disable-line react-hooks/exhaustive-deps

  const falarPergunta = () => {
    if (ouvindo) { parar.current(); return; }
    setOuvindo(true);
    parar.current = ouvir({ onTexto: (t, final) => { setTexto(t); if (final) perguntar(t); }, onFim: () => setOuvindo(false), onErro: () => setOuvindo(false) });
  };

  return <CidadaoPagina rodape={<form className="row" style={{ gap: 8, width: '100%' }} onSubmit={e => { e.preventDefault(); perguntar(texto); }}>
    {temReconhecimento() && <button type="button" className="btn" aria-label={ouvindo ? 'Parar de ouvir' : 'Perguntar falando'} aria-pressed={ouvindo} onClick={falarPergunta} style={{ width: 52, padding: 0, background: ouvindo ? 'var(--g)' : undefined, color: ouvindo ? '#fff' : undefined }}><Ic n="mic" s={20} /></button>}
    <input className="inp" style={{ flex: 1 }} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escreva sua dúvida" aria-label="Sua dúvida" maxLength={500} />
    <button className="btn pri" type="submit" disabled={!texto.trim() || ocupado} aria-label="Enviar" style={{ width: 52, padding: 0 }}><Ic n="send" s={20} c="#fff" /></button></form>}>
    <div className="row between"><h1 className="c-h1">Tire dúvidas</h1>{msgs.length > 0 && <button className="btn sm" onClick={() => setMsgs([])}>Limpar conversa</button>}</div>
    {!msgs.length && <><p className="muted" style={{ lineHeight: 1.5 }}>Pergunte sobre benefícios, documentos ou o app. O assistente responde com as mesmas regras da triagem{c.feito ? ' e com o seu resultado' : ''}. Não mande CPF nem senha.</p>
      <div className="col" style={{ gap: 8 }}>{SUGESTOES.map(s => <button key={s} className="opt" style={{ padding: '12px 14px' }} onClick={() => perguntar(s)}><Ic n="chat" s={18} c="#17704A" /><b style={{ fontSize: 15, fontWeight: 500 }}>{s}</b></button>)}</div></>}
    <div className="col" style={{ gap: 10 }} aria-live="polite">{msgs.map((m, i) => m.role === 'user'
      ? <div key={i} className="msg u">{m.texto}</div>
      : <div key={i} className="msg a"><div className="txt" style={{ whiteSpace: 'pre-line' }}>{m.pend ? <span className="dots" aria-label="Escrevendo"><i /><i /><i /></span> : m.texto}</div>
        {m.fontes?.length > 0 && <div className="fontes"><span className="xs muted">Base:</span>{m.fontes.map(id => c.feito ? <button key={id} className="pill brand" style={{ cursor: 'pointer', border: 0 }} onClick={() => nav('/beneficio/' + id)}>{BEN_NOME[id] || id}</button> : <span key={id} className="pill">{BEN_NOME[id] || id}</span>)}</div>}
        {!m.pend && <div className="row" style={{ gap: 6, marginTop: 6 }}><Ouvir texto={m.texto} />{MODO_TXT[m.modo] && <span className="xs muted">{MODO_TXT[m.modo]}</span>}</div>}</div>)}
      <div ref={fim} /></div>
    <p className="sheet-note">O assistente orienta. Quem decide é o INSS, o CRAS e a distribuidora. Em perigo, ligue 190. Para conversar, CVV 188.</p>
  </CidadaoPagina>;
}
