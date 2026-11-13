// B1 · Entrar no painel, E5 · Verificação em duas etapas e E1 · Solicitar acesso.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sessaoPainel } from '../../api/cliente.js';
import { authPainelApi } from '../../api/servicos.js';
import { Aviso, Ic, Marca } from '../../componentes/ui.jsx';

const DEMO = [['ana.ribeiro@prefeitura.sp.gov.br', 'Coordenação'], ['marcos.lima@prefeitura.sp.gov.br', 'Atendente'], ['mateus.duarte@temdireito.org', 'Gestor de regras']];

function Lateral() {
  return <div className="side"><svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}><g stroke="#7FD3A8" strokeOpacity=".08">{Array.from({ length: 16 }, (_, i) => <path key={'v' + i} d={`M${i * 40} 0V500`} />)}{Array.from({ length: 13 }, (_, i) => <path key={'h' + i} d={`M0 ${i * 40}H600`} />)}</g><path className="draw" pathLength="1" d="M40 420 C140 400 160 300 260 300 S380 200 460 180 S560 90 600 60" fill="none" stroke="#7FD3A8" strokeWidth="3" /></svg>
    <b className="rise" style={{ position: 'relative', fontSize: 30, lineHeight: 1.2, maxWidth: 440 }}>Veja quem tem direito e ainda não chegou ao CRAS.</b>
    <p className="rise" style={{ position: 'relative', color: '#c8e6d6', lineHeight: 1.55, maxWidth: 440 }}>Triagens anônimas feitas no app e no site viram um mapa de demanda por bairro, para a equipe planejar a busca ativa.</p></div>;
}

export function EntrarPainel() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: DEMO[0][0], senha: 'demo2026' });
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { if (sessaoPainel.token()) nav('/painel', { replace: true }); }, [nav]);
  const entrar = async e => {
    e.preventDefault(); setErro(null); setEnviando(true);
    try {
      const r = await authPainelApi.login({ ...f, dispositivo: localStorage.getItem('td-dispositivo') || undefined });
      if (r.etapa === 'ok') { sessaoPainel.salvar(r); nav('/painel'); } else nav('/painel/codigo', { state: { ...f, mascara: r.email, codigoTeste: r.codigoTeste } });
    } catch (x) { setErro(x.message); } finally { setEnviando(false); }
  };
  return <div className="login"><div style={{ display: 'flex', flexDirection: 'column', padding: '32px 48px', background: '#fff' }}>
    <Link className="logo" to="/"><Marca s={30} />Tem Direito <span className="pill" style={{ marginLeft: 6 }}>Painel</span></Link>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><form className="col" onSubmit={entrar} style={{ width: '100%', maxWidth: 400, gap: 18 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 600 }}>Entrar no painel</h1><p className="small muted" style={{ marginTop: 6 }}>Acesso para CRAS, prefeituras e organizações parceiras.</p></div>
      <div className="field"><label htmlFor="pe">E-mail institucional</label><input id="pe" className="inp" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} autoComplete="username" required /></div>
      <div className="field"><label htmlFor="ps">Senha</label><input id="ps" type="password" className="inp" value={f.senha} onChange={e => setF({ ...f, senha: e.target.value })} autoComplete="current-password" required /></div>
      <div className="field"><label htmlFor="pp">Contas de demonstração</label><select id="pp" className="inp" value={f.email} onChange={e => setF({ email: e.target.value, senha: 'demo2026' })}>{DEMO.map(([e, p]) => <option key={e} value={e}>{p} · {e}</option>)}</select></div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button className="btn dark block" type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      <div className="notice"><Ic n="lock" s={16} />Depois da senha, pedimos um código de 6 números.</div>
      <div className="row between small"><Link to="/">Voltar ao app do cidadão</Link><Link to="/acesso">Solicitar acesso</Link></div>
    </form></div>
    <span className="xs muted">Projeto acadêmico · FIAP · Global Solution 2026.2</span></div><Lateral /></div>;
}

