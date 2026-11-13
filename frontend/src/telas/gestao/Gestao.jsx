// C1 · Benefícios, C2 · Editor de regras, C3 · Documentos e passos, C4 · Simulador, C5 · Histórico e C6 · Pontos.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Mapa from '../../componentes/Mapa.jsx';
import PainelShell, { Cabecalho } from '../../componentes/PainelShell.jsx';
import { Aviso, Carregando, Ic, Interruptor, Passos, Pill } from '../../componentes/ui.jsx';
import { sessaoPainel } from '../../api/cliente.js';
import { gestaoApi, painelApi } from '../../api/servicos.js';
import { BEN_NOME, ST, brl, dmyy, fmtN } from '../../estado/formato.js';
import { perguntas } from '../../estado/perguntas.js';

const ehGestor = () => sessaoPainel.ler()?.perfil === 'GESTOR';
function useCarregar(fn, deps = []) {
  const [d, setD] = useState(null); const [erro, setErro] = useState(null); const [n, setN] = useState(0);
  useEffect(() => { fn().then(setD).catch(e => setErro(e.message)); }, [...deps, n]); // eslint-disable-line react-hooks/exhaustive-deps
  return [d, erro, () => setN(x => x + 1)];
}

/** Campos editáveis de cada regra (mesma tabela do protótipo). frac = fração do salário mínimo. */
const CAMPOS = {
  _geral: [['sm', 'Salário mínimo usado nos cálculos (R$)', 'n']],
  cad: [['frac', 'Renda por pessoa até (fração do salário mínimo)', 'frac'], ['totSM', 'Ou renda da casa até (salários mínimos)', 'n']],
  bolsa: [['lim', 'Renda por pessoa até (R$)', 'n'], ['base', 'Piso por família (R$)', 'n'], ['pessoa', 'Valor por pessoa (R$)', 'n'], ['crianca', 'Adicional por criança de até 6 anos (R$)', 'n'], ['variavel', 'Adicional por gestante ou criança de 7 a 17 (R$)', 'n']],
  bpcI: [['idade', 'Idade mínima (anos)', 'n'], ['frac', 'Renda por pessoa até (fração do salário mínimo)', 'frac'], ['texto', 'Texto simples que o cidadão vê', 'txt']],
  bpcP: [['frac', 'Renda por pessoa até (fração do salário mínimo)', 'frac']],
  tar: [['frac', 'Renda por pessoa até (fração do salário mínimo)', 'frac'], ['kwh', 'Consumo com gratuidade até (kWh)', 'n']],
  desc: [['ate', 'Renda por pessoa até (fração do salário mínimo)', 'frac'], ['kwh', 'Consumo até (kWh)', 'n']], gas: [['frac', 'Renda por pessoa até', 'frac']], agua: [['frac', 'Renda por pessoa até', 'frac'], ['vuln', 'Tarifa Vulnerável: renda por pessoa até (R$)', 'n']],
  pdm: [['frac', 'Renda por pessoa até', 'frac']], dign: [['lim', 'Renda por pessoa até (R$)', 'n']], idj: [['totSM', 'Renda da casa até (salários mínimos)', 'n']], cpi: [['idade', 'Idade mínima', 'n'], ['sm2', 'Renda própria até (salários mínimos)', 'n']],
  mcmv: [['lim', 'Renda da casa até (R$)', 'n']], abono: [['lim', 'Média salarial até (R$)', 'n']], isen: [['frac', 'Renda por pessoa até', 'frac']], prouni: [['integral', 'Bolsa integral: renda por pessoa até (SM)', 'n'], ['parcial', 'Bolsa parcial: renda por pessoa até (SM)', 'n']],
  fies: [['frac', 'Renda por pessoa até', 'frac']], plpcd: [['frac', 'Renda por pessoa até', 'frac']], sup: [['frac', 'Renda por pessoa até', 'frac'], ['lim', 'Transferência para renda abaixo de (R$)', 'n'], ['valor', 'Valor por pessoa (R$)', 'n']], ple: [['frac', 'Renda por pessoa até (técnico e faculdade)', 'frac']], tid: [['idade', 'Idade mínima', 'n']], pot: [['bolsa', 'Valor da bolsa (R$)', 'n']]
};
const FRAC = { 0.25: '¼ do salário mínimo', 0.5: '½ salário mínimo', 1: '1 salário mínimo', 1.5: '1,5 salário mínimo', 2: '2 salários mínimos', 3: '3 salários mínimos' };
const fracTxt = f => FRAC[f] || String(f).replace('.', ',') + ' SM';
const nomeRegra = (k, bens) => k === '_geral' ? 'Salário mínimo (geral)' : (bens?.find(b => b.chaveRegra === k)?.nome || k);

