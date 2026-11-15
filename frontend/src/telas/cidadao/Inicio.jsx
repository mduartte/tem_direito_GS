// A1/D1 · Boas-vindas e A2 · Para quem é a consulta.
import { Link, useNavigate } from 'react-router-dom';
import CidadaoPagina, { Voltar } from '../../componentes/CidadaoPagina.jsx';
import { Ic, Interruptor, Linha, Ouvir, Pill } from '../../componentes/ui.jsx';
import { useCidadao } from '../../estado/cidadao.jsx';
import { ativos } from '../../estado/formato.js';
import { temReconhecimento } from '../../estado/voz.js';

export function Inicio() {
  const { c, res, refazer } = useCidadao();
  const nav = useNavigate();
  const fala = 'Tem Direito. Descubra a que sua família tem direito. Responda dez perguntas simples. No fim, você recebe a lista do que levar e onde ir. Não pedimos CPF nem senha.';
  return <CidadaoPagina rodape={<>
    <button className="btn pri block" onClick={() => { if (c.feito) refazer(); nav('/modo'); }}>{c.feito ? 'Fazer uma nova triagem' : 'Começar · leva 5 minutos'}</button>
    <Ouvir texto={fala} rotulo="Ouvir esta tela" classe="btn block" /></>}>
    <div className="hero rise">
      <svg viewBox="0 0 520 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g stroke="#7FD3A8" strokeOpacity=".1">{Array.from({ length: 15 }, (_, i) => <path key={'v' + i} d={`M${i * 36} 0V210`} />)}{Array.from({ length: 7 }, (_, i) => <path key={'h' + i} d={`M0 ${i * 36}H520`} />)}</g>
        <path className="draw" pathLength="1" d="M20 150 C110 140 120 90 200 90 S330 50 380 46 S470 20 510 14" fill="none" stroke="#7FD3A8" strokeWidth="3" />
      </svg>
      <div className="chips" style={{ position: 'relative' }}>{['BPC', 'Bolsa Família', 'Tarifa Social', 'Farmácia Popular', 'Cadastro Único'].map((t, i) =>
        <span key={t} className="rise" style={{ animationDelay: `${0.5 + i * 0.08}s`, padding: '5px 10px', borderRadius: 14, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 500 }}>{t}</span>)}</div>
    </div>
    <div className="col rise" style={{ animationDelay: '.15s', gap: 8 }}><h1 className="c-h1">Descubra a que sua família tem direito</h1><p className="muted" style={{ lineHeight: 1.5 }}>Responda 10 perguntas simples. No fim, você recebe a lista do que levar e onde ir.</p></div>
    {c.feito && <div className="card rise" style={{ borderColor: '#c9e7d6' }}><div className="row between"><b>Você já fez a triagem</b><Pill t={ativos(res).length + ' benefícios'} k="brand" /></div>
      <div className="row wrap"><Link className="btn sm" to="/resultado">Ver resultado</Link><Link className="btn sm" to="/meus-direitos">Acompanhar</Link><button className="btn sm" onClick={() => { refazer(); nav('/modo'); }}>Fazer de novo</button></div></div>}
    <div className="card rise" style={{ animationDelay: '.25s' }}><div className="row" style={{ alignItems: 'flex-start' }}><Ic n="lock" s={20} c="#17704A" /><div className="col" style={{ gap: 4 }}><b style={{ fontSize: 15 }}>Sem CPF, sem senha, sem custo</b><span className="small muted" style={{ lineHeight: 1.5 }}>Ninguém do Tem Direito pede dinheiro ou documento. Você pode apagar tudo quando quiser.</span></div></div></div>
    <Link className="card rise" to="/duvidas" style={{ animationDelay: '.3s', textDecoration: 'none', color: 'inherit', flexDirection: 'row', alignItems: 'center', gap: 12 }}><Ic n="chat" s={22} c="#17704A" /><div className="col" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 15 }}>Tem uma dúvida?</b><span className="small muted">Pergunte ao assistente, escrevendo ou falando</span></div><Ic n="chev" s={18} c="var(--mute)" /></Link>
    <p className="sheet-note">O Tem Direito orienta. Quem decide é o INSS, o CRAS e a distribuidora.</p>
    {/* Acesso da equipe como botões de verdade: no celular o link pequeno no fim da página era difícil de tocar
        e o "Painel do CRAS" do topo fica escondido para caber na tela. */}
    <div className="card acesso-equipe"><Ic n="chart" s={22} c="#17704A" /><div className="col" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 15 }}>Trabalha em um CRAS ou ONG?</b><span className="small muted">Veja a busca ativa no painel da equipe.</span></div>
      <div className="acoes"><Link className="btn sm" to="/painel">Abrir o painel</Link><Link className="btn sm" to="/acesso">Pedir acesso</Link></div></div>
  </CidadaoPagina>;
}

export function Modo() {
  const { c, atualizar } = useCidadao();
  const nav = useNavigate();
  const Op = ({ v, t, s, icn }) => <button className="opt rise" aria-pressed={c.modo === v} onClick={() => atualizar({ modo: v })}><Ic n={icn} s={24} c={c.modo === v ? '#17704A' : '#5d5f60'} /><span className="col" style={{ gap: 2 }}><b style={{ fontSize: 16 }}>{t}</b><span className="small muted" style={{ lineHeight: 1.4 }}>{s}</span></span><span className="dot" /></button>;
  return <CidadaoPagina rodape={<button className="btn pri block" disabled={!c.modo} onClick={() => { atualizar({ q: 0 }); nav('/triagem'); }}>Continuar</button>}>
    <Voltar para="/" />
    <h1 className="c-h1">Para quem é a consulta?</h1>
    <Op v="mim" t="Para mim" s="Você responde sobre a sua casa." icn="users" />
    <Op v="outra" t="Para alguém que eu ajudo" s="Sua mãe, uma vizinha, uma família atendida. As perguntas falam “a pessoa”." icn="shield" />
    <div className="card"><b>Como prefere usar</b>
      <Linha titulo="Letras maiores" sub="aumenta o texto de todas as telas"><Interruptor ligado={c.big} rotulo="Letras maiores" onChange={v => atualizar({ big: v })} /></Linha>
      <Linha titulo="Ler as perguntas em voz alta" sub="cada pergunta é lida quando aparece"><Interruptor ligado={c.tts} rotulo="Ler as perguntas em voz alta" onChange={v => atualizar({ tts: v })} /></Linha>
      <span className="xs muted">{temReconhecimento() ? 'Em perguntas com microfone, você pode responder falando.' : 'Responder falando funciona no Chrome e no Edge.'}</span>
    </div>
  </CidadaoPagina>;
}