export function CodigoPainel() {
  const { state } = useLocation();
  const nav = useNavigate();
  const [dig, setDig] = useState(['', '', '', '', '', '']);
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState(null);
  const [teste, setTeste] = useState(state?.codigoTeste);
  const refs = useRef([]);
  useEffect(() => { if (!state?.email) nav('/painel/entrar'); else refs.current[0]?.focus(); }, [state, nav]);
  const mudar = (i, v) => { const d = v.replace(/\D/g, ''); if (d.length > 1) { const a = d.slice(0, 6).split(''); setDig([...a, ...Array(6 - a.length).fill('')]); return; } const n = [...dig]; n[i] = d; setDig(n); if (d && i < 5) refs.current[i + 1]?.focus(); };
  const confirmar = async e => {
    e.preventDefault(); setErro(null);
    try {
      const r = await authPainelApi.verificar({ email: state.email, codigo: dig.join(''), lembrar });
      if (r.dispositivo) localStorage.setItem('td-dispositivo', r.dispositivo);
      sessaoPainel.salvar(r); nav('/painel');
    } catch (x) { setErro(x.message); }
  };
  const reenviar = async () => { try { const r = await authPainelApi.reenviar({ email: state.email, senha: state.senha }); setTeste(r.codigoTeste); setDig(['', '', '', '', '', '']); } catch (x) { setErro(x.message); } };
  return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, background: 'var(--frame)', padding: 24 }}><span className="logo"><Marca s={30} />Tem Direito</span>
    <form className="card rise" onSubmit={confirmar} style={{ width: '100%', maxWidth: 440, padding: 32, textAlign: 'center', alignItems: 'center' }}>
      <span className="pop" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="shield" s={26} c="#17704A" /></span>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Confirme que é você</h1><p className="small muted">Enviamos 6 números para <span className="mono">{state?.mascara}</span></p>
      {teste && <div className="notice" style={{ textAlign: 'left' }}><Ic n="eye" s={16} />Ambiente de desenvolvimento, sem e-mail real. Código: <b className="mono" style={{ color: 'var(--ink)' }}>{teste}</b></div>}
      <div className="code6" style={{ justifyContent: 'center' }}>{dig.map((d, i) => <input key={i} ref={el => (refs.current[i] = el)} inputMode="numeric" maxLength={6} aria-label={`Dígito ${i + 1}`} value={d} onChange={e => mudar(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }} />)}</div>
      <label className="row small" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}><input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} /> Lembrar este computador por 30 dias</label>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button className="btn dark block" type="submit" disabled={dig.join('').length < 6}>Confirmar</button>
      <div className="row between small" style={{ width: '100%' }}><Link to="/painel/entrar">Voltar</Link><button type="button" className="btn sm" onClick={reenviar}>Reenviar código</button></div>
    </form>
    <p className="xs muted" style={{ maxWidth: 440, textAlign: 'center' }}>Pedido a cada novo computador. Protege dados de famílias em situação de vulnerabilidade.</p></div>;
}

export function SolicitarAcesso() {
  const [f, setF] = useState({ tipoOrg: 'CRAS', nomeOrg: '', cnpj: '', municipio: 'São Paulo', responsavel: '', cargo: '', email: '', telefone: '' });
  const [ok, setOk] = useState(null);
  const [erro, setErro] = useState(null);
  const campo = (k, rotulo, props = {}) => <div className="field"><label htmlFor={'sa-' + k}>{rotulo}</label><input id={'sa-' + k} className="inp" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} {...props} /></div>;
  const enviar = async e => { e.preventDefault(); setErro(null); try { setOk(await authPainelApi.solicitarAcesso(f)); } catch (x) { setErro(x.message); } };
  return <div className="login"><div style={{ display: 'flex', flexDirection: 'column', padding: '32px 48px', background: '#fff', overflowY: 'auto' }}>
    <Link className="logo" to="/"><Marca s={30} />Tem Direito <span className="pill" style={{ marginLeft: 6 }}>Painel</span></Link>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
      {ok ? <div className="col" style={{ maxWidth: 400, gap: 14 }}><span className="pop" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="check" s={26} c="#17704A" w={2.6} /></span><h1 style={{ fontSize: 24, fontWeight: 600 }}>Pedido recebido</h1><p className="muted">Protocolo <span className="mono">{ok.protocolo}</span>. A equipe do Tem Direito confere os dados e responde por e-mail em até 5 dias úteis.</p><Link className="btn" to="/painel/entrar">Voltar ao login</Link></div>
        : <form className="col" onSubmit={enviar} style={{ width: '100%', maxWidth: 440, gap: 14 }}>
          <div><h1 style={{ fontSize: 26, fontWeight: 600 }}>Solicitar acesso</h1><p className="small muted" style={{ marginTop: 6 }}>Para CRAS, secretarias e organizações que atendem famílias.</p></div>
          <div className="field"><label htmlFor="sa-tipo">Tipo de organização</label><select id="sa-tipo" className="inp" value={f.tipoOrg} onChange={e => setF({ ...f, tipoOrg: e.target.value })}>{['CRAS', 'Secretaria municipal', 'ONG', 'Defensoria', 'Outro'].map(t => <option key={t}>{t}</option>)}</select></div>
          {campo('nomeOrg', 'Nome da organização', { required: true })}
          <div className="row" style={{ gap: 12 }}><div style={{ flex: 1 }}>{campo('cnpj', 'CNPJ (opcional)', { inputMode: 'numeric' })}</div><div style={{ flex: 1 }}>{campo('municipio', 'Município')}</div></div>
          <div className="row" style={{ gap: 12 }}><div style={{ flex: 1 }}>{campo('responsavel', 'Responsável', { required: true })}</div><div style={{ flex: 1 }}>{campo('cargo', 'Cargo')}</div></div>
          {campo('email', 'E-mail institucional', { type: 'email', required: true })}{campo('telefone', 'Telefone', { inputMode: 'tel' })}
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <button className="btn dark block" type="submit">Enviar pedido</button><Link to="/painel/entrar" className="small">Já tenho acesso · Entrar</Link>
        </form>}
    </div></div><Lateral /></div>;
}
