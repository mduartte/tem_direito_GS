// B2 · Visão geral, B3 · Mapa de demanda, B4 · Encaminhamentos, B5 · Detalhe, B6 · Relatórios e Automações.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Mapa from '../../componentes/Mapa.jsx';
import PainelShell, { Barras, Cabecalho, Filtros, SIT, barrasBen, useFiltro } from '../../componentes/PainelShell.jsx';
import { Aviso, Carregando, Ic, Interruptor, Pill, baixar } from '../../componentes/ui.jsx';
import { sessaoPainel } from '../../api/cliente.js';
import { atendimentoApi, painelApi } from '../../api/servicos.js';
import { BEN_NOME, addDias, brl, dmy, dmyy, fmtMi, fmtN, pct, quando } from '../../estado/formato.js';

/** Carrega dados da API e recarrega quando as dependências mudam. */
function useDados(fn, deps) {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState(null);
  const [n, setN] = useState(0);
  useEffect(() => { let vivo = true; setErro(null); fn().then(x => vivo && setD(x)).catch(e => vivo && setErro(e.message)); return () => { vivo = false; }; }, [...deps, n]); // eslint-disable-line react-hooks/exhaustive-deps
  return [d, erro, () => setN(x => x + 1), setD];
}

export function VisaoGeral() {
  const { f } = useFiltro();
  const nav = useNavigate();
  const [d, erro] = useDados(() => painelApi.visao(f), [f.bairro, f.ben, f.per]);
  return <PainelShell migalhas={['Busca ativa', 'Visão geral']}>
    <Cabecalho titulo="Visão geral" sub={`${f.per === '30' ? 'Últimos 30 dias' : 'Últimas 8 semanas'} · dados agregados e anônimos`}><Filtros /><Link className="btn" to="/painel/relatorios"><Ic n="download" s={15} />Exportar</Link></Cabecalho>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!d ? <Carregando /> : (() => {
      const m = d.atual, ant = d.anterior, dv = ant.tri ? Math.round((m.tri - ant.tri) / ant.tri * 100) : null;
      const kp = [['Triagens concluídas', fmtN(m.tri), dv === null ? '' : (dv >= 0 ? '+' : '') + dv + '% vs. período anterior', dv >= 0 ? 'pos' : 'neg'], ['Encaminhamentos', fmtN(m.enc), pct(m.enc, m.tri) + '% das triagens', ''], ['Conseguiram o benefício', fmtN(m.cons), pct(m.cons, m.enc) + '% dos encaminhados', 'pos'], ['Valor destravado por ano', fmtMi(m.valor), 'estimativa: benefícios × 12 meses', '']];
      const etapas = [['Triagens concluídas', m.tri], ['Receberam o kit', m.kit], ['Encaminhados ao CRAS', m.enc], ['Atendidos', m.atd], ['Conseguiram o benefício', m.cons]];
      const sem = d.semanas.map(s => s.triagens), mx = Math.max(400, ...sem);
      const faltas = Object.entries(m.falta).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, v]) => [t, v, pct(v, m.trav) + '% · ' + v]);
      const varSem = pct(sem[7] - sem[6], sem[6]);
      return <>
        <div className="kpis rise">{kp.map(([l, v, n, k], i) => <div key={l}><span className="small muted">{l}</span><span className="v num pop" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>{v}</span><span className="xs num" style={{ color: k === 'pos' ? 'var(--pos)' : k === 'neg' ? 'var(--neg)' : 'var(--mute)' }}>{n}</span></div>)}</div>
        <section className="panel rise"><div className="row between wrap"><h2>Caminho do direito</h2><span className="xs muted">Onde as famílias param, da primeira pergunta ao benefício na mão</span></div>
          <div className="row" style={{ gap: 0, margin: '0 -16px', alignItems: 'stretch' }}>{etapas.map(([t, v], i) => <div key={t} style={{ flex: 1, minWidth: 0, padding: '0 16px', borderLeft: i ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i + 1} · {t}</span><span className="num" style={{ fontSize: 22, fontWeight: 600, color: i === 4 ? 'var(--g)' : 'var(--ink)' }}>{fmtN(v)}</span>
            <div className="bar" style={{ background: 'var(--raised)' }}><i className="fill" style={{ width: `${pct(v, m.tri)}%`, opacity: 0.45 + 0.55 * i / 4, animationDelay: `${0.3 + i * 0.15}s` }} /></div><span className="xs muted num">{pct(v, m.tri)}% das triagens</span></div>)}</div></section>
        <div className="prow"><section className="panel rise" style={{ flex: 3, alignSelf: 'flex-start' }}><div className="row between"><h2>Triagens por semana</h2><Pill t={(varSem >= 0 ? '+' : '') + varSem + '% na última semana'} k={varSem >= 0 ? 'pos' : 'neg'} /></div>
          <div className="wbars">{[100, 200, 300].map(g => <div key={g} className="gl" style={{ bottom: 22 + g / mx * 190 }} />)}{sem.map((v, i) => <div key={i}><span className="xs num" style={{ color: i >= 4 ? 'var(--ink)' : 'var(--mute)' }}>{v}</span><span className={'b grow ' + (i >= 4 ? 'cur' : '')} style={{ height: v / mx * 190, animationDelay: `${0.2 + i * 0.06}s` }} /><span className="xs muted">S{i + 1}</span></div>)}</div>
          <div className="row xs muted" style={{ gap: 16 }}><span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--g)' }} />Últimas 4 semanas · {fmtN(sem.slice(4).reduce((a, b) => a + b, 0))}</span><span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: '#cfd8d3' }} />4 semanas antes · {fmtN(sem.slice(0, 4).reduce((a, b) => a + b, 0))}</span></div></section>
          <section className="panel rise" style={{ flex: 2 }}><div className="row between"><h2>Documentos que mais faltam</h2><button className="btn" onClick={() => nav('/painel/encaminhamentos?sit=travado')}>Ver travados</button></div>
            {faltas.length ? <Barras itens={faltas} /> : <span className="small muted">Nenhum encaminhamento travado com esses filtros.</span>}
            <h2 style={{ marginTop: 8 }}>Benefícios mais encontrados</h2><Barras itens={barrasBen(m.ben, m.tri)} /></section></div>
      </>;
    })()}
  </PainelShell>;
}

