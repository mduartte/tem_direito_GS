// A13 · Resultado da triagem e A13b · Detalhe de um benefício.
import { Link, useNavigate, useParams } from 'react-router-dom';
import CidadaoPagina, { Voltar } from '../../componentes/CidadaoPagina.jsx';
import { Aviso, Carregando, Ic, Ouvir, Pill } from '../../componentes/ui.jsx';
import { useCidadao } from '../../estado/cidadao.jsx';
import { usePerto } from '../../estado/territorio.js';
import { CATS, ST, ativos, brl, fmtKm } from '../../estado/formato.js';

function BenCard({ b, i, onClick }) {
  const [t, k] = ST[b.status];
  const nota = b.nota ? b.nota : b.conds.some(c => c.passo && !c.ok && /Cadastro/.test(c.t)) ? 'Antes: fazer o Cadastro Único' : b.status === 'pode' ? 'Já pode usar hoje' : b.status === 'tem' ? 'Mantenha o cadastro em dia' : b.status === 'ver' ? 'Precisa de avaliação médica' : '';
  return <button className="ben rise" style={{ animationDelay: `${0.15 + Math.min(i, 8) * 0.06}s` }} onClick={onClick}><Ic n={b.icon} s={24} c="#17704A" />
    <span className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}><span className="row between" style={{ gap: 8 }}><b style={{ fontSize: 16 }}>{b.nome}</b><Pill t={t} k={k} /></span>
      <span className="small muted">{b.resumo}{b.esf && b.esf !== 'Federal' && <> · <span style={{ whiteSpace: 'nowrap' }}>{b.esf}</span></>}</span>
      {nota && <span className="xs" style={{ color: 'var(--g)', fontWeight: 600 }}>{nota}</span>}</span><Ic n="chev" s={18} c="#5d5f60" /></button>;
}