export function Beneficios() {
  const [bens, erro, rec] = useCarregar(() => gestaoApi.beneficios());
  const [regras] = useCarregar(() => gestaoApi.regras());
  const [visao] = useCarregar(() => painelApi.visao({ per: '30' }));
  const nav = useNavigate();
  const sm = regras?.find(r => r.chave === '_geral')?.campos?.sm;
  const ab = a => bens?.filter(b => b.abrangencia === a).length || 0;
  return <PainelShell migalhas={['Gestão', 'Benefícios']}>
    <Cabecalho titulo="Benefícios" sub={bens ? `${bens.length} benefícios que o assistente sabe avaliar · ${ab('Federal')} federais, ${ab('Estadual')} do Estado de SP e ${ab('Municipal')} da cidade de SP · salário mínimo usado: ${brl(sm, 1)}` : ''} />
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!bens ? <Carregando /> : <div style={{ overflowX: 'auto' }}><table className="t"><thead><tr><th>Benefício</th><th>Órgão</th><th>Abrangência</th><th>Regra vigente</th><th className="r">Triagens (30 dias)</th><th>Status</th><th>Orientar nesta unidade</th></tr></thead><tbody>
      {bens.map(b => { const r = regras?.find(x => x.chave === b.chaveRegra); return <tr key={b.id} className="click" onClick={() => nav('/gestao/regras?k=' + b.chaveRegra)}>
        <td><b style={{ fontWeight: 500 }}>{b.nome}</b></td><td className="muted">{b.orgao}</td><td>{b.abrangencia}</td><td><span className="mono">v{r?.versao ?? 1}</span>{r?.rascunho && <> · <span className="mono">v{(r.versao || 1) + 1}</span> em rascunho</>}</td>
        <td className="r num">{fmtN(visao?.atual?.ben?.[b.id] || 0)}</td><td>{r?.rascunho ? <Pill t="Rascunho" k="warn" /> : <Pill t="Publicado" k="pos" />}</td>
        <td onClick={e => e.stopPropagation()}><Interruptor ligado={b.ativoUnidade} rotulo={'Orientar ' + b.nome} onChange={async v => { if (!ehGestor()) return; await gestaoApi.ativar(b.id, v); rec(); }} /></td></tr>; })}</tbody></table></div>}
    <div className="notice"><Ic n="shield" s={16} c="#17704A" />Toda regra passa pelo simulador e pela revisão de uma assistente social antes de chegar ao app. Clique em um benefício para editar.</div>
  </PainelShell>;
}

