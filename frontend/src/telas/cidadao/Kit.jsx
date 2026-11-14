// A14 · Kit do Direito, A15 · Onde ir e A16 · Lembrete da véspera.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CidadaoPagina, { Voltar } from '../../componentes/CidadaoPagina.jsx';
import Mapa from '../../componentes/Mapa.jsx';
import { Aviso, Carregando, Ic, Marca, Ouvir, Pill, baixar } from '../../componentes/ui.jsx';
import { triagemApi } from '../../api/servicos.js';
import { useCidadao } from '../../estado/cidadao.jsx';
import { buscaNoMapa, usePerto } from '../../estado/territorio.js';
import { DIAS, MESES, addDias, diaCurto, fmtKm, hoje, isoDia } from '../../estado/formato.js';

export function Kit() {
  const { c, kit, atualizar } = useCidadao();
  const [pi, setPi] = useState(0);
  useEffect(() => { if (!c.viuKit) atualizar({ viuKit: true }); }, [c.viuKit, atualizar]);
  const p = kit[Math.min(pi, Math.max(0, kit.length - 1))];
  if (!p) return <CidadaoPagina><Voltar para="/resultado" rotulo="Resultado" /><h1 className="c-h1">Kit do Direito</h1><div className="card">Pelo que você contou, não há documentos a separar agora.</div></CidadaoPagina>;
  const feitos = p.docs.filter((d, i) => c.kit[p.id + ':' + i]).length;
  const texto = kit.map((x, i) => `PASSO ${i + 1}: ${x.titulo} (${x.onde})\n` + x.docs.map(d => '[ ] ' + d).join('\n') + `\nNo balcão, diga: "${x.frase}"`).join('\n\n');
  return <CidadaoPagina rodape={<><Link className="btn pri block" to="/onde-ir">Ver onde ir</Link><Link className="btn block" to="/lembrete">Marcar lembrete</Link></>}>
    <Voltar para="/resultado" rotulo="Resultado" /><h1 className="c-h1">Kit do Direito</h1>
    <div role="tablist" className="row" style={{ padding: 4, background: 'var(--active)', borderRadius: 12, gap: 4, overflowX: 'auto' }}>{kit.map((x, i) =>
      <button key={x.id} role="tab" aria-selected={x.id === p.id} onClick={() => setPi(i)} style={{ flex: 1, minWidth: 'max-content', height: 38, border: 'none', borderRadius: 9, padding: '0 10px', fontSize: 14, background: x.id === p.id ? '#fff' : 'transparent', fontWeight: x.id === p.id ? 600 : 400, color: x.id === p.id ? 'var(--ink)' : 'var(--mute)' }}>Passo {i + 1} · {x.curto}</button>)}</div>
    <div className="card rise" key={p.id}><div className="row between" style={{ alignItems: 'baseline' }}><b style={{ fontSize: 16 }}>{p.titulo}</b><span className="small muted num">{feitos} de {p.docs.length} separados</span></div>
      <div className="bar"><i style={{ width: `${p.docs.length ? feitos / p.docs.length * 100 : 0}%`, transition: 'width .4s' }} /></div>
      <div>{p.docs.map((d, i) => <label key={i} className="check"><input type="checkbox" checked={!!c.kit[p.id + ':' + i]} onChange={e => atualizar(x => ({ kit: { ...x.kit, [p.id + ':' + i]: e.target.checked } }))} /><span className="box"><Ic n="check" s={15} c="#fff" w={3} /></span><span className="t">{d}</span></label>)}</div>
      {feitos === p.docs.length && <div className="row small pop" style={{ color: 'var(--pos)', fontWeight: 600 }}><Ic n="check" s={16} c="#1e7b4f" w={2.6} />Tudo separado para este passo</div>}</div>
    <div className="card rise" style={{ background: 'var(--mint)', borderColor: 'var(--mint)', color: 'var(--g2)' }}><span className="xs" style={{ fontWeight: 600 }}>No balcão, diga</span><span style={{ fontSize: 17, lineHeight: 1.45 }}>“{p.frase}”</span></div>
    <div className="row wrap"><Ouvir texto={p.titulo + '. Leve: ' + p.docs.join('; ') + '. No balcão, diga: ' + p.frase} rotulo="Ouvir a lista" />
      <button className="btn sm" onClick={() => navigator.clipboard?.writeText(texto)}><Ic n="copy" s={16} />Copiar o kit</button>
      <button className="btn sm" onClick={() => baixar('kit-do-direito.txt', texto)}><Ic n="download" s={16} />Baixar</button></div>
  </CidadaoPagina>;
}