export function MapaDemanda() {
  const { f } = useFiltro();
  const nav = useNavigate();
  const [dados, erro] = useDados(() => painelApi.mapa(f), [f.bairro, f.ben, f.per]);
  const [pontos] = useDados(() => atendimentoApi.pontos(), []);
  const [sel, setSel] = useState('Jardim Ângela');
  const [cam, setCam] = useState({ CRAS: true, UBS: true, Farmácia: true, Defensoria: false });
  return <PainelShell migalhas={['Busca ativa', 'Mapa de demanda']}>
    <Cabecalho titulo="Mapa de demanda" sub="Clique em um bairro para ver onde estão as pessoas com direito que ainda não chegaram ao CRAS"><Filtros /></Cabecalho>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!dados ? <Carregando /> : (() => {
      const mx = Math.max(1, ...dados.map(b => b.tri)), mb = dados.find(b => b.nome === sel) || dados[0], maior = [...dados].sort((a, b) => b.tri - a.tri)[0];
      const fal = Object.entries(mb.falta).sort((a, b) => b[1] - a[1])[0];
      return <div className="prow"><section className="panel rise" style={{ flex: 5, padding: 12 }}>
        <Mapa centro={[-23.725, -46.745]} zoom={12} altura={380} rotulo="Triagens por bairro" pontos={(pontos || []).filter(p => cam[p.tipo])} onCirculo={setSel}
          circulos={dados.map(b => ({ id: b.nome, pos: [b.lat, b.lng], raio: 12 + 28 * b.tri / mx, opacidade: 0.25 + 0.6 * b.tri / mx, selecionado: b.nome === sel, rotulo: `${b.nome}: ${fmtN(b.tri)} triagens`, permanente: true }))} />
        <div className="row between wrap xs muted"><span className="row" style={{ gap: 8 }}><span className="num">menos</span><span style={{ width: 120, height: 8, borderRadius: 4, background: 'linear-gradient(90deg,rgba(23,112,74,.12),rgba(23,112,74,.9))' }} /><span className="num">mais triagens</span></span><span>● CRAS <span style={{ color: '#1d3f73' }}>● UBS</span> <span style={{ color: '#92400e' }}>● Farmácia</span> <span style={{ color: '#5b2a86' }}>● Defensoria</span></span></div>
        <div style={{ overflowX: 'auto' }}><table className="t"><thead><tr><th>Bairro</th><th className="r">Triagens</th><th className="r">Encaminhados</th><th className="r">Travados</th><th className="r">Conseguiram</th><th className="r">Famílias no CadÚnico</th></tr></thead><tbody>
          {dados.map(b => <tr key={b.nome} className="click" onClick={() => setSel(b.nome)}><td>{b.nome === sel ? <b>{b.nome}</b> : b.nome}</td><td className="r num">{b.tri}</td><td className="r num">{b.enc}</td><td className="r num">{b.trav}</td><td className="r num">{b.cons}</td><td className="r num muted">{fmtN(b.familiasCad)}</td></tr>)}</tbody></table></div></section>
        <div className="col" style={{ flex: 2, gap: 24 }}><section className="panel rise"><h2>Camadas</h2>{[['CRAS', 'CRAS', '#131416'], ['UBS', 'UBS', '#1d3f73'], ['Farmácia', 'Farmácias credenciadas', '#92400e'], ['Defensoria', 'Defensoria', '#5b2a86']].map(([k, t, cor]) =>
          <div key={k} className="row between" style={{ height: 32 }}><span className="row" style={{ gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: cor }} />{t}</span><Interruptor ligado={cam[k]} rotulo={t} onChange={v => setCam({ ...cam, [k]: v })} /></div>)}</section>
          <section className="panel rise"><div className="row between"><h2>{mb.nome}</h2>{mb.nome === maior.nome && <Pill t="Maior demanda" k="brand" />}</div><div><span className="num pop" style={{ fontSize: 28, fontWeight: 600 }}>{mb.tri}</span> <span className="small muted">triagens</span></div>
            <Barras itens={barrasBen(mb.ben, mb.tri, 3)} /><span className="small muted">Documento que mais falta: <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{fal ? fal[0].toLowerCase() : '—'}</b></span>
            <button className="btn pri" disabled={!mb.trav} onClick={() => nav(`/painel/encaminhamentos?sit=travado&bairro=${encodeURIComponent(mb.nome)}`)}>Ver {mb.trav} encaminhamentos travados</button></section></div></div>;
    })()}
  </PainelShell>;
}