export function EditorRegras() {
  const [sp, setSp] = useSearchParams();
  const k = sp.get('k') || 'bpcI';
  const [regras, erro, rec] = useCarregar(() => gestaoApi.regras());
  const [bens] = useCarregar(() => gestaoApi.beneficios());
  const [rasc, setRasc] = useState(null);
  const [casos, setCasos] = useState(null);
  const [rev, setRev] = useState('');
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState(null);
  const regra = regras?.find(r => r.chave === k);
  useEffect(() => { if (regra) setRasc(regra.rascunho ? { ...regra.campos, ...regra.rascunho } : { ...regra.campos }); setCasos(null); setMsg(null); }, [regra]);
  const muds = regra && rasc ? Object.keys(rasc).filter(c => c !== 'v' && String(rasc[c]) !== String(regra.campos[c])) : [];
  useEffect(() => { if (!rasc) return; const t = setTimeout(() => gestaoApi.simular({ rascunhos: { [k]: rasc } }).then(r => setCasos(r.casos)).catch(() => {}), 300); return () => clearTimeout(t); }, [rasc, k]);
  const ok = casos ? casos.filter(c => c.passou).length : 0;
  const salvar = async () => { setMsg(null); try { await gestaoApi.rascunho(k, rasc); rec(); setMsg(['ok', 'Rascunho salvo. A versão publicada continua valendo.']); } catch (e) { setMsg(['erro', e.message]); } };
  const publicar = async () => { setMsg(null); try { await gestaoApi.rascunho(k, rasc); const h = await gestaoApi.publicar(k, { revisor: rev, motivo }); setRev(''); setMotivo(''); rec(); setMsg(['ok', `Publicado: ${h.titulo}. O app passa a usar a nova regra.`]); } catch (e) { setMsg(['erro', e.message]); } };
  const campos = CAMPOS[k] || [];
  return <PainelShell migalhas={['Gestão', 'Editor de regras', nomeRegra(k, bens)]}>
    <Cabecalho titulo="Editor de regras" sub={regra?.rascunho ? 'Rascunho salvo · a versão publicada continua valendo até publicar' : 'Sem rascunho · edite um campo para começar'}>
      <select className="p-sel" value={k} onChange={e => setSp({ k: e.target.value })} aria-label="Regra">{(regras || []).map(r => <option key={r.chave} value={r.chave}>{nomeRegra(r.chave, bens)}</option>)}</select><Link className="btn" to="/gestao/simulador"><Ic n="flask" s={15} />Simulador</Link></Cabecalho>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!regra || !rasc ? <Carregando /> : <div className="prow"><div className="col" style={{ flex: 5, gap: 24 }}>
      <section className="panel rise"><div className="row between"><h2>{nomeRegra(k, bens)} · regra v{regra.versao}{muds.length ? ' → v' + (regra.versao + 1) : ''}</h2>{muds.length ? <Pill t="Rascunho" k="warn" /> : <Pill t="Publicada" k="pos" />}</div>
        {campos.length ? campos.map(([c, l, t]) => <div key={c} className="field"><label style={{ fontSize: 13 }}>{l}</label>
          {t === 'frac' ? <select className="p-sel" value={rasc[c]} disabled={!ehGestor()} onChange={e => setRasc({ ...rasc, [c]: +e.target.value })}>{[0.25, 0.5, 1, 1.5, 2, 3].map(f => <option key={f} value={f}>{fracTxt(f)}</option>)}</select>
            : t === 'txt' ? <><textarea className="inp" rows={3} maxLength={160} disabled={!ehGestor()} value={rasc[c] || ''} onChange={e => setRasc({ ...rasc, [c]: e.target.value })} /><span className="xs muted num">{String(rasc[c] || '').length} / 160 caracteres</span></>
              : <input className="inp sm num" style={{ maxWidth: 200 }} disabled={!ehGestor()} value={rasc[c] ?? ''} onChange={e => { const v = e.target.value.replace(',', '.'); setRasc({ ...rasc, [c]: v === '' || isNaN(+v) ? v : +v }); }} />}</div>)
          : <span className="small muted">Esta regra não tem limites editáveis: depende só da situação da pessoa (idade, deficiência, emprego ou receita).</span>}</section>
      <section className="panel rise"><h2>O que muda</h2>{muds.length ? <div className="diff">{muds.map(c => <div key={c}><div className="dm">−  {c}: {String(regra.campos[c])}</div><div className="dp">+  {c}: {String(rasc[c])}</div></div>)}</div> : <span className="small muted">Nada mudou em relação à versão publicada.</span>}</section></div>
      <section className="panel rise" style={{ flex: 3, alignSelf: 'flex-start' }}><h2>Revisão e publicação</h2>
        <Passos itens={[['Rascunho', muds.length ? muds.length + ' mudança(s)' : 'sem mudanças', muds.length ? 'ok' : 'now'], ['Casos de teste', casos ? ok + ' de ' + casos.length + ' passaram' : 'rodando…', casos && ok === casos.length ? 'ok' : 'bad'], ['Revisão da assistente social', rev ? 'por ' + rev : 'pendente', rev ? 'ok' : muds.length ? 'now' : 'next'], ['Publicação', 'a versão atual vale até lá', 'next']]} />
        {casos?.filter(c => !c.passou).map(c => <div key={c.nome} className="small" style={{ color: 'var(--neg)' }}>Falhou: {c.nome} ({c.falhas.join('; ')})</div>)}
        {ehGestor() ? <>
          <div className="field"><label htmlFor="rev" style={{ fontSize: 13 }}>Assistente social que revisou</label><input id="rev" className="inp sm" placeholder="Ex.: Ana Paula Ribeiro" value={rev} onChange={e => setRev(e.target.value)} /></div>
          <div className="field"><label htmlFor="motivo" style={{ fontSize: 13 }}>Motivo da mudança</label><input id="motivo" className="inp sm" placeholder="Ex.: novo salário mínimo" value={motivo} onChange={e => setMotivo(e.target.value)} /></div>
          <button className="btn" disabled={!muds.length} onClick={salvar}>Salvar rascunho</button>
          <button className="btn pri" disabled={!muds.length || !rev.trim() || !motivo.trim() || !casos || ok !== casos.length} onClick={publicar}>Publicar</button>
          {regra.rascunho && <button className="btn" onClick={async () => { await gestaoApi.descartar(k); rec(); }}>Descartar rascunho</button>}
          <span className="xs muted">Ao publicar, o app do cidadão passa a usar a nova regra em todos os aparelhos.</span></>
          : <div className="notice"><Ic n="lock" s={16} />Só o perfil “Gestor de regras” edita e publica. Você pode simular.</div>}
        {msg && <Aviso tipo={msg[0] === 'erro' ? 'erro' : undefined}>{msg[1]}</Aviso>}</section></div>}
  </PainelShell>;
}

