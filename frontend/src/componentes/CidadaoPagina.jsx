// Moldura das telas do cidadão: topo com navegação, área central e rodapé fixo com a ação principal.
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCidadao } from '../estado/cidadao.jsx';
import { Ic, Marca } from './ui.jsx';

export function Topo() {
  const { c, atualizar } = useCidadao();
  // Sombra só depois de rolar: no topo da página o cabeçalho fica leve, sem linha pesando.
  const [rolou, setRolou] = useState(false);
  useEffect(() => { const f = () => setRolou(window.scrollY > 4); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return <header className={'c-top' + (c.feito ? ' compact' : '') + (rolou ? ' rolou' : '')}><div className="c-top-in">
    <Link className="logo" to="/" aria-label="Tem Direito, início"><Marca s={30} /><span className="logo-t">Tem Direito</span></Link>
    <nav className="c-nav seg" aria-label="Principal">
      {c.feito && <><NavLink to="/resultado"><Ic n="check" s={15} /><span>Resultado</span></NavLink><NavLink to="/meus-direitos"><Ic n="list" s={15} /><span className="nav-lg">Meus direitos</span><span className="nav-sm">Direitos</span></NavLink></>}
      <NavLink to="/duvidas"><Ic n="chat" s={15} /><span className="nav-lg">Tire dúvidas</span><span className="nav-sm">Dúvidas</span></NavLink>
    </nav>
    <div style={{ flex: 1 }} />
    <div className="topo-acoes">
      <button className="ic-btn" type="button" aria-pressed={c.big} title="Letras maiores" aria-label="Letras maiores" onClick={() => atualizar({ big: !c.big })}><span aria-hidden="true" style={{ fontWeight: 700, fontSize: 14 }}>A+</span></button>
      <Link className="ic-btn" to="/painel" title="Painel do CRAS" aria-label="Painel do CRAS"><Ic n="chart" s={17} /></Link>
      {c.conta ? <Link className="topo-conta" to="/privacidade"><span className="avatar">{(c.conta.nome || 'V')[0].toUpperCase()}</span><span className="nav-lg">{c.conta.nome || 'Minha conta'}</span></Link>
        : <Link className="btn sm entrar topo-entrar" to="/entrar"><Ic n="users" s={15} />Entrar</Link>}
    </div>
  </div></header>;
}

export function Voltar({ para, rotulo = 'Voltar' }) {
  return <Link to={para} className="row small" style={{ textDecoration: 'none', color: 'var(--ink)', gap: 6, width: 'fit-content' }}><Ic n="back" s={18} />{rotulo}</Link>;
}

export default function CidadaoPagina({ children, rodape, largo }) {
  return <>
    <Topo />
    <main className={'c-main ' + (largo ? 'wide' : '')}>{children}</main>
    {rodape && <div className="c-foot"><div className="c-foot-in">{rodape}</div></div>}
  </>;
}