export function Resultado() {
  const { c, res, kit, erro, refazer, outra } = useCidadao();
  const nav = useNavigate();
  const { lista: crasPerto } = usePerto(c.ans.lat, c.ans.lng, 'CRAS');
  if (!res.length) return <CidadaoPagina>{erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando texto="Calculando seus direitos…" />}</CidadaoPagina>;
  const at = ativos(res), tem = res.filter(b => b.status === 'tem'), nao = res.filter(b => b.status === 'nao');
  const fala = `${outra ? 'A pessoa' : 'Você'} provavelmente pode receber ${at.length} ${at.length === 1 ? 'benefício' : 'benefícios'}: ${at.map(b => b.nome).join(', ')}. Quem decide é o órgão responsável.`;
  const cats = CATS.filter(x => at.some(b => b.cat === x));
  const cras = crasPerto?.[0] || null;
  const pergunta = q => nav('/duvidas', { state: { pergunta: q } });
  const primeiro = at.find(b => b.id !== 'cad');
  return <CidadaoPagina largo rodape={<Link className="btn pri block" to="/kit">Montar o Kit do Direito</Link>}>
    <div className="row between wrap"><Voltar para="/" rotulo="Início" /><div className="row"><Ouvir texto={fala} rotulo="Ouvir o resultado" /><button className="btn sm" onClick={() => { refazer(); nav('/modo'); }}>Refazer</button></div></div>
    {erro && <Aviso tipo="erro">Mostrando o último resultado salvo. {erro}</Aviso>}
    <div className="grid2"><div className="col">
      <div className="rise" style={{ background: 'var(--g)', color: '#fff', borderRadius: 20, padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
        <span className="num pop" style={{ animationDelay: '.25s', fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{at.length}</span>
        <div className="col" style={{ gap: 4 }}><b style={{ fontSize: 18, lineHeight: 1.25 }}>{at.length === 1 ? 'benefício' : 'benefícios'} que {outra ? 'a pessoa' : 'você'} provavelmente pode receber</b><span className="small" style={{ color: '#d7f0e1' }}>Entre {cats.length} áreas. Quem decide é o órgão de cada benefício.</span></div>
      </div>
      {cats.map(x => <div key={x} className="col"><div className="lbl" style={{ marginTop: 6 }}>{x} · {at.filter(b => b.cat === x).length}</div>{at.filter(b => b.cat === x).map((b, i) => <BenCard key={b.id} b={b} i={i} onClick={() => nav('/beneficio/' + b.id)} />)}</div>)}
      {tem.length > 0 && <><div className="lbl" style={{ marginTop: 4 }}>Já tem</div>{tem.map((b, i) => <BenCard key={b.id} b={b} i={i} onClick={() => nav('/beneficio/' + b.id)} />)}</>}
      {nao.length > 0 && <details className="card"><summary style={{ cursor: 'pointer', fontWeight: 500 }}>Não se aplicam, pelo que você contou ({nao.length})</summary><div className="col" style={{ marginTop: 10 }}>{nao.map(b =>
        <button key={b.id} className="row small" onClick={() => nav('/beneficio/' + b.id)} style={{ border: 'none', background: 'none', textAlign: 'left', padding: '6px 0', justifyContent: 'space-between', width: '100%' }}><span>{b.nome}</span><span className="muted">{(b.conds.find(x => !x.ok && !x.passo) || { t: '' }).t}</span></button>)}</div></details>}
      <div className="card"><div className="row" style={{ gap: 10 }}><Ic n="chat" s={20} c="#17704A" /><b>Ficou com dúvida?</b></div><span className="small muted">O assistente explica cada benefício com base no seu resultado.</span>
        <div className="chips">{(primeiro ? [`Como eu peço o ${primeiro.nome}?`] : []).concat(['Por que preciso do Cadastro Único?']).map(q => <button key={q} className="chip" onClick={() => pergunta(q)} style={{ height: 'auto', minHeight: 40, padding: '8px 14px', textAlign: 'left' }}>{q}</button>)}<Link className="chip" to="/duvidas" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>Outra pergunta</Link></div></div>
      {!c.conta && <div className="card"><b>Quer guardar o resultado?</b><span className="small muted">Crie uma conta só com o celular para receber lembretes e acompanhar os pedidos.</span><Link className="btn sm" to="/conta">Criar conta</Link></div>}
    </div>
      <div className="col"><div className="card"><div className="row between"><b>Kit do Direito</b><span className="small muted">{kit.length} {kit.length === 1 ? 'passo' : 'passos'}</span></div>
        {kit.map((p, i) => <div key={p.id} className="row small" style={{ alignItems: 'flex-start' }}><span className="num" style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'var(--mint)' : 'var(--raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>{i + 1}</span><span><b style={{ fontWeight: 600 }}>{p.titulo}</b><br /><span className="muted">{p.onde} · {p.docs.length} documentos</span></span></div>)}
        {!kit.length && <span className="small muted">Nenhum passo agora.</span>}<Link className="btn sm" to="/kit">Abrir o kit</Link></div>
        {cras && <div className="card"><div className="row between"><b>{cras.nome}</b><span className="small muted num">{fmtKm(cras.km)}</span></div><span className="small muted">{cras.endereco}</span><Link className="btn sm" to="/onde-ir">Ver no mapa</Link></div>}
        {c.code && <p className="xs muted">Código anônimo desta triagem: <span className="mono">#{c.code}</span>. É só isso que o CRAS vê.</p>}
      </div></div>
  </CidadaoPagina>;
}

export function Detalhe() {
  const { id } = useParams();
  const { c, res, outra } = useCidadao();
  const nav = useNavigate();
  const b = res.find(x => x.id === id);
  if (!b) return <CidadaoPagina><Voltar para="/resultado" rotulo="Resultado" /><Carregando /></CidadaoPagina>;
  const [t, k] = ST[b.status];
  return <CidadaoPagina rodape={b.status === 'nao' ? <Link className="btn block" to="/resultado">Voltar ao resultado</Link> : <Link className="btn pri block" to="/kit">Quero pedir: ver o que levar</Link>}>
    <Voltar para="/resultado" rotulo="Resultado" />
    <div className="row between rise"><h1 className="c-h1">{b.nome}</h1><Pill t={t} k={k} /></div>
    <p className="muted rise" style={{ lineHeight: 1.55 }}>{b.desc}</p>
    {b.texto && <div className="card rise" style={{ background: 'var(--mint)', borderColor: 'var(--mint)', color: 'var(--g2)' }}><span className="small" style={{ lineHeight: 1.5 }}>{b.texto}</span></div>}
    <div className="card rise"><div className="row between"><span className="small muted">Valor</span><b className="num" style={{ fontSize: 18, textAlign: 'right' }}>{b.valor}</b></div></div>
    <div className="card rise"><b>{b.status === 'nao' ? 'Por que não se aplica' : 'Por que achamos que ' + (outra ? 'a pessoa pode' : 'você pode') + ' receber'}</b>{b.logica && <span className="xs muted">Basta cumprir uma das condições de renda.</span>}
      {b.conds.map((x, i) => <div key={i} className={'cond ' + (x.ok ? 'ok' : 'no')}><span className="m pop" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>{x.ok ? <Ic n="check" s={13} c="#fff" w={3} /> : <Ic n="x" s={12} c="#c4242a" w={3} />}</span><span>{x.t} <span className="muted">· {x.val}</span>{x.passo && !x.ok && <> <span className="xs" style={{ color: 'var(--g)', fontWeight: 600 }}>dá para resolver no CRAS</span></>}</span></div>)}</div>
    <div className="card rise"><b>Quem decide</b><span className="small muted">{b.orgao}</span></div>
    <p className="xs muted">Regra {b.nome} v{b.v} · {b.lei} · {b.esf || 'Federal'} · {c.ans.pessoas} pessoas, {brl(c.ans.renda)} por mês</p>
    <div className="row wrap"><Ouvir texto={b.nome + '. ' + b.desc + ' ' + (b.texto || '')} /><button className="btn sm" onClick={() => nav('/duvidas', { state: { pergunta: 'Tenho uma dúvida sobre o ' + b.nome + ': quem pode receber e como eu peço?' } })}><Ic n="chat" s={16} />Tirar dúvida sobre este benefício</button></div>
  </CidadaoPagina>;
}