export function OndeIr() {
  const { c, atualizar } = useCidadao();
  const nav = useNavigate();
  const { state } = useLocation();
  const [tipo, setTipo] = useState(state?.tipo || 'CRAS');
  const a = c.ans;
  const { lista, erro } = usePerto(a.lat, a.lng, tipo);
  const { lista: todos } = usePerto(a.lat, a.lng, '');
  const rodape = <Link className="btn pri block" to="/lembrete">Marcar lembrete para ir</Link>;
  if (a.lat == null) return <CidadaoPagina rodape={rodape}><Voltar para="/kit" rotulo="Kit do Direito" /><h1 className="c-h1">Onde ir</h1>
    <div className="card"><b>Falta saber onde você mora</b><span className="small muted">Informe o CEP ou a cidade para mostrarmos o CRAS mais perto.</span><button className="btn sm" style={{ width: 'fit-content' }} onClick={() => { atualizar({ q: 9 }); nav('/triagem'); }}>Informar CEP ou cidade</button></div>
    <div className="card"><b>Enquanto isso</b><span className="small muted">Ligue no Disque Social 121 (de graça) e pergunte qual é o CRAS do seu bairro.</span><a className="btn sm" style={{ width: 'fit-content' }} href="tel:121"><Ic n="phone" s={16} />Ligar 121</a></div></CidadaoPagina>;
  const casa = [a.lat, a.lng], alvo = lista?.[0];
  const outros = (todos || []).filter(p => p.id !== alvo?.id).slice(0, 4);
  const gmaps = alvo ? 'https://www.google.com/maps/dir/?api=1&destination=' + alvo.lat + ',' + alvo.lng : buscaNoMapa(tipo, a);
  return <CidadaoPagina rodape={rodape}>
    <Voltar para="/kit" rotulo="Kit do Direito" /><h1 className="c-h1">Onde ir</h1>
    <span className="small muted">Perto de {[a.bairro !== 'Não informado' ? a.bairro : null, a.cidade, a.uf].filter(Boolean).join(', ')}</span>
    <div className="chips">{['CRAS', 'UBS', 'Farmácia', 'Defensoria'].map(t => <button key={t} className="chip" aria-pressed={t === tipo} onClick={() => setTipo(t)}>{t}</button>)}</div>
    {lista === null ? <Carregando texto="Procurando por perto…" /> : <>
      <Mapa centro={alvo ? [(casa[0] + alvo.lat) / 2, (casa[1] + alvo.lng) / 2] : casa} zoom={alvo && alvo.km > 8 ? 11 : 13} pontos={todos || []} origem={casa} destino={alvo ? [alvo.lat, alvo.lng] : null} rotulo={alvo ? 'Rota da casa até ' + alvo.nome : 'Mapa perto da sua casa'} />
      {alvo ? <div className="card rise"><div className="row between"><b style={{ fontSize: 18 }}>{alvo.nome}</b><Pill t={fmtKm(alvo.km)} /></div><span className="small muted">{alvo.endereco}</span>
        <div className="row small"><Ic n="clock" s={16} c="#17704A" />{alvo.horario}</div>
        <div className="row"><a className="btn pri" style={{ flex: 1, height: 48 }} href={gmaps} target="_blank" rel="noopener noreferrer">Como chegar</a>{alvo.telefone ? <a className="btn" style={{ flex: 1 }} href={'tel:' + alvo.telefone}><Ic n="phone" s={17} />Ligar</a> : <a className="btn" style={{ flex: 1 }} href="tel:121"><Ic n="phone" s={17} />Disque 121</a>}</div>
        <span className="xs muted">{alvo.fonte === 'OpenStreetMap' ? 'Local do mapa aberto (OpenStreetMap). Confira o endereço e o horário antes de ir.' : 'Distância aproximada a partir do seu endereço.'}{alvo.obs ? ' · ' + alvo.obs : ''}</span></div>
        : <div className="card rise"><b>Não achamos {tipo === 'Farmácia' ? 'farmácia' : tipo} no mapa perto de você</b><span className="small muted">O mapa aberto ainda não tem todos os lugares. Procure no mapa do celular ou ligue no Disque Social 121, de graça.</span>
          <div className="row"><a className="btn pri" style={{ flex: 1 }} href={buscaNoMapa(tipo, a)} target="_blank" rel="noopener noreferrer">Procurar no mapa</a><a className="btn" style={{ flex: 1 }} href="tel:121"><Ic n="phone" s={17} />Disque 121</a></div></div>}
      {erro && <Aviso>Sem conexão agora. Mostrando o último resultado salvo.</Aviso>}
      {outros.length > 0 && <div className="card"><b>Outros lugares perto</b>{outros.map(p => <div key={p.id} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}><Ic n="pin" s={18} c="#5d5f60" /><span className="col" style={{ gap: 0, flex: 1 }}><span style={{ fontWeight: 500 }}>{p.nome}</span><span className="xs muted">{p.tipo}{p.obs ? ' · ' + p.obs : ''} · {p.horario}</span></span><span className="small muted num">{fmtKm(p.km)}</span></div>)}</div>}
    </>}
  </CidadaoPagina>;
}

