// Moldura do painel do CRAS: menu lateral por perfil, migalhas, busca por código e filtros compartilhados.
import { createContext, useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { sessaoPainel } from '../api/cliente.js';
import { BAIRROS, BEN_NOME, pct } from '../estado/formato.js';
import { Ic, Marca } from './ui.jsx';

const NAV = [
  ['Busca ativa', [['chart', 'Visão geral', '/painel'], ['map', 'Mapa de demanda', '/painel/mapa'], ['list', 'Encaminhamentos', '/painel/encaminhamentos'], ['file', 'Relatórios', '/painel/relatorios', ['COORDENACAO', 'GESTOR']], ['bolt', 'Automações', '/painel/automacoes', ['COORDENACAO', 'GESTOR']]]],
  ['Gestão', [['grid', 'Benefícios', '/gestao/beneficios'], ['sliders', 'Editor de regras', '/gestao/regras'], ['flask', 'Simulador', '/gestao/simulador'], ['doc', 'Documentos e passos', '/gestao/documentos'], ['clock', 'Histórico', '/gestao/historico'], ['pin', 'Pontos de atendimento', '/gestao/pontos']]],
  ['Unidade', [['home', 'Dados da unidade', '/config/unidade'], ['users', 'Equipe', '/config/equipe'], ['bell', 'Preferências', '/config/preferencias']]]
];

/** Filtros do topo (bairro, benefício, período) guardados entre as telas do painel. */
const FiltroCtx = createContext(null);
export function FiltroProvider({ children }) {
  const [f, setF] = useState(() => { try { return JSON.parse(localStorage.getItem('td-painel-filtros')) || { bairro: '', ben: '', per: '30' }; } catch { return { bairro: '', ben: '', per: '30' }; } });
  const mudar = (k, v) => setF(x => { const n = { ...x, [k]: v }; localStorage.setItem('td-painel-filtros', JSON.stringify(n)); return n; });
  return <FiltroCtx.Provider value={{ f, mudar }}>{children}</FiltroCtx.Provider>;
}
export const useFiltro = () => useContext(FiltroCtx);

export function Filtros() {
  const { f, mudar } = useFiltro();
  return <>
    <select className="p-sel" value={f.bairro} onChange={e => mudar('bairro', e.target.value)} aria-label="Bairro"><option value="">Bairro: todos</option>{BAIRROS.concat(['Outro bairro']).map(b => <option key={b}>{b}</option>)}</select>
    <select className="p-sel" value={f.ben} onChange={e => mudar('ben', e.target.value)} aria-label="Benefício"><option value="">Benefício: todos</option>{Object.entries(BEN_NOME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
    <select className="p-sel" value={f.per} onChange={e => mudar('per', e.target.value)} aria-label="Período"><option value="30">Últimos 30 dias</option><option value="60">Últimas 8 semanas</option></select>
  </>;
}

export function Cabecalho({ titulo, sub, children }) {
  return <div className="row between wrap" style={{ alignItems: 'flex-end', gap: 16 }}><div><h1>{titulo}</h1>{sub && <p className="small muted" style={{ marginTop: 4 }}>{sub}</p>}</div><div className="row wrap" style={{ gap: 8 }}>{children}</div></div>;
}

export function Barras({ itens, cor = '#059669' }) {
  const mx = Math.max(1, ...itens.map(x => x[1]));
  return <div className="blist">{itens.map(([t, v, lab], i) => <div key={t + i} className="col" style={{ gap: 6 }}><div className="row between small"><span>{t}</span><span className="num muted">{lab}</span></div><div className="bar" style={{ height: 6, background: 'var(--raised)' }}><i className="fill" style={{ width: `${v / mx * 100}%`, background: cor, animationDelay: `${0.2 + i * 0.06}s` }} /></div></div>)}</div>;
}
export const barrasBen = (ben, total, n = 4) => Object.entries(ben || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [BEN_NOME[k] || k, v, pct(v, total) + '%']);

export const SIT = { agendado: ['Agendado', 'info'], atendido: ['Atendido', 'neutral'], conseguiu: ['Conseguiu', 'pos'], travado: ['Travado', 'neg'], kit: ['Só kit', ''], triagem: ['Só triagem', ''] };
export const PERFIL_TXT = { ATENDENTE: 'Atendente', COORDENACAO: 'Coordenação', GESTOR: 'Gestor de regras' };

export default function PainelShell({ migalhas, children }) {
  const nav = useNavigate();
  const s = sessaoPainel.ler() || {};
  const [q, setQ] = useState('');
  const iniciais = (s.nome || 'Equipe').split(' ').map(x => x[0]).join('').slice(0, 2);
  return <div className="p">
    <aside className="p-side"><NavLink className="logo" to="/painel" style={{ height: 32, padding: '0 6px' }}><Marca s={26} />Tem Direito</NavLink>
      <div className="p-scope"><span className="col" style={{ gap: 1, flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>CRAS Vila Santa Lúcia</span><span className="xs muted">São Paulo · zona sul</span></span></div>
      {NAV.map(([g, itens]) => <nav key={g} className="grp" aria-label={g}><div>{g}</div>{itens.filter(x => !x[3] || x[3].includes(s.perfil)).map(([icn, t, to]) =>
        <NavLink key={to} to={to} end={to === '/painel'}>{({ isActive }) => <><Ic n={icn} s={16} c={isActive ? '#131416' : '#5d5f60'} />{t}</>}</NavLink>)}</nav>)}
      <div className="sp" style={{ flex: 1 }} />
      <NavLink to="/"><Ic n="home" s={16} c="#5d5f60" />App do cidadão</NavLink>
      <button className="who" title="Sair" onClick={() => { sessaoPainel.sair(); nav('/painel/entrar'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', border: 'none', background: 'none', textAlign: 'left' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{iniciais}</span>
        <span className="col" style={{ gap: 0 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{s.nome}</span><span className="xs muted">{PERFIL_TXT[s.perfil] || s.perfil} · sair</span></span></button>
    </aside>
    <div className="p-body"><header className="p-top">
      <div className="small" style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>{migalhas.map((c, i) => <span key={i}>{i > 0 && <span style={{ color: '#b9bcbe' }}> / </span>}<span style={{ color: i === migalhas.length - 1 ? 'var(--ink)' : 'var(--mute)' }}>{c}</span></span>)}</div>
      <form className="p-search" onSubmit={e => { e.preventDefault(); const c = q.trim().toUpperCase(); if (c) nav('/painel/encaminhamentos/' + (c.startsWith('T-') ? c : 'T-' + c)); }}><Ic n="search" s={15} c="#5d5f60" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar código, ex.: T-2470" aria-label="Buscar triagem pelo código" /></form>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}><span className="row xs" style={{ gap: 6, color: 'var(--pos)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pos)' }} />Ao vivo</span></div>
    </header><main className="p-sheet">{children}</main></div>
  </div>;
}
