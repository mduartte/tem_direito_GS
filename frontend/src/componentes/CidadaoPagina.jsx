// Moldura das telas do cidadão: topo com navegação, área central e rodapé fixo com a ação principal.
import { Link, NavLink } from 'react-router-dom';
import { useCidadao } from '../estado/cidadao.jsx';
import { Ic, Marca } from './ui.jsx';

export function Topo() {
  const { c, atualizar } = useCidadao();
  return <header className={'c-top' + (c.feito ? ' compact' : '')}><div className="c-top-in">
    <Link className="logo" to="/" aria-label="Tem Direito, início"><Marca s={28} /><span className="logo-t">Tem Direito</span></Link>
    <nav className="c-nav" aria-label="Principal" style={{ marginLeft: 8 }}>
      {c.feito && <><NavLink to="/resultado">Resultado</NavLink><NavLink to="/meus-direitos"><span className="nav-lg">Meus direitos</span><span className="nav-sm">Direitos</span></NavLink></>}
      <NavLink to="/duvidas"><span className="nav-lg">Tire dúvidas</span><span className="nav-sm">Dúvidas</span></NavLink>
    </nav>
    <div style={{ flex: 1 }} />
    <button className="btn sm" type="button" aria-pressed={c.big} title="Letras maiores" aria-label="Letras maiores" onClick={() => atualizar({ big: !c.big })}>A+</button>
    {c.conta ? <Link className="small muted" to="/privacidade" style={{ whiteSpace: 'nowrap' }}>Olá, {c.conta.nome || 'você'}</Link> : <Link className="btn sm entrar" to="/entrar">Entrar</Link>}
    <Link className="small to-painel" to="/painel" style={{ whiteSpace: 'nowrap' }}>Painel do CRAS</Link>
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