const PADRAO_SIM = { pessoas: 2, idade: 67, pcd: 'nao', renda: 760, aposent: 'nao', cad: 'nao', remedio: 'sim', luz: 'nao', grupos: ['c717'] };

export function Simulador() {
  const [a, setA] = useState(PADRAO_SIM);
  const [r, setR] = useState(null);
  const [erro, setErro] = useState(null);
  const [regras] = useCarregar(() => gestaoApi.regras());
  const rascunhos = Object.fromEntries((regras || []).filter(x => x.rascunho).map(x => [x.chave, x.rascunho]));
  const temRasc = Object.keys(rascunhos).length > 0;
  useEffect(() => { const t = setTimeout(() => {
    const respostas = { ...a, pessoas: +a.pessoas || 1, idade: a.idade === '' ? null : +a.idade, renda: +a.renda || 0, criancas: (a.grupos || []).some(g => g === 'c06' || g === 'c717') ? 'sim' : 'nao' };
    gestaoApi.simular({ respostas, rascunhos }).then(setR).catch(e => setErro(e.message)); }, 250); return () => clearTimeout(t); }, [a, regras]); // eslint-disable-line react-hooks/exhaustive-deps
  const sel = (k, opts) => <select className="p-sel" value={String(a[k])} onChange={e => setA({ ...a, [k]: e.target.value })}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>;
  const ok = r ? r.casos.filter(c => c.passou).length : 0;
  const grupos = perguntas(false).find(q => q.k === 'grupos').opts.filter(o => o[0] !== 'nen');
  return <PainelShell migalhas={['Gestão', 'Simulador']}>
    <Cabecalho titulo="Simulador de triagem" sub={temRasc ? 'Testando os rascunhos, comparados com a versão publicada' : 'Testando a versão publicada'}><Link className="btn" to="/gestao/regras"><Ic n="sliders" s={15} />Editor de regras</Link></Cabecalho>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    <div className="prow"><section className="panel rise" style={{ flex: 2, alignSelf: 'flex-start' }}><h2>Perfil de teste</h2>
      <div className="row" style={{ gap: 12 }}><div className="field" style={{ flex: 1 }}><label style={{ fontSize: 13 }}>Pessoas na casa</label><input className="inp sm num" value={a.pessoas} onChange={e => setA({ ...a, pessoas: e.target.value.replace(/\D/g, '') })} /></div><div className="field" style={{ flex: 1 }}><label style={{ fontSize: 13 }}>Idade</label><input className="inp sm num" value={a.idade ?? ''} onChange={e => setA({ ...a, idade: e.target.value.replace(/\D/g, '') })} /></div></div>
      <div className="field"><label style={{ fontSize: 13 }}>Renda total da casa (R$)</label><input className="inp sm num" value={a.renda} onChange={e => setA({ ...a, renda: e.target.value.replace(/\D/g, '') })} /></div>
      <div className="field"><label style={{ fontSize: 13 }}>Pessoa com deficiência</label>{sel('pcd', [['nao', 'Não'], ['sim', 'Sim'], ['naosei', 'Não sabe']])}</div>
      <div className="field"><label style={{ fontSize: 13 }}>Recebe aposentadoria ou BPC</label>{sel('aposent', [['nao', 'Não'], ['sim', 'Sim']])}</div>
      <div className="field"><label style={{ fontSize: 13 }}>Está no Cadastro Único</label>{sel('cad', [['nao', 'Não'], ['sim', 'Sim'], ['naosei', 'Não sabe']])}</div>
      <div className="field"><label style={{ fontSize: 13 }}>Usa remédio de uso contínuo</label>{sel('remedio', [['sim', 'Sim'], ['nao', 'Não']])}</div>
      <div className="field"><label style={{ fontSize: 13 }}>Conta de luz</label>{sel('luz', [['sim', 'No nome da casa'], ['nao', 'No nome do dono'], ['semluz', 'Não tem']])}</div>
      <div className="field"><label style={{ fontSize: 13 }}>Situações na casa</label><div className="col" style={{ gap: 4 }}>{grupos.map(([v, t]) => <label key={v} className="row xs" style={{ gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={(a.grupos || []).includes(v)} onChange={e => setA({ ...a, grupos: e.target.checked ? [...a.grupos, v] : a.grupos.filter(x => x !== v) })} />{t}</label>)}</div></div>
      <span className="xs muted num">Renda por pessoa: {brl((+a.renda || 0) / Math.max(1, +a.pessoas || 1), 1)}</span></section>
      <section className="panel rise" style={{ flex: 3 }}><h2>Resultado</h2>{!r ? <Carregando /> : <>
        <span className="xs muted">{r.rascunho.filter((b, i) => b.status !== 'nao' || r.publicado[i].status !== 'nao').length} de {r.rascunho.length} benefícios se aplicam a este perfil; os demais ficam ocultos.</span>
        {r.rascunho.map((b, i) => { const p = r.publicado[i], mudou = p.status !== b.status; if (b.status === 'nao' && !mudou) return null;
          return <div key={b.id} style={{ border: `1px solid ${mudou ? '#e9c46a' : 'var(--border)'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="row between"><b>{b.nome}</b><span className="row" style={{ gap: 6 }}>{mudou && <><Pill t={ST[p.status][0]} k={ST[p.status][1]} /><span className="xs muted">→</span></>}<Pill t={ST[b.status][0]} k={ST[b.status][1]} /></span></div>
            <span className="xs muted">{b.conds.map(c => (c.ok ? '✓ ' : '✗ ') + c.t).join(' · ')}</span></div>; })}</>}</section>
      <section className="panel rise" style={{ flex: 3, alignSelf: 'flex-start' }}><div className="row between"><h2>Casos de teste</h2>{r && <Pill t={ok + ' de ' + r.casos.length + ' passaram'} k={ok === r.casos.length ? 'pos' : 'neg'} />}</div>
        {r && <table className="t"><thead><tr><th>Caso</th><th className="r">Resultado</th></tr></thead><tbody>{r.casos.map(c => <tr key={c.nome} className="click" onClick={() => setA({ ...PADRAO_SIM, ...c.respostas, grupos: c.respostas.grupos || [] })}>
          <td style={{ whiteSpace: 'normal' }}>{c.nome}<div className="xs muted">{Object.entries(c.esperado).map(([id, st]) => (BEN_NOME[id] || id) + ': ' + ST[st][0].toLowerCase()).join(' · ')}</div></td><td className="r"><Pill t={c.passou ? 'passou' : 'falhou'} k={c.passou ? 'pos' : 'neg'} /></td></tr>)}</tbody></table>}
        <span className="xs muted">Clique em um caso para carregar o perfil.</span></section></div>
  </PainelShell>;
}

export function Documentos() {
  const [docs, erro, rec] = useCarregar(() => gestaoApi.documentos());
  const [sel, setSel] = useState('cras');
  const [ed, setEd] = useState(null);
  const [novo, setNovo] = useState('');
  const [msg, setMsg] = useState(null);
  const d = docs?.find(x => x.id === sel);
  useEffect(() => { if (d) setEd({ titulo: d.titulo, onde: d.onde || '', documentos: [...d.documentos] }); }, [d]);
  const salvar = async () => { setMsg(null); try { await gestaoApi.salvarDocumentos(sel, ed); rec(); setMsg(['ok', 'Salvo. O Kit do Direito já usa a nova lista.']); } catch (e) { setMsg(['erro', e.message]); } };
  const mover = (i, dlt) => { const l = [...ed.documentos]; const j = i + dlt; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; setEd({ ...ed, documentos: l }); };
  const NOMES = { cras: 'Cadastro Único no CRAS', inss: 'Pedido do BPC no INSS', luz: 'Tarifa Social na conta de luz', mae: 'Mãe Paulistana', casa: 'Minha Casa, Minha Vida' };
  return <PainelShell migalhas={['Gestão', 'Documentos e passos']}>
    <Cabecalho titulo="Documentos e passos" sub="O que o Kit do Direito pede em cada passo. Documentos extras (laudo, troca de titular) entram sozinhos conforme a triagem." />
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!docs || !ed ? <Carregando /> : <div className="prow"><section className="panel rise" style={{ flex: 2, alignSelf: 'flex-start' }}><h2>Passos</h2>{docs.map(x => <button key={x.id} className="opt" aria-pressed={x.id === sel} onClick={() => setSel(x.id)} style={{ padding: '10px 12px' }}><span className="col" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 14 }}>{NOMES[x.id] || x.titulo}</b><span className="xs muted">{x.documentos.length} documentos{x.atualizadoPor ? ' · editado por ' + x.atualizadoPor : ''}</span></span></button>)}</section>
      <section className="panel rise" style={{ flex: 3 }}><h2>{NOMES[sel]}</h2>
        <div className="field"><label style={{ fontSize: 13 }}>Onde ir</label><input className="inp sm" value={ed.onde} disabled={!ehGestor()} onChange={e => setEd({ ...ed, onde: e.target.value })} placeholder="Ex.: CRAS mais perto" /></div>
        <b className="small">Documentos (na ordem em que aparecem)</b>
        {ed.documentos.map((doc, i) => <div key={i} className="row" style={{ gap: 6 }}><input className="inp sm" style={{ flex: 1 }} value={doc} disabled={!ehGestor()} onChange={e => { const l = [...ed.documentos]; l[i] = e.target.value; setEd({ ...ed, documentos: l }); }} />
          {ehGestor() && <><button className="btn sm" aria-label="Subir" onClick={() => mover(i, -1)}>↑</button><button className="btn sm" aria-label="Descer" onClick={() => mover(i, 1)}>↓</button><button className="btn sm" aria-label="Remover" onClick={() => setEd({ ...ed, documentos: ed.documentos.filter((_, j) => j !== i) })}><Ic n="trash" s={14} /></button></>}</div>)}
        {ehGestor() && <div className="row" style={{ gap: 6 }}><input className="inp sm" style={{ flex: 1 }} value={novo} onChange={e => setNovo(e.target.value)} placeholder="Novo documento" /><button className="btn sm" disabled={!novo.trim()} onClick={() => { setEd({ ...ed, documentos: [...ed.documentos, novo.trim()] }); setNovo(''); }}><Ic n="plus" s={14} />Adicionar</button></div>}
        <div className="card" style={{ background: 'var(--raised)' }}><b className="small">Prévia no app</b>{ed.documentos.map((x, i) => <span key={i} className="small">☐ {x}</span>)}</div>
        {ehGestor() ? <button className="btn pri" style={{ width: 'fit-content' }} onClick={salvar}>Salvar</button> : <div className="notice"><Ic n="lock" s={16} />Só o perfil “Gestor de regras” edita.</div>}
        {msg && <Aviso tipo={msg[0] === 'erro' ? 'erro' : undefined}>{msg[1]}</Aviso>}</section></div>}
  </PainelShell>;
}

export function Historico() {
  const [h, erro] = useCarregar(() => gestaoApi.historico());
  const parse = s => { try { return JSON.parse(s) || []; } catch { return []; } };
  return <PainelShell migalhas={['Gestão', 'Histórico']}>
    <Cabecalho titulo="Histórico e auditoria" sub="Toda mudança de regra fica registrada, com quem fez, quem revisou e por quê">{h && <button className="btn" onClick={() => navigator.clipboard?.writeText(h.map(x => [x.titulo, x.dataHora, x.autor, x.revisor, x.motivo].join(';')).join('\n'))}><Ic n="copy" s={15} />Copiar auditoria</button>}</Cabecalho>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!h ? <Carregando /> : <div className="col" style={{ gap: 12 }}>{h.map((x, i) => <section key={x.id} className="panel rise" style={{ animationDelay: `${i * 0.05}s` }}><div className="row between wrap"><b>{x.titulo}</b><span className="xs muted num">{dmyy(x.dataHora)} · por {x.autor} · revisado por {x.revisor}</span></div>
      {parse(x.mudancas).length > 0 && <div className="diff">{parse(x.mudancas).map(([c, a, b], j) => <div key={j}><div className="dm">−  {c}: {String(a)}</div><div className="dp">+  {c}: {String(b)}</div></div>)}</div>}
      <span className="small muted">Motivo: <span style={{ color: 'var(--ink)' }}>{x.motivo}</span></span></section>)}</div>}
    <div className="notice"><Ic n="clock" s={16} c="#17704A" />Cada triagem guarda a versão da regra usada. Dá para responder “por que o app disse isso?” a qualquer momento.</div>
  </PainelShell>;
}

export function Pontos() {
  const [lista, erro, rec] = useCarregar(() => gestaoApi.pontos());
  const [t, setT] = useState('');
  const [ed, setEd] = useState(null);
  const [msg, setMsg] = useState(null);
  const vis = (lista || []).filter(p => !t || p.tipo === t);
  const salvar = async e => { e.preventDefault(); setMsg(null); try { await gestaoApi.salvarPonto(ed.id || ('p' + Date.now().toString(36)), { ...ed, lat: +ed.lat, lng: +ed.lng }); setEd(null); rec(); } catch (x) { setMsg(x.message); } };
  return <PainelShell migalhas={['Gestão', 'Pontos de atendimento']}>
    <Cabecalho titulo="Pontos de atendimento" sub="Onde o app manda a pessoa ir">{ehGestor() && <button className="btn" onClick={() => setEd({ tipo: 'CRAS', nome: '', endereco: '', horario: '', lat: -23.7, lng: -46.75, ativo: true })}><Ic n="plus" s={15} />Novo ponto</button>}</Cabecalho>
    <div className="ptabs">{[['', 'Todos'], ['CRAS', 'CRAS'], ['UBS', 'UBS'], ['Farmácia', 'Farmácias'], ['Defensoria', 'Defensoria']].map(([k, n]) => <button key={k} aria-pressed={t === k} onClick={() => setT(k)}>{n}<span className="num muted" style={{ marginLeft: 6, fontWeight: 400 }}>{(lista || []).filter(p => !k || p.tipo === k).length}</span></button>)}</div>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {ed && <form className="panel rise" onSubmit={salvar}><h2>{ed.id ? 'Editar ponto' : 'Novo ponto'}</h2><div className="row wrap" style={{ gap: 12 }}>
      <div className="field"><label style={{ fontSize: 13 }}>Tipo</label><select className="p-sel" value={ed.tipo} onChange={e => setEd({ ...ed, tipo: e.target.value })}>{['CRAS', 'UBS', 'Farmácia', 'Defensoria'].map(x => <option key={x}>{x}</option>)}</select></div>
      {[['nome', 'Nome', 260], ['endereco', 'Endereço', 300], ['horario', 'Horário', 200], ['obs', 'Observação', 160], ['lat', 'Latitude', 110], ['lng', 'Longitude', 110]].map(([k, l, w]) => <div key={k} className="field"><label style={{ fontSize: 13 }}>{l}</label><input className="inp sm" style={{ width: w }} value={ed[k] ?? ''} onChange={e => setEd({ ...ed, [k]: e.target.value })} required={['nome', 'lat', 'lng'].includes(k)} /></div>)}</div>
      <div className="row" style={{ gap: 8 }}><button className="btn pri" type="submit">Salvar</button><button className="btn" type="button" onClick={() => setEd(null)}>Cancelar</button>{ed.id && <button className="btn danger" type="button" onClick={async () => { await gestaoApi.removerPonto(ed.id); setEd(null); rec(); }}>Remover</button>}</div>
      {msg && <Aviso tipo="erro">{msg}</Aviso>}</form>}
    {!lista ? <Carregando /> : <div className="prow"><div style={{ flex: 3, overflowX: 'auto' }}><table className="t"><thead><tr><th>Nome</th><th>Tipo</th><th>Endereço</th><th>Horário</th></tr></thead><tbody>
      {vis.map(p => <tr key={p.id} className={ehGestor() ? 'click' : ''} onClick={() => ehGestor() && setEd({ ...p })}><td><b style={{ fontWeight: 500 }}>{p.nome}</b></td><td><Pill t={p.tipo} k={p.tipo === 'CRAS' ? 'brand' : p.tipo === 'UBS' ? 'info' : p.tipo === 'Farmácia' ? 'warn' : ''} /></td><td className="muted">{p.endereco}</td><td>{p.horario}</td></tr>)}</tbody></table></div>
      <section className="panel" style={{ flex: 2, padding: 12 }}><Mapa centro={[-23.71, -46.75]} zoom={12} pontos={vis} altura={360} /></section></div>}
  </PainelShell>;
}
