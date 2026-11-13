// E2 · Dados da unidade, E3 · Equipe e permissões, E4 · Preferências.
import { useEffect, useState } from 'react';
import PainelShell, { Cabecalho, PERFIL_TXT } from '../../componentes/PainelShell.jsx';
import { Aviso, Carregando, Ic, Interruptor, Linha, Pill } from '../../componentes/ui.jsx';
import { sessaoPainel } from '../../api/cliente.js';
import { configApi, gestaoApi } from '../../api/servicos.js';
import { BAIRROS } from '../../estado/formato.js';

const ehCoord = () => sessaoPainel.ler()?.perfil === 'COORDENACAO';

function useUnidade() {
  const [u, setU] = useState(null); const [erro, setErro] = useState(null); const [msg, setMsg] = useState(null);
  useEffect(() => { configApi.unidade().then(setU).catch(e => setErro(e.message)); }, []);
  const salvar = async parte => { setMsg(null); try { setU(await configApi.salvarUnidade(parte)); setMsg('Salvo.'); } catch (e) { setErro(e.message); } };
  return { u, setU, erro, msg, salvar };
}

export function Unidade() {
  const { u, setU, erro, msg, salvar } = useUnidade();
  const SERV = ['Cadastro Único', 'Bolsa Família', 'BPC (orientação)', 'Tarifa Social de Energia', 'Acompanhamento familiar (PAIF)', 'Carteira da Pessoa Idosa', 'Orientação jurídica'];
  return <PainelShell migalhas={['Unidade', 'Dados da unidade']}>
    <Cabecalho titulo="Dados da unidade" sub="O que o app mostra para a família sobre este CRAS" />
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!u ? <Carregando /> : <div className="prow"><div className="col" style={{ flex: 3, gap: 24 }}><section className="panel rise"><h2>Identificação</h2>
      {[['nome', 'Nome da unidade'], ['telefone', 'Telefone'], ['endereco', 'Endereço']].map(([k, l]) => <div key={k} className="field"><label style={{ fontSize: 13 }}>{l}</label><input className="inp sm" disabled={!ehCoord()} value={u[k] || ''} onChange={e => setU({ ...u, [k]: e.target.value })} /></div>)}
      <Linha titulo="Atende sem agendamento" sub="o app diz que dá para ir direto"><Interruptor ligado={u.semAgendamento} rotulo="Atende sem agendamento" onChange={v => setU({ ...u, semAgendamento: v })} /></Linha></section>
      <section className="panel rise"><h2>Horários</h2>{u.horarios.map((h, i) => <div key={h.dia} className="row" style={{ gap: 12, height: 40 }}><span style={{ width: 90 }}>{h.dia}</span>
        <Interruptor ligado={h.aberto} rotulo={'Aberto ' + h.dia} onChange={v => { const l = [...u.horarios]; l[i] = { ...h, aberto: v }; setU({ ...u, horarios: l }); }} />
        {h.aberto ? <><input className="inp sm num" style={{ width: 90 }} value={h.abre} onChange={e => { const l = [...u.horarios]; l[i] = { ...h, abre: e.target.value }; setU({ ...u, horarios: l }); }} /><span className="muted">às</span><input className="inp sm num" style={{ width: 90 }} value={h.fecha} onChange={e => { const l = [...u.horarios]; l[i] = { ...h, fecha: e.target.value }; setU({ ...u, horarios: l }); }} /></> : <span className="small muted">Fechado</span>}</div>)}</section></div>
      <div className="col" style={{ flex: 2, gap: 24 }}><section className="panel rise"><h2>Território</h2><span className="xs muted">Bairros atendidos por esta unidade</span><div className="chips">{BAIRROS.map(b => <button key={b} className="chip" aria-pressed={u.territorio.includes(b)} onClick={() => setU({ ...u, territorio: u.territorio.includes(b) ? u.territorio.filter(x => x !== b) : [...u.territorio, b] })}>{b}</button>)}</div></section>
        <section className="panel rise"><h2>Serviços</h2>{SERV.map(s => <label key={s} className="row small" style={{ gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={u.servicos.includes(s)} onChange={e => setU({ ...u, servicos: e.target.checked ? [...u.servicos, s] : u.servicos.filter(x => x !== s) })} />{s}</label>)}</section>
        {ehCoord() ? <button className="btn pri" onClick={() => salvar({ nome: u.nome, telefone: u.telefone, endereco: u.endereco, semAgendamento: u.semAgendamento, horarios: u.horarios, territorio: u.territorio, servicos: u.servicos })}>Salvar alterações</button> : <div className="notice"><Ic n="lock" s={16} />Só a coordenação altera os dados da unidade.</div>}
        {msg && <Aviso>{msg}</Aviso>}</div></div>}
  </PainelShell>;
}

export function Equipe() {
  const [lista, setLista] = useState(null); const [erro, setErro] = useState(null);
  const [conv, setConv] = useState({ email: '', nome: '', perfil: 'ATENDENTE' }); const [ok, setOk] = useState(null);
  const carregar = () => configApi.equipe().then(setLista).catch(e => setErro(e.message));
  useEffect(() => { carregar(); }, []);
  const convidar = async e => { e.preventDefault(); setErro(null); setOk(null); try { const r = await configApi.convidar(conv); setOk(r); setConv({ email: '', nome: '', perfil: 'ATENDENTE' }); carregar(); } catch (x) { setErro(x.message); } };
  const PERM = [['Ver visão geral, mapa e encaminhamentos', 1, 1, 1], ['Mudar situação e mandar aviso', 1, 1, 1], ['Relatórios e automações', 0, 1, 1], ['Simular regras', 1, 1, 1], ['Editar e publicar regras', 0, 0, 1], ['Configurar unidade e equipe', 0, 1, 0]];
  return <PainelShell migalhas={['Unidade', 'Equipe']}>
    <Cabecalho titulo="Equipe e permissões" sub="Quem acessa o painel e o que cada perfil pode fazer" />
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    <div className="prow"><div className="col" style={{ flex: 3, gap: 24 }}>{ehCoord() && <form className="panel rise" onSubmit={convidar}><h2>Convidar pessoa</h2><div className="row wrap" style={{ gap: 8 }}>
      <input className="inp sm" style={{ flex: 2, minWidth: 220 }} type="email" required placeholder="email@prefeitura.sp.gov.br" value={conv.email} onChange={e => setConv({ ...conv, email: e.target.value })} />
      <input className="inp sm" style={{ flex: 1, minWidth: 140 }} placeholder="Nome" value={conv.nome} onChange={e => setConv({ ...conv, nome: e.target.value })} />
      <select className="p-sel" value={conv.perfil} onChange={e => setConv({ ...conv, perfil: e.target.value })}>{Object.entries(PERFIL_TXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><button className="btn pri" type="submit">Convidar</button></div>
      {ok && <Aviso>Convite criado para {ok.email}. Senha provisória (ambiente de demonstração): <b className="mono">{ok.senhaProvisoria}</b></Aviso>}</form>}
      <section className="panel rise"><h2>Pessoas</h2>{!lista ? <Carregando /> : <table className="t"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th></tr></thead><tbody>
        {lista.map(p => <tr key={p.id}><td>{p.nome}</td><td className="muted">{p.email}</td><td>{ehCoord() ? <select className="p-sel" value={p.perfil} onChange={async e => { await configApi.alterar(p.id, { perfil: e.target.value }); carregar(); }}>{Object.entries(PERFIL_TXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : p.perfilTexto}</td>
          <td>{ehCoord() ? <button className="btn sm" onClick={async () => { await configApi.alterar(p.id, { situacao: p.situacao === 'ATIVO' ? 'INATIVO' : 'ATIVO' }); carregar(); }}>{p.situacao === 'ATIVO' ? <Pill t="Ativo" k="pos" /> : <Pill t="Inativo" />}</button> : <Pill t={p.situacao} />}</td></tr>)}</tbody></table>}</section></div>
      <section className="panel rise" style={{ flex: 2, alignSelf: 'flex-start' }}><h2>Permissões por perfil</h2><table className="t"><thead><tr><th /><th className="r">Atendente</th><th className="r">Coordenação</th><th className="r">Gestor</th></tr></thead><tbody>
        {PERM.map(([t, ...v]) => <tr key={t}><td style={{ whiteSpace: 'normal' }} className="small">{t}</td>{v.map((x, i) => <td key={i} className="r">{x ? <Ic n="check" s={16} c="#1e7b4f" w={2.4} /> : <span className="muted">—</span>}</td>)}</tr>)}</tbody></table></section></div>
  </PainelShell>;
}

export function Preferencias() {
  const { u, setU, erro, msg, salvar } = useUnidade();
  const [bens, setBens] = useState(null);
  useEffect(() => { gestaoApi.beneficios().then(setBens).catch(() => {}); }, []);
  return <PainelShell migalhas={['Unidade', 'Preferências']}>
    <Cabecalho titulo="Preferências" sub="Como o Tem Direito trabalha para esta unidade" />
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!u ? <Carregando /> : <div className="prow"><div className="col" style={{ flex: 3, gap: 24 }}>
      <section className="panel rise"><h2>Mensagem de retorno</h2><span className="xs muted">Texto do aviso quando o CRAS pede para a família voltar</span><textarea className="inp" rows={3} maxLength={300} disabled={!ehCoord()} value={u.mensagemRetorno || ''} onChange={e => setU({ ...u, mensagemRetorno: e.target.value })} /><span className="xs muted num">{(u.mensagemRetorno || '').length} / 300</span></section>
      <section className="panel rise"><h2>Privacidade (LGPD)</h2><div className="field"><label style={{ fontSize: 13 }}>Guardar triagens individuais por</label><select className="p-sel" disabled={!ehCoord()} value={u.retencaoDias} onChange={e => setU({ ...u, retencaoDias: +e.target.value })}>{[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} dias</option>)}</select>
        <span className="xs muted">Depois disso, o expurgo automático apaga a triagem e guarda só os números por bairro.</span></div></section>
      <section className="panel rise"><h2>Resumo semanal</h2><Linha titulo="Receber resumo toda segunda, 8h" sub="triagens, encaminhados, travados e o documento que mais falta"><Interruptor ligado={u.resumoSemanal} rotulo="Resumo semanal" onChange={v => setU({ ...u, resumoSemanal: v })} /></Linha></section>
      {ehCoord() ? <button className="btn pri" style={{ width: 'fit-content' }} onClick={() => salvar({ mensagemRetorno: u.mensagemRetorno, retencaoDias: u.retencaoDias, resumoSemanal: u.resumoSemanal })}>Salvar preferências</button> : <div className="notice"><Ic n="lock" s={16} />Só a coordenação altera as preferências.</div>}
      {msg && <Aviso>{msg}</Aviso>}</div>
      <section className="panel rise" style={{ flex: 2, alignSelf: 'flex-start' }}><h2>Benefícios orientados aqui</h2><span className="xs muted">Liga e desliga em Gestão → Benefícios (perfil gestor).</span>{!bens ? <Carregando /> : <div className="col" style={{ gap: 2 }}>{bens.map(b => <div key={b.id} className="row between small" style={{ height: 30 }}><span>{b.nome}</span>{b.ativoUnidade ? <Pill t="Ativo" k="pos" /> : <Pill t="Desligado" />}</div>)}</div>}</section></div>}
  </PainelShell>;
}
