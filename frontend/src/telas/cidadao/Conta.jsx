// D2 · Criar conta, D3 · Entrar, D4 · Código por SMS, D11 · Privacidade e conta, e Apagar dados.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CidadaoPagina, { Voltar } from '../../componentes/CidadaoPagina.jsx';
import { Aviso, Ic, Interruptor, Linha, baixar } from '../../componentes/ui.jsx';
import { contaApi } from '../../api/servicos.js';
import { useCidadao } from '../../estado/cidadao.jsx';

const mascaraFone = v => { const d = v.replace(/\D/g, '').slice(0, 11); return d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; };

export function CriarConta({ entrar }) {
  const nav = useNavigate();
  const { c } = useCidadao();
  const [f, setF] = useState({ nome: '', fone: '', termos: false, sens: false, cras: true });
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const enviar = async e => {
    e.preventDefault(); setErro(null); setEnviando(true);
    try {
      const r = await contaApi.codigo({ telefone: f.fone, nome: f.nome || null, aceiteTermos: entrar ? undefined : f.termos, aceiteSensiveis: entrar ? undefined : f.sens });
      nav('/codigo', { state: { fone: f.fone, mascara: r.mascara, codigoTeste: r.codigoTeste, novo: !entrar, cras: f.cras } });
    } catch (x) { setErro(x.message); } finally { setEnviando(false); }
  };
  return <CidadaoPagina>
    <Voltar para={c.feito ? '/resultado' : '/'} />
    <h1 className="c-h1">{entrar ? 'Entrar' : 'Criar conta'}</h1>
    <p className="muted">{entrar ? 'Use o mesmo celular do cadastro.' : 'Sem CPF e sem senha: você entra com um código no celular.'}</p>
    <form className="col" onSubmit={enviar}>
      {!entrar && <div className="field"><label htmlFor="cn">Como quer ser chamada? (opcional)</label><input id="cn" className="inp" value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Cida" autoComplete="given-name" /></div>}
      <div className="field"><label htmlFor="cf">Celular com DDD</label><input id="cf" className="inp num" inputMode="tel" value={f.fone} onChange={e => setF({ ...f, fone: mascaraFone(e.target.value) })} placeholder="(11) 90000-0000" required autoComplete="tel" /></div>
      {!entrar && <>
        <label className="check"><input type="checkbox" checked={f.termos} onChange={e => setF({ ...f, termos: e.target.checked })} required /><span className="box"><Ic n="check" s={15} c="#fff" w={3} /></span><span>Li e aceito os termos de uso</span></label>
        <label className="check"><input type="checkbox" checked={f.sens} onChange={e => setF({ ...f, sens: e.target.checked })} required /><span className="box"><Ic n="check" s={15} c="#fff" w={3} /></span><span className="small">Autorizo usar renda e saúde só para avaliar direitos. Posso retirar quando quiser.</span></label>
        <label className="check"><input type="checkbox" checked={f.cras} onChange={e => setF({ ...f, cras: e.target.checked })} /><span className="box"><Ic n="check" s={15} c="#fff" w={3} /></span><span className="small">O CRAS pode me mandar aviso pelo app sobre meus pedidos</span></label></>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button className="btn pri block" type="submit" disabled={enviando}>{enviando ? 'Enviando…' : entrar ? 'Receber código' : 'Enviar código'}</button>
    </form>
    {entrar ? <Link to="/conta" className="small">Não tenho conta · Criar</Link> : <Link to="/entrar" className="small">Já tenho conta · Entrar</Link>}
  </CidadaoPagina>;
}

export function Codigo() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { c, atualizar } = useCidadao();
  const [dig, setDig] = useState(['', '', '', '', '', '']);
  const [erro, setErro] = useState(null);
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  if (!state?.fone) return <CidadaoPagina><Voltar para="/entrar" /><p>Comece pelo número do celular.</p></CidadaoPagina>;
  const mudar = (i, v) => { const d = v.replace(/\D/g, ''); if (d.length > 1) { const arr = d.slice(0, 6).split(''); setDig([...arr, ...Array(6 - arr.length).fill('')]); refs.current[Math.min(5, arr.length)]?.focus(); return; } const n = [...dig]; n[i] = d; setDig(n); if (d && i < 5) refs.current[i + 1]?.focus(); };
  const confirmar = async e => {
    e.preventDefault(); setErro(null);
    try {
      const r = await contaApi.confirmar({ telefone: state.fone, codigo: dig.join('') });
      let conta = r.conta;
      if (state.novo) conta = await contaApi.atualizar(r.token, { avisoCras: !!state.cras });
      if (c.code && c.chave) { try { conta = await contaApi.vincular(r.token, c.code, c.chave); } catch { /* triagem já vinculada */ } }
      atualizar({ conta, token: r.token });
      nav(c.feito ? '/meus-direitos' : '/');
    } catch (x) { setErro(x.message); }
  };
  return <CidadaoPagina>
    <Voltar para={state.novo ? '/conta' : '/entrar'} /><h1 className="c-h1">Digite o código</h1>
    <p className="muted">Mandamos 6 números por SMS para {state.mascara || 'o seu celular'}.</p>
    {state.codigoTeste && <div className="notice"><Ic n="eye" s={16} />Ambiente de teste, sem SMS real. Código: <b className="mono" style={{ color: 'var(--ink)' }}>{state.codigoTeste}</b></div>}
    <form className="col" onSubmit={confirmar}>
      <div className="code6">{dig.map((d, i) => <input key={i} ref={el => (refs.current[i] = el)} inputMode="numeric" maxLength={6} aria-label={`Dígito ${i + 1}`} className="num" value={d} onChange={e => mudar(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }} />)}</div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button className="btn pri block" type="submit" disabled={dig.join('').length < 6}>Confirmar</button>
    </form>
  </CidadaoPagina>;
}

export function Privacidade() {
  const { c, atualizar } = useCidadao();
  const nav = useNavigate();
  const [conta, setConta] = useState(c.conta);
  const [erro, setErro] = useState(null);
  useEffect(() => { if (c.token) contaApi.eu(c.token).then(setConta).catch(e => { if (e.status === 401 || e.status === 404) atualizar({ conta: null, token: null }); }); }, [c.token, atualizar]);
  const pref = async (k, v) => { try { const r = await contaApi.atualizar(c.token, { [k]: v }); setConta(r); atualizar({ conta: r }); } catch (e) { setErro(e.message); } };
  const exportar = async () => {
    const local = { respostas: c.ans, lembrete: c.lembrete, status: c.status, codigo: c.code };
    let servidor = null;
    if (c.token) { try { servidor = await contaApi.dados(c.token); } catch { /* segue só com o aparelho */ } }
    baixar('meus-dados-tem-direito.json', JSON.stringify({ geradoEm: new Date().toISOString(), noAparelho: local, noServidor: servidor }, null, 2), 'application/json');
  };
  return <CidadaoPagina>
    <Voltar para={c.feito ? '/meus-direitos' : '/'} /><h1 className="c-h1">Privacidade e conta</h1>
    <div className="card"><b>O que guardamos</b>
      <span className="small muted" style={{ lineHeight: 1.5 }}>Neste aparelho, só enquanto o site está aberto: suas respostas, o kit e os lembretes. Fechou, apaga. No servidor: a triagem anônima ({c.code ? <span className="mono">#{c.code}</span> : 'não registrada'}){conta ? ' e a conta, com o celular cifrado' : ''}. Nunca CPF, NIS ou senha.</span>
      <button className="btn sm" onClick={exportar}><Ic n="download" s={16} />Baixar meus dados</button></div>
    {conta ? <div className="card"><b>Conta {conta.nome ? '· ' + conta.nome : ''}</b><span className="small muted">Celular {conta.telefone}</span>
      <Linha titulo="Usar renda e saúde para avaliar" sub="consentimento da Lei Geral de Proteção de Dados (art. 11)"><Interruptor ligado={conta.aceiteSensiveis} rotulo="Usar renda e saúde" onChange={v => pref('aceiteSensiveis', v)} /></Linha>
      <Linha titulo="Avisos do CRAS" sub="por app e SMS"><Interruptor ligado={conta.avisoCras} rotulo="Avisos do CRAS" onChange={v => pref('avisoCras', v)} /></Linha>
      <Linha titulo="Benefícios novos" sub="quando uma regra mudar a seu favor"><Interruptor ligado={conta.avisoNovos} rotulo="Benefícios novos" onChange={v => pref('avisoNovos', v)} /></Linha>
      <Linha titulo="Prazos" sub="recurso e renovação"><Interruptor ligado={conta.avisoPrazos} rotulo="Prazos" onChange={v => pref('avisoPrazos', v)} /></Linha>
      <button className="btn sm" onClick={() => { atualizar({ conta: null, token: null }); nav('/'); }}><Ic n="logout" s={16} />Sair da conta</button></div>
      : <div className="card"><b>Sem conta</b><span className="small muted">Crie uma conta só com o celular para receber SMS e acompanhar de outro aparelho.</span><Link className="btn sm" to="/conta">Criar conta</Link></div>}
    <div className="card"><Linha titulo="O CRAS pode mandar aviso pelo app" sub="vale para esta triagem"><Interruptor ligado={c.autorizou} rotulo="Autorizar avisos" onChange={async v => { atualizar({ autorizou: v }); if (c.code && c.chave) { const { triagemApi } = await import('../../api/servicos.js'); triagemApi.atualizar(c.code, c.chave, { autorizou: v }).catch(() => {}); } }} /></Linha></div>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    <Link className="btn danger" to="/apagar"><Ic n="trash" s={16} c="#fff" />Apagar tudo</Link>
  </CidadaoPagina>;
}

export function Apagar() {
  const { c, apagarTudo } = useCidadao();
  const nav = useNavigate();
  const [apagando, setApagando] = useState(false);
  const apagar = async () => {
    setApagando(true);
    if (c.token) { try { await contaApi.apagar(c.token); } catch { /* conta já apagada */ } }
    await apagarTudo();
    nav('/');
  };
  return <CidadaoPagina rodape={<><button className="btn danger block" disabled={apagando} onClick={apagar}>{apagando ? 'Apagando…' : 'Sim, apagar tudo'}</button><Link className="btn block" to={c.feito ? '/meus-direitos' : '/'}>Cancelar</Link></>}>
    <Voltar para={c.feito ? '/meus-direitos' : '/'} />
    <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 12, marginTop: 24 }}><span className="pop" style={{ width: 72, height: 72, borderRadius: '50%', background: '#ffedea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="trash" s={32} c="#c4242a" /></span>
      <h1 className="c-h1">Apagar todas as respostas?</h1><p className="muted" style={{ lineHeight: 1.5 }}>Apaga a triagem, o kit, os lembretes{c.conta ? ', a conta' : ''} e o registro anônimo no painel. Não dá para desfazer.</p></div>
    <div className="card" style={{ background: 'var(--raised)' }}><b className="small">O que continua</b><span className="small muted" style={{ lineHeight: 1.5 }}>Só os números agregados do painel, como “312 triagens no Jardim Ângela”, sem identificar ninguém.</span></div>
  </CidadaoPagina>;
}