export function Encaminhamentos() {
  const { f, mudar } = useFiltro();
  const nav = useNavigate();
  const url = new URLSearchParams(window.location.search);
  const [sit, setSit] = useState(url.get('sit') || 'todos');
  const [q, setQ] = useState('');
  const [pag, setPag] = useState(0);
  useEffect(() => { const b = url.get('bairro'); if (b) mudar('bairro', b); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [lista, erro] = useDados(() => painelApi.encaminhamentos({ ...f, etapa: 'encaminhadas' }), [f.bairro, f.ben, f.per]);
  const base = lista || [];
  const filtrada = useMemo(() => base.filter(r => (sit === 'todos' || r.etapa === sit) && (!q || r.codigo.toLowerCase().includes(q.toLowerCase()) || r.bairro.toLowerCase().includes(q.toLowerCase()))), [base, sit, q]);
  const por = 12, p = Math.min(pag, Math.max(0, Math.ceil(filtrada.length / por) - 1)), linhas = filtrada.slice(p * por, p * por + por);
  const csv = () => baixar('encaminhamentos.csv', '﻿codigo;data;bairro;beneficios;situacao;etapa;falta\n' + filtrada.map(r => [r.codigo, dmyy(r.criadaEm), r.bairro, r.beneficios.map(b => BEN_NOME[b] || b).join('|'), SIT[r.etapa][0], r.etapaTexto || '', r.falta || ''].join(';')).join('\n'), 'text/csv');
  return <PainelShell migalhas={['Busca ativa', 'Encaminhamentos']}>
    <Cabecalho titulo="Encaminhamentos" sub="Cada linha é uma triagem anônima, identificada só por código"><Filtros /><button className="btn" onClick={csv}><Ic n="download" s={15} />Exportar CSV</button></Cabecalho>
    <div className="ptabs" role="tablist">{[['todos', 'Todos'], ['agendado', 'Agendado'], ['atendido', 'Atendido'], ['conseguiu', 'Conseguiu'], ['travado', 'Travado']].map(([k, t]) => <button key={k} aria-pressed={sit === k} onClick={() => { setSit(k); setPag(0); }}>{t}<span className="num muted" style={{ marginLeft: 6, fontWeight: 400 }}>{k === 'todos' ? base.length : base.filter(r => r.etapa === k).length}</span></button>)}</div>
    <div className="row wrap" style={{ gap: 8 }}><label className="p-search" style={{ width: 240 }}><Ic n="search" s={14} c="#5d5f60" /><input value={q} onChange={e => { setQ(e.target.value); setPag(0); }} placeholder="Buscar código ou bairro" aria-label="Buscar código ou bairro" /></label></div>
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    {!lista ? <Carregando /> : <><div style={{ overflowX: 'auto' }}><table className="t"><thead><tr><th>Triagem</th><th>Bairro</th><th>Benefícios</th><th>Etapa</th><th>Situação</th><th className="r">Criada</th></tr></thead><tbody>
      {linhas.map((r, i) => <tr key={r.codigo} className="click rise" style={{ animationDelay: `${i * 0.02}s` }} tabIndex={0} onClick={() => nav('/painel/encaminhamentos/' + r.codigo)} onKeyDown={e => e.key === 'Enter' && nav('/painel/encaminhamentos/' + r.codigo)}>
        <td><span className="mono">#{r.codigo}</span>{!r.demo && <> <Pill t="Real" k="brand" /></>}</td><td>{r.bairro}{r.uf && !(r.uf === 'SP' && r.cidade === 'São Paulo') ? <span className="xs muted"> · {r.cidade}-{r.uf}</span> : null}</td><td className="muted">{r.beneficios.map(b => BEN_NOME[b] || b).slice(0, 2).join(', ')}{r.beneficios.length > 2 ? ' +' + (r.beneficios.length - 2) : ''}</td><td className="muted">{r.etapaTexto}</td><td><Pill t={SIT[r.etapa][0]} k={SIT[r.etapa][1]} /></td><td className="r muted num">{quando(r.criadaEm)}</td></tr>)}
      {!linhas.length && <tr><td colSpan={6} className="muted">Nenhum encaminhamento com esses filtros.</td></tr>}</tbody></table></div>
      <div className="row between small muted"><span className="num">Mostrando {filtrada.length ? p * por + 1 : 0}–{Math.min(filtrada.length, p * por + por)} de {fmtN(filtrada.length)}</span><div className="row" style={{ gap: 8 }}><button className="btn" disabled={p === 0} onClick={() => setPag(p - 1)}>Anterior</button><button className="btn" disabled={p * por + por >= filtrada.length} onClick={() => setPag(p + 1)}>Próxima</button></div></div></>}
  </PainelShell>;
}

const FALTAS = ['Comprovante de endereço', 'Certidão de nascimento', 'Laudo médico', 'CPF de dependente', 'Carteira de trabalho', 'Documento com foto'];

export function DetalheTriagem() {
  const { codigo } = useParams();
  const [r, erro, , setR] = useDados(() => painelApi.detalhe(codigo), [codigo]);
  const [obs, setObs] = useState('');
  const [msg, setMsg] = useState(null);
  useEffect(() => { if (r) setObs(r.obs || ''); }, [r]);
  const salvar = async corpo => { setMsg(null); try { setR(await painelApi.atualizar(codigo, corpo)); setMsg(['ok', 'Salvo.']); } catch (e) { setMsg(['erro', e.message]); } };
  const avisar = async () => { setMsg(null); try { setR(await painelApi.avisar(codigo)); setMsg(['ok', 'Aviso enviado para a família.']); } catch (e) { setMsg(['erro', e.message]); } };
  if (erro) return <PainelShell migalhas={['Busca ativa', 'Encaminhamentos', '#' + codigo]}><Aviso tipo="erro">{erro}</Aviso><Link to="/painel/encaminhamentos">Voltar</Link></PainelShell>;
  if (!r) return <PainelShell migalhas={['Busca ativa', 'Encaminhamentos', '#' + codigo]}><Carregando /></PainelShell>;
  const ult = r.eventos.length ? r.eventos[r.eventos.length - 1].dataHora : r.criadaEm;
  const prox = r.etapa === 'conseguiu' ? null : addDias(new Date(ult), 7);
  return <PainelShell migalhas={['Busca ativa', 'Encaminhamentos', '#' + r.codigo]}>
    <Cabecalho titulo={<><span className="mono" style={{ fontWeight: 500 }}>#{r.codigo}</span> · {r.bairro}{r.cidade ? ` · ${r.cidade}-${r.uf}` : ''}</>} sub={`${r.beneficios.map(b => BEN_NOME[b] || b).join(', ')} · etapa: ${r.etapaTexto}`}><Pill t={SIT[r.etapa][0]} k={SIT[r.etapa][1]} />{r.demo ? <Pill t="Dado de demonstração" /> : <Pill t="Triagem real" k="brand" />}</Cabecalho>
    <div className="prow"><div className="col" style={{ flex: 3, gap: 24 }}><section className="panel rise"><h2>Resumo da triagem</h2>
      <div className="row wrap" style={{ gap: 32 }}>{[['Pessoas na casa', r.pessoas], ['Renda por pessoa', brl(r.rendaPc)], ['Canal', r.canal || 'App'], ['Data', dmyy(r.criadaEm)]].map(([a, b]) => <div key={a} className="col" style={{ gap: 4 }}><span className="xs muted">{a}</span><span className="num" style={{ fontSize: 15, fontWeight: 500 }}>{b}</span></div>)}</div>
      <div className="row wrap" style={{ gap: 8 }}><span className="small muted">Benefícios prováveis</span>{r.beneficios.map(b => <Pill key={b} t={BEN_NOME[b] || b} k="brand" />)}</div>
      <div className="notice"><Ic n="shield" s={16} c="#17704A" />Sem nome, CPF ou telefone. O CRAS só fala com a família por aviso no app, se ela autorizar.</div></section>
      <section className="panel rise"><div className="row between"><h2>Linha do tempo</h2><span className="xs muted">{r.regrasUsadas}</span></div><div className="tl">
        {r.eventos.map(x => <div key={x.id} className="st"><span className={'d ' + (x.alerta ? 'warn' : '')} /><div className="col" style={{ gap: 2 }}><span style={{ fontWeight: 500 }}>{x.texto}</span><span className="xs muted num">{dmy(x.dataHora)}</span></div></div>)}
        {prox && <div className="st"><span className="d next" /><div className="col" style={{ gap: 2 }}><span style={{ fontWeight: 500 }}>Próximo retorno automático</span><span className="xs muted num">{dmy(prox)}</span></div></div>}</div></section></div>
      <section className="panel rise" style={{ flex: 2, alignSelf: 'flex-start' }}><h2>Ações</h2>
        <div className="field"><label htmlFor="sitSel" style={{ fontSize: 13 }}>Situação</label><select id="sitSel" className="p-sel" value={r.etapa} onChange={e => salvar({ etapa: e.target.value, falta: e.target.value === 'travado' ? (r.falta || FALTAS[0]) : null })}>{['kit', 'agendado', 'atendido', 'conseguiu', 'travado'].map(e => <option key={e} value={e}>{SIT[e][0]}</option>)}</select></div>
        {r.etapa === 'travado' && <div className="field"><label htmlFor="faltaSel" style={{ fontSize: 13 }}>O que falta</label><select id="faltaSel" className="p-sel" value={r.falta || ''} onChange={e => salvar({ falta: e.target.value })}>{FALTAS.map(t => <option key={t}>{t}</option>)}</select></div>}
        <div className="field"><label htmlFor="obs" style={{ fontSize: 13 }}>Observação interna</label><textarea id="obs" className="inp" rows={3} placeholder="Visível só para a equipe" value={obs} onChange={e => setObs(e.target.value)} /></div>
        <button className="btn" onClick={() => salvar({ obs })}>Salvar observação</button>
        <div style={{ height: 1, background: 'var(--rule)' }} />
        <b>Pedir retorno à família</b><span className="small muted" style={{ lineHeight: 1.5 }}>Aviso no app: “O CRAS pediu para você voltar{r.falta ? ' com ' + r.falta.toLowerCase() : ''}. Leve os documentos do seu Kit do Direito.”</span>
        {r.autorizou ? <><span className="row small" style={{ color: 'var(--pos)' }}><Ic n="check" s={15} c="#1e7b4f" w={2.4} />Família autorizou contato</span><button className="btn brand" onClick={avisar}><Ic n="bell" s={15} c="#fff" />Enviar aviso</button></>
          : <><span className="row small muted"><Ic n="lock" s={15} />A família não autorizou contato</span><button className="btn" disabled>Enviar aviso</button></>}
        {r.notificacoes?.length > 0 && <span className="xs muted">Último aviso: {quando(r.notificacoes[0].criadaEm)} · {r.notificacoes[0].tipo.replace('_', ' ').toLowerCase()}</span>}
        {msg && <Aviso tipo={msg[0] === 'erro' ? 'erro' : undefined}>{msg[1]}</Aviso>}</section></div>
  </PainelShell>;
}

export function Relatorios() {
  const [per, setPer] = useState('30');
  const [bairro, setBairro] = useState('');
  const [d, erro] = useDados(() => painelApi.visao({ per, bairro }), [per, bairro]);
  const baixarCsv = async () => { const r = await painelApi.csv({ per, bairro }); baixar(`tem-direito-${new Date().toISOString().slice(0, 10)}.csv`, await r.text(), 'text/csv'); };
  return <PainelShell migalhas={['Busca ativa', 'Relatórios']}>
    <Cabecalho titulo="Relatórios" sub="Para prestação de contas e planejamento da busca ativa" />
    <div className="prow"><section className="panel rise" style={{ flex: 2 }}><h2>Novo relatório</h2>
      <div className="row wrap" style={{ gap: 8 }}><select className="p-sel" value={per} onChange={e => setPer(e.target.value)}><option value="30">Últimos 30 dias</option><option value="60">Últimas 8 semanas</option></select>
        <select className="p-sel" value={bairro} onChange={e => setBairro(e.target.value)}><option value="">Todos os bairros</option>{['Jardim Ângela', 'Capão Redondo', 'Grajaú', 'Parelheiros', 'Jardim São Luís', 'Campo Limpo'].map(b => <option key={b}>{b}</option>)}</select></div>
      <div className="notice"><Ic n="file" s={16} />O CSV traz só números agregados por bairro: triagens, encaminhados, atendidos, conseguiram, travados e valor estimado. Nenhuma família aparece.</div>
      <button className="btn pri" style={{ width: 'fit-content' }} onClick={baixarCsv}><Ic n="download" s={15} c="#fff" />Baixar CSV</button></section>
      <section className="panel rise" style={{ flex: 3 }}><h2>Prévia</h2>{erro && <Aviso tipo="erro">{erro}</Aviso>}{!d ? <Carregando /> : <>
        <div className="kpis">{[['Triagens', d.atual.tri, ''], ['Encaminhados', d.atual.enc, pct(d.atual.enc, d.atual.tri) + '%'], ['Conseguiram', d.atual.cons, pct(d.atual.cons, d.atual.enc) + '%'], ['Travados', d.atual.trav, '']].map(([l, v, n]) => <div key={l}><span className="small muted">{l}</span><span className="v num">{fmtN(v)}</span><span className="xs muted">{n}</span></div>)}</div>
        <Barras itens={Object.entries(d.atual.bairro).sort((a, b) => b[1] - a[1]).map(([b, v]) => [b, v, fmtN(v)])} /></>}</section></div>
  </PainelShell>;
}

const TAREFAS = { lembretes: ['Lembrete da véspera', 'Todo dia às 19h: avisa quem marcou ida ao CRAS para amanhã.'], retornos: ['Retornos de 7 e 30 dias', 'Todo dia às 10h: pergunta à família se deu certo.'], expurgo: ['Expurgo da LGPD', 'Todo dia às 3h: apaga triagens além da retenção e guarda só números por bairro.'], resumo: ['Resumo semanal', 'Segunda, 8h: resumo da busca ativa para a coordenação.'] };

export function Automacoes() {
  const [d, erro, recarregar] = useDados(() => painelApi.automacoes(), []);
  const [rodando, setRodando] = useState(null);
  const executar = async t => { setRodando(t); try { await painelApi.executar(t); recarregar(); } finally { setRodando(null); } };
  const perfil = sessaoPainel.ler()?.perfil;
  return <PainelShell migalhas={['Busca ativa', 'Automações']}>
    <Cabecalho titulo="Automações" sub="Tarefas que rodam sozinhas no servidor. O botão roda agora, para demonstração." />
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
    <div className="prow"><div className="col" style={{ flex: 2, gap: 12 }}>{Object.entries(TAREFAS).map(([k, [t, s]]) => <section key={k} className="panel rise"><div className="row between"><b>{t}</b><button className="btn sm" disabled={!!rodando || !['COORDENACAO', 'GESTOR'].includes(perfil)} onClick={() => executar(k)}><Ic n="bolt" s={14} />{rodando === k ? 'Rodando…' : 'Executar agora'}</button></div><span className="small muted">{s}</span></section>)}</div>
      <section className="panel rise" style={{ flex: 3 }}><h2>Últimas execuções</h2>{!d ? <Carregando /> : <table className="t"><thead><tr><th>Tarefa</th><th>Quando</th><th className="r">Itens</th><th>Detalhe</th></tr></thead><tbody>
        {d.execucoes.map(e => <tr key={e.id}><td>{TAREFAS[e.tarefa]?.[0] || e.tarefa}{e.manual && <> <Pill t="manual" /></>}</td><td className="num muted">{dmy(e.inicio)} {new Date(e.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td><td className="r num">{e.itens}</td><td className="small" style={{ whiteSpace: 'normal' }}>{e.detalhe}</td></tr>)}
        {!d.execucoes.length && <tr><td colSpan={4} className="muted">Nenhuma execução ainda.</td></tr>}</tbody></table>}</section></div>
  </PainelShell>;
}