export function Lembrete() {
  const { c, kit, atualizar } = useCidadao();
  const { lista: crasPerto } = usePerto(c.ans.lat, c.ans.lng, 'CRAS');
  const nav = useNavigate();
  const t0 = hoje();
  const [ym, setYm] = useState([t0.getFullYear(), t0.getMonth()]);
  const [sel, setSel] = useState(c.lembrete?.data || null);
  const [canal, setCanal] = useState(c.lembrete?.canal || 'app');
  const [erro, setErro] = useState(null);
  const cras = crasPerto?.[0] || { nome: 'CRAS do seu bairro', endereco: '' };
  const primeiro = new Date(ym[0], ym[1], 1), dias = new Date(ym[0], ym[1] + 1, 0).getDate();
  const dsel = sel ? new Date(sel + 'T12:00:00') : null;
  const docs = kit[0]?.docs || [];
  const salvar = async () => {
    setErro(null);
    const l = { data: sel, canal, local: cras.nome, endereco: cras.endereco };
    if (c.code && c.chave) {
      try { await triagemApi.lembrete(c.code, c.chave, { data: sel, canal, localNome: cras.nome, localEndereco: cras.endereco, documentos: docs }); }
      catch (e) { setErro(e.message); return; }
    }
    atualizar({ lembrete: l });
    nav('/meus-direitos');
  };
  const ics = dsel ? ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tem Direito//PT', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@temdireito', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + sel.replace(/-/g, ''), 'SUMMARY:Ir ao ' + cras.nome, 'LOCATION:' + cras.endereco, 'DESCRIPTION:Levar os documentos do Kit do Direito', 'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:Amanhã é dia de CRAS', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') : '';
  return <CidadaoPagina rodape={<button className="btn pri block" disabled={!dsel} onClick={salvar}>{dsel ? 'Marcar para ' + diaCurto(dsel) : 'Escolha um dia'}</button>}>
    <Voltar para="/onde-ir" rotulo="Onde ir" /><h1 className="c-h1">Quando vai ao CRAS?</h1>
    <div className="card"><div className="row between"><b>{MESES[ym[1]][0].toUpperCase() + MESES[ym[1]].slice(1)} de {ym[0]}</b><div className="row" style={{ gap: 4 }}>
      <button className="btn sm" aria-label="Mês anterior" disabled={ym[0] === t0.getFullYear() && ym[1] === t0.getMonth()} onClick={() => setYm(([y, m]) => m === 0 ? [y - 1, 11] : [y, m - 1])}><Ic n="back" s={16} /></button>
      <button className="btn sm" aria-label="Próximo mês" onClick={() => setYm(([y, m]) => m === 11 ? [y + 1, 0] : [y, m + 1])}><Ic n="chev" s={16} /></button></div></div>
      <div className="cal">{DIAS.map(d => <span key={d}>{d[0].toUpperCase()}</span>)}{Array.from({ length: primeiro.getDay() }, (_, i) => <span key={'v' + i} />)}
        {Array.from({ length: dias }, (_, k) => { const dt = new Date(ym[0], ym[1], k + 1), iso = isoDia(dt), passado = dt < t0, fds = dt.getDay() === 0 || dt.getDay() === 6;
          return <button key={iso} className={'num ' + (+dt === +t0 ? 'today' : '')} disabled={passado || fds} aria-pressed={sel === iso} onClick={() => setSel(iso)} aria-label={`${k + 1} de ${MESES[ym[1]]}${fds ? ', fim de semana, o CRAS fecha' : ''}`}>{k + 1}</button>; })}</div>
      <span className="xs muted">Fins de semana ficam desativados: o CRAS não abre.</span></div>
    <div className="col" style={{ gap: 8 }}><span className="lbl">Como avisar</span><div className="chips">{[['app', 'Aviso no app'], ['sms', 'SMS'], ['ambos', 'Os dois']].map(([v, t]) => <button key={v} className="chip" aria-pressed={canal === v} onClick={() => setCanal(v)}>{t}</button>)}</div>
      {canal !== 'app' && !c.conta && <span className="xs muted">Para receber SMS, <Link to="/conta">crie uma conta com o celular</Link>. Sem conta, o aviso aparece aqui no app.</span>}</div>
    {dsel && <div className="card" style={{ background: 'var(--raised)' }}><div className="row" style={{ alignItems: 'flex-start' }}><Marca s={26} /><div className="col" style={{ gap: 2, flex: 1 }}><div className="row between"><b className="small">Tem Direito</b><span className="xs muted">{diaCurto(addDias(dsel, -1))} · 19:00</span></div><span className="small" style={{ lineHeight: 1.45 }}>Amanhã é dia de ir ao {cras.nome}. Leve: {docs.slice(0, 3).join(', ').toLowerCase() || 'seus documentos'}.</span></div></div></div>}
    {dsel && <button className="btn sm" style={{ width: 'fit-content' }} onClick={() => baixar('lembrete-cras.ics', ics, 'text/calendar')}><Ic n="calendar" s={16} />Adicionar à agenda do celular</button>}
    {!c.code && <Aviso>A triagem não foi registrada, então o aviso da véspera fica só neste aparelho.</Aviso>}
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
  </CidadaoPagina>;
}
