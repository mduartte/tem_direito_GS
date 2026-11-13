// A17 · Meus direitos (acompanhamento e avisos), A18 · Pedido negado e D5–D8 · Minhas respostas.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CidadaoPagina, { Voltar } from '../../componentes/CidadaoPagina.jsx';
import { Ic, Passos, Pill } from '../../componentes/ui.jsx';
import { triagemApi } from '../../api/servicos.js';
import { useCidadao } from '../../estado/cidadao.jsx';
import { useTerritorio } from '../../estado/territorio.js';
import { addDias, ativos, brl, diaCurto, dmy, dmyy, hoje, quando } from '../../estado/formato.js';
import { perguntas } from '../../estado/perguntas.js';

const FALTAS = ['Comprovante de endereço', 'Certidão de nascimento', 'Laudo médico', 'CPF de dependente', 'Carteira de trabalho', 'Documento com foto'];

export function MeusDireitos() {
  const { c, res, atualizar, sincronizar } = useCidadao();
  const nav = useNavigate();
  const [srv, setSrv] = useState(null);
  const [pedeFalta, setPedeFalta] = useState(null);
  const at = ativos(res);

  // Busca avisos do servidor (lembrete da véspera, retornos, aviso do CRAS).
  useEffect(() => {
    if (!c.code || !c.chave) return;
    let vivo = true;
    const carregar = () => triagemApi.consultar(c.code, c.chave).then(r => vivo && setSrv(r)).catch(() => {});
    carregar();
    const t = setInterval(carregar, 30000);
    return () => { vivo = false; clearInterval(t); };
  }, [c.code, c.chave]);

  const marcar = async (id, v, falta) => {
    atualizar(x => ({ status: { ...x.status, [id]: v }, falta: falta || x.falta, negadoEm: v === 'negado' ? new Date().toISOString() : x.negadoEm }));
    const sit = { fui: null, faltou: 'faltou', pedido: 'pedido', consegui: 'consegui', negado: 'negado' }[v];
    if (v === 'fui') await sincronizar({ retorno: 'deu-certo' });
    else if (sit) { const r = await sincronizar({ beneficio: id, situacao: sit, falta }); if (r) setSrv(r); }
    setPedeFalta(null);
  };
  const responderRetorno = async (r, falta) => { const x = await sincronizar({ retorno: r, falta }); if (x) setSrv(x); };

  const avisos = (srv?.notificacoes || []).slice(0, 4);
  const retornoAberto = avisos.find(n => n.tipo?.startsWith('RETORNO') && !n.lidaEm);
  const dl = c.lembrete ? new Date(c.lembrete.data + 'T12:00:00') : null;

  const cards = at.map(b => {
    const s = c.status[b.id] || 'inicio';
    const precisaCad = b.conds.some(x => x.passo && x.t.includes('Cadastro') && !x.ok);
    const chips = (opcoes) => <div className="col" style={{ gap: 8 }}><span className="small muted">Como foi?</span><div className="chips">{opcoes.map(([v, t]) => <button key={v} className="chip" onClick={() => v === 'faltou' ? setPedeFalta(b.id) : marcar(b.id, v)}>{t}</button>)}</div>
      {pedeFalta === b.id && <div className="chips">{FALTAS.map(f => <button key={f} className="chip" onClick={() => marcar(b.id, 'faltou', f)}>{f}</button>)}</div>}</div>;
    let itens, acoes;
    if (b.id === 'cad') {
      const feito = s === 'fui';
      itens = [['Ir ao CRAS fazer o cadastro', feito ? 'feito' : s === 'faltou' ? 'faltou documento: ' + (c.falta || '') : dl ? 'marcado para ' + dmy(dl) : 'próximo passo', feito ? 'ok' : s === 'faltou' ? 'bad' : 'now'], ['Receber o número NIS', feito ? 'na hora do cadastro' : 'depois do cadastro', feito ? 'ok' : 'next']];
      acoes = feito ? <span className="row small" style={{ color: 'var(--pos)', fontWeight: 600 }}><Ic n="check" s={16} c="#1e7b4f" w={2.6} />Cadastro feito</span> : chips([['fui', 'Fui e deu certo'], ['faltou', 'Faltou documento']]);
      return <div key={b.id} className="card rise"><div className="row between"><b style={{ fontSize: 16 }}>{b.nome}</b><Pill t={feito ? 'Feito' : s === 'faltou' ? 'Travado' : 'Próximo passo'} k={feito ? 'pos' : s === 'faltou' ? 'neg' : 'warn'} /></div><Passos itens={itens} />{acoes}</div>;
    }
    const feitoCad = ['fui', 'consegui', 'negado', 'pedido'].includes(s);
    if (b.id === 'farm') itens = [['Separar receita e documento', 'com CPF', s === 'consegui' ? 'ok' : 'now'], ['Retirar na farmácia credenciada', 'de graça', s === 'consegui' ? 'ok' : 'next']];
    else if (b.status === 'pode') itens = [['Separar documento com foto', b.orgao, s === 'consegui' ? 'ok' : 'now'], ['Usar o benefício', 'sem pedido nem espera', s === 'consegui' ? 'ok' : 'next']];
    else itens = [...(precisaCad ? [['Cadastro Único no CRAS', feitoCad ? 'feito' : s === 'faltou' ? 'faltou documento: ' + (c.falta || '') : dl ? 'marcado para ' + dmy(dl) : 'próximo passo', feitoCad ? 'ok' : s === 'faltou' ? 'bad' : 'now']] : []),
      [b.orgao.includes('INSS') ? 'Pedido no INSS' : b.orgao.includes('Distribuidora') ? 'Pedido na distribuidora' : 'Inclusão no programa', ['pedido', 'consegui', 'negado'].includes(s) ? 'feito' : 'depois do cadastro', ['pedido', 'consegui', 'negado'].includes(s) ? 'ok' : precisaCad ? 'next' : 'now'],
      ['Resposta', s === 'consegui' ? 'aprovado' : s === 'negado' ? 'negado' : 'em até 45 dias', s === 'consegui' ? 'ok' : s === 'negado' ? 'bad' : 'next']];
    if (s === 'consegui') acoes = <span className="row small" style={{ color: 'var(--pos)', fontWeight: 600 }}><Ic n="check" s={16} c="#1e7b4f" w={2.6} />Benefício conseguido</span>;
    else if (s === 'negado') acoes = <button className="btn sm" onClick={() => nav('/negado/' + b.id)}>O que fazer agora</button>;
    else {
      const op = [];
      if (precisaCad && !['fui', 'pedido'].includes(s)) op.push(['fui', 'Fui e deu certo'], ['faltou', 'Faltou documento']);
      if (!precisaCad || ['fui', 'pedido'].includes(s)) { if (s !== 'pedido' && b.status !== 'pode') op.push(['pedido', 'Fiz o pedido']); op.push(['consegui', b.status === 'pode' ? 'Já usei' : 'Consegui']); if (b.status !== 'pode') op.push(['negado', 'Foi negado']); }
      acoes = chips(op);
    }
    return <div key={b.id} className="card rise"><div className="row between"><b style={{ fontSize: 16 }}>{b.nome}</b><Pill t={s === 'consegui' ? 'Conseguiu' : s === 'negado' ? 'Negado' : s === 'faltou' ? 'Travado' : 'Em andamento'} k={s === 'consegui' ? 'pos' : s === 'negado' || s === 'faltou' ? 'neg' : 'warn'} /></div><Passos itens={itens} />{acoes}</div>;
  });

  return <CidadaoPagina>
    <h1 className="c-h1">Meus direitos</h1>
    {srv && <div className="row small muted">Situação no CRAS: <Pill t={srv.etapaTexto} k={srv.etapa === 'travado' ? 'neg' : srv.etapa === 'conseguiu' ? 'pos' : 'brand'} /></div>}
    {retornoAberto && <div className="card" style={{ borderColor: '#c9e7d6' }}><b>{retornoAberto.texto}</b><div className="chips">
      <button className="chip" onClick={() => { responderRetorno('deu-certo'); triagemApi.lida(c.code, c.chave, retornoAberto.id); }}>Fui e deu certo</button>
      <button className="chip" onClick={() => setPedeFalta('retorno')}>Faltou documento</button>
      <button className="chip" onClick={() => { responderRetorno('nao-fui'); triagemApi.lida(c.code, c.chave, retornoAberto.id); }}>Ainda não fui</button></div>
      {pedeFalta === 'retorno' && <div className="chips">{FALTAS.map(f => <button key={f} className="chip" onClick={() => { responderRetorno('faltou', f); triagemApi.lida(c.code, c.chave, retornoAberto.id); setPedeFalta(null); }}>{f}</button>)}</div>}</div>}
    {avisos.length > 0 && <div className="card" style={{ background: 'var(--raised)' }}><b className="small">Avisos</b>{avisos.map(a => <div key={a.id} className="row small" style={{ alignItems: 'flex-start' }}><Ic n="bell" s={16} c="#17704A" /><span>{a.texto} <span className="xs muted">· {quando(a.criadaEm)}</span></span></div>)}</div>}
    {c.lembrete ? <div className="card" style={{ borderColor: '#c9e7d6' }}><div className="row between"><b>Próximo passo</b><Pill t={diaCurto(dl)} k="brand" /></div><span className="small muted">Ir ao {c.lembrete.local}. Lembrete por {c.lembrete.canal === 'app' ? 'aviso no app' : c.lembrete.canal === 'sms' ? 'SMS' : 'aviso e SMS'}.</span><div className="row"><Link className="btn sm" to="/kit">Ver o que levar</Link><Link className="btn sm" to="/lembrete">Mudar data</Link></div></div>
      : <div className="card"><b>Sem data marcada</b><span className="small muted">Marque o dia de ir ao CRAS e avisamos na véspera.</span><Link className="btn sm" to="/lembrete">Marcar lembrete</Link></div>}
    {cards}
    <div className="row wrap"><Link className="btn sm" to="/perfil"><Ic n="users" s={16} />Minhas respostas</Link><Link className="btn sm" to="/privacidade"><Ic n="lock" s={16} />Privacidade</Link><Link className="btn sm" to="/apagar"><Ic n="trash" s={16} />Apagar meus dados</Link></div>
    {c.code && <p className="xs muted">Código anônimo desta triagem: <span className="mono">#{c.code}</span>. É só isso que o CRAS vê.</p>}
  </CidadaoPagina>;
}

export function Negado() {
  const { id } = useParams();
  const { c, res } = useCidadao();
  const { pontos } = useTerritorio();
  const nav = useNavigate();
  const b = res.find(x => x.id === id);
  const dn = c.negadoEm ? new Date(c.negadoEm) : hoje(), prazo = addDias(dn, 30), resta = Math.max(0, Math.round((prazo - hoje()) / 864e5));
  const def = pontos.find(p => p.tipo === 'Defensoria');
  return <CidadaoPagina rodape={<button className="btn pri block" onClick={() => nav('/onde-ir')}>Ver a Defensoria no mapa</button>}>
    <Voltar para="/meus-direitos" rotulo="Meus direitos" />
    <div className="card rise"><div className="row between"><b style={{ fontSize: 16 }}>{b ? b.nome : 'Pedido'}</b><Pill t="Negado" k="neg" /></div><span className="small muted" style={{ lineHeight: 1.5 }}>Resposta registrada em {dmyy(dn)}. Dá para recorrer em até <b style={{ color: 'var(--ink)' }}>30 dias</b>.</span>
      <div className="row between small"><span className="muted">Prazo para recorrer</span><b className="num">até {dmyy(prazo)} · faltam {resta} dias</b></div><div className="bar"><i className="fill" style={{ width: `${(30 - resta) / 30 * 100}%`, background: 'var(--neg)' }} /></div></div>
    <div className="card rise"><b>O que fazer agora</b><Passos itens={[['Leia o motivo na carta do INSS', 'ou no Meu INSS, em “Resultado”', 'now'], ['Procure a Defensoria Pública', 'atendimento gratuito', 'next'], ['Entre com o recurso', 'a Defensoria ajuda a escrever', 'next']]} /></div>
    {def && <div className="card rise"><div className="row"><Ic n="scale" s={22} c="#17704A" /><div className="col" style={{ gap: 2 }}><b>{def.nome}</b><span className="small muted">{def.endereco} · {def.horario}</span></div></div></div>}
  </CidadaoPagina>;
}

/** D5 a D8 · Respostas agrupadas em família, renda, moradia e saúde, com edição. */
export function Perfil() {
  const { c, atualizar, outra } = useCidadao();
  const nav = useNavigate();
  const QS = perguntas(outra), a = c.ans;
  const grupos = [['Família', ['pessoas', 'idade', 'grupos']], ['Renda', ['renda', 'aposent', 'cad']], ['Moradia', ['luz', 'cep']], ['Saúde', ['pcd', 'remedio']]];
  const valor = q => { let v = a[q.k];
    if (q.type === 'multi') return Array.isArray(v) && v.length ? q.opts.filter(o => v.includes(o[0])).map(o => o[1]).join('; ') : '—';
    if (q.opts) return (q.opts.find(o => o[0] === v) || ['', '—'])[1];
    if (q.k === 'renda') return v === null || v === '' ? '—' : brl(v) + ' por mês';
    if (q.k === 'idade') return v === null || v === '' ? '—' : v + ' anos';
    if (q.k === 'cep') return a.bairro ? (a.cep ? a.cep + ' · ' : '') + a.bairro : '—';
    return String(v ?? '—'); };
  return <CidadaoPagina><Voltar para="/meus-direitos" rotulo="Meus direitos" /><h1 className="c-h1">Minhas respostas</h1>
    {grupos.map(([g, ks]) => <div key={g} className="col" style={{ gap: 6 }}><span className="lbl">{g}</span><div className="card" style={{ padding: '4px 16px' }}>{ks.map(k => { const i = QS.findIndex(q => q.k === k), q = QS[i];
      return <div key={k} className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)', alignItems: 'flex-start' }}><span className="col" style={{ gap: 2 }}><span className="small muted">{q.t}</span><b style={{ fontWeight: 500 }}>{valor(q)}</b></span><button className="btn sm" onClick={() => { atualizar({ q: i }); nav('/triagem'); }}>Editar</button></div>; })}</div></div>)}
    <p className="xs muted">Mudou alguma coisa? Edite e o resultado é recalculado na hora.</p>
  </CidadaoPagina>;
}
