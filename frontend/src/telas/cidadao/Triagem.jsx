// A3 a A12 · As 10 perguntas da triagem e D9 · Revisão e consentimento.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CidadaoPagina from '../../componentes/CidadaoPagina.jsx';
import Microfone from '../../componentes/Microfone.jsx';
import { Aviso, Ic, Interruptor, Linha, Ouvir } from '../../componentes/ui.jsx';
import { atendimentoApi } from '../../api/servicos.js';
import { useCidadao } from '../../estado/cidadao.jsx';
import { UFS, bairroDoCep, brl } from '../../estado/formato.js';
import { perguntas, respondido } from '../../estado/perguntas.js';
import { falar } from '../../estado/voz.js';

export function Triagem() {
  const { c, atualizar, responder, outra } = useCidadao();
  const nav = useNavigate();
  const QS = perguntas(outra);
  const i = Math.min(c.q, QS.length - 1), q = QS[i], a = c.ans, n = i + 1, tot = QS.length;
  const [cepInfo, setCepInfo] = useState(null);

  useEffect(() => { if (c.tts) falar(q.t + '. ' + (q.help || '')); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const ir = d => { const novo = i + d; if (novo < 0) return nav('/modo'); if (novo >= tot) return nav('/consentimento'); atualizar({ q: novo }); window.scrollTo(0, 0); };
  const [semCep, setSemCep] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [cidadeTmp, setCidadeTmp] = useState({ uf: a.uf || '', cidade: a.cidade || '', bairro: '' });

  /** Busca o CEP na API (ViaCEP no servidor); se o servidor não responder, tenta o ViaCEP direto e, por fim, as faixas do piloto. */
  const setCep = async v => {
    const cep = v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
    atualizar(x => ({ ans: { ...x.ans, cep, ...(cep.length < 9 ? { bairro: null, cidade: null, uf: null, logradouro: '', lat: null, lng: null } : {}) } }));
    setCepInfo(null);
    if (cep.length !== 9) return;
    setBuscando(true);
    let r = null;
    try { r = await atendimentoApi.cep(cep); } catch { /* servidor fora: tenta direto */ }
    if (!r?.encontrado) {
      try {
        const v2 = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`).then(x => x.json());
        if (!v2.erro) r = { encontrado: true, logradouro: v2.logradouro, bairro: v2.bairro, cidade: v2.localidade, uf: v2.uf };
      } catch { /* sem internet */ }
    }
    if (!r?.encontrado && bairroDoCep(cep)) r = { encontrado: true, bairro: bairroDoCep(cep), cidade: 'São Paulo', uf: 'SP' };
    setBuscando(false);
    setCepInfo(r || { encontrado: false });
    if (r?.encontrado) atualizar(x => ({ ans: { ...x.ans, bairro: r.bairro || 'Não informado', cidade: r.cidade, uf: r.uf, logradouro: r.logradouro || '', lat: r.lat ?? null, lng: r.lng ?? null } }));
  };

  /** Para quem não sabe o CEP: estado e cidade (e bairro, se quiser). */
  const usarCidade = async () => {
    setBuscando(true);
    let c = null;
    try { c = await atendimentoApi.local(cidadeTmp.cidade.trim(), cidadeTmp.uf, cidadeTmp.bairro.trim() || undefined); } catch { /* sem rede: segue sem mapa */ }
    setBuscando(false);
    atualizar(x => ({ ans: { ...x.ans, cep: '', logradouro: '', bairro: cidadeTmp.bairro.trim() || 'Não informado', cidade: cidadeTmp.cidade.trim(), uf: cidadeTmp.uf, lat: c?.lat ?? null, lng: c?.lng ?? null } }));
  };

  let corpo = null;
  if (q.type === 'counter') corpo = <div className="counter"><button type="button" aria-label="Menos uma pessoa" onClick={() => responder('pessoas', Math.max(1, a.pessoas - 1))}>−</button><output className="num pop" aria-live="polite">{a.pessoas}</output><button type="button" aria-label="Mais uma pessoa" onClick={() => responder('pessoas', Math.min(20, a.pessoas + 1))}>+</button></div>;
  if (q.type === 'number') corpo = <><div className="field"><label htmlFor="qin">Idade em anos</label><input id="qin" className="inp num" inputMode="numeric" value={a.idade ?? ''} placeholder="Ex.: 67" style={{ fontSize: 22, height: 56 }} onChange={e => responder('idade', e.target.value.replace(/\D/g, '').slice(0, 3) || null)} /></div><Microfone onNumero={v => { responder('idade', String(v)); atualizar({ usouVoz: true }); }} /></>;
  if (q.type === 'money') corpo = <><div className="field"><label htmlFor="qin">Valor por mês, em reais</label><input id="qin" className="inp num" inputMode="numeric" value={a.renda ?? ''} placeholder="Ex.: 760" style={{ fontSize: 22, height: 56 }} onChange={e => responder('renda', e.target.value.replace(/\D/g, '').slice(0, 6) || null)} /></div>
    <div className="chips">{[0, 400, 800, 1200, 1621, 2400].map(v => <button key={v} type="button" className="chip" aria-pressed={a.renda !== null && +a.renda === v} onClick={() => responder('renda', String(v))}>{v === 0 ? 'Nada' : v === 1621 ? '1 salário mínimo' : brl(v)}</button>)}</div>
    <Microfone onNumero={v => { responder('renda', String(v)); atualizar({ usouVoz: true }); }} />
    {a.renda !== null && a.renda !== '' && <div className="card" style={{ borderColor: '#c9e7d6' }}><div className="row between small"><span className="muted">Renda da casa</span><b className="num">{brl(a.renda)} por mês</b></div><div className="row between small"><span className="muted">Por pessoa ({a.pessoas} {a.pessoas > 1 ? 'pessoas' : 'pessoa'})</span><b className="num">{brl(+a.renda / a.pessoas, 1)}</b></div></div>}</>;
  if (q.type === 'choice') corpo = q.opts.map(([v, t]) => <button key={v} type="button" className="opt" aria-pressed={a[q.k] === v} onClick={() => responder(q.k, v)}><b style={{ fontSize: 16 }}>{t}</b><span className="dot" /></button>);
  if (q.type === 'multi') {
    const sel = Array.isArray(a[q.k]) ? a[q.k] : [];
    const tog = v => responder(q.k, v === 'nen' ? (sel.includes('nen') ? [] : ['nen']) : (sel.includes(v) ? sel.filter(x => x !== v) : [...sel.filter(x => x !== 'nen'), v]));
    corpo = <><div className="col" style={{ gap: 8 }} role="group" aria-label={q.t}>{q.opts.map(([v, t]) => { const on = sel.includes(v); return <button key={v} type="button" className="opt" aria-pressed={on} onClick={() => tog(v)} style={{ padding: '12px 14px' }}><span className="box" style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${on ? 'var(--g)' : 'var(--border)'}`, background: on ? 'var(--g)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Ic n="check" s={14} c="#fff" w={3} />}</span><b style={{ fontSize: 15, fontWeight: on ? 600 : 500 }}>{t}</b></button>; })}</div>
      {sel.length > 0 && !sel.includes('nen') && <span className="small muted">{sel.length} {sel.length === 1 ? 'marcada' : 'marcadas'}</span>}</>;
  }
  if (q.type === 'cep') {
    const achou = a.cidade && a.uf;
    corpo = <>{!semCep && <div className="field"><label htmlFor="qin">CEP</label><input id="qin" className="inp num" inputMode="numeric" value={a.cep} placeholder="00000-000" maxLength={9} style={{ fontSize: 22, height: 56 }} onChange={e => setCep(e.target.value)} />
      <span className={'small ' + (cepInfo && !cepInfo.encontrado ? '' : 'muted')} aria-live="polite">{buscando ? 'Procurando o endereço…' : achou && a.cep ? <>Endereço: <b>{[a.logradouro, a.bairro !== 'Não informado' ? a.bairro : null].filter(Boolean).join(', ')}{a.logradouro || a.bairro !== 'Não informado' ? ' · ' : ''}{a.cidade} - {a.uf}</b></> : cepInfo && !cepInfo.encontrado ? 'Não achamos esse CEP. Confira os números ou escolha a cidade abaixo.' : 'Digite os 8 números do CEP.'}</span></div>}
      <button type="button" className="btn sm" style={{ width: 'fit-content' }} onClick={() => setSemCep(!semCep)}>{semCep ? 'Tenho o CEP' : 'Não sei o CEP'}</button>
      {semCep && <div className="card"><div className="row" style={{ gap: 8 }}>
        <div className="field" style={{ width: 110 }}><label htmlFor="uf">Estado</label><select id="uf" className="inp" value={cidadeTmp.uf} onChange={e => setCidadeTmp({ ...cidadeTmp, uf: e.target.value })}><option value="">UF</option>{UFS.map(u => <option key={u}>{u}</option>)}</select></div>
        <div className="field" style={{ flex: 1 }}><label htmlFor="cid">Cidade</label><input id="cid" className="inp" value={cidadeTmp.cidade} onChange={e => setCidadeTmp({ ...cidadeTmp, cidade: e.target.value })} placeholder="Ex.: Recife" /></div></div>
        <div className="field"><label htmlFor="bai">Bairro (se quiser)</label><input id="bai" className="inp" value={cidadeTmp.bairro} onChange={e => setCidadeTmp({ ...cidadeTmp, bairro: e.target.value })} /></div>
        <button type="button" className="btn" disabled={!cidadeTmp.uf || cidadeTmp.cidade.trim().length < 2 || buscando} onClick={usarCidade}>{buscando ? 'Procurando…' : 'Usar esta cidade'}</button>
        {achou && !a.cep && <span className="small muted">Cidade escolhida: <b>{a.cidade} - {a.uf}</b></span>}</div>}</>;
  }
  const ok = respondido(q, a);
  return <CidadaoPagina rodape={<><button className="btn pri block" disabled={!ok} onClick={() => ir(1)}>{n === tot ? 'Ver meus direitos' : 'Continuar'}</button>
    {!['choice', 'counter', 'multi', 'cep'].includes(q.type) && <button className="btn block" onClick={() => ir(1)}>Não sei responder</button>}</>}>
    <div className="qhead"><div className="row between"><button className="btn sm" onClick={() => ir(-1)}><Ic n="back" s={16} />Voltar</button><span className="small muted num">Pergunta {n} de {tot}</span></div><div className="bar"><i className="fill" style={{ width: `${n / tot * 100}%` }} /></div></div>
    <div className="col rise" key={'t' + i} style={{ gap: 8 }}><h1 className="c-h1">{q.t}</h1>{q.help && <p className="muted" style={{ lineHeight: 1.5 }}>{q.help}</p>}</div>
    <div className="col rise" key={'c' + i} style={{ animationDelay: '.08s' }}>{corpo}</div>
    <details className="small"><summary style={{ cursor: 'pointer', color: 'var(--g)', fontWeight: 500 }}>Por que perguntamos isso?</summary><p className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>{q.why}</p></details>
    <div className="row"><Ouvir texto={q.t + '. ' + (q.help || '') + (q.opts ? ' Opções: ' + q.opts.map(o => o[1]).join(', ') + '.' : '')} rotulo="Ouvir a pergunta" /></div>
  </CidadaoPagina>;
}

/** D9 · Antes do resultado: o que fazemos com as respostas e o consentimento destacado (LGPD, art. 11). */
export function Consentimento() {
  const { c, atualizar, concluir, outra } = useCidadao();
  const nav = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const ver = async () => {
    setEnviando(true); setErro(null);
    try { await concluir(); nav('/resultado'); } catch (e) { setErro(e.message); } finally { setEnviando(false); }
  };
  return <CidadaoPagina rodape={<button className="btn pri block" disabled={enviando} onClick={ver}>{enviando ? 'Calculando…' : 'Ver o resultado'}</button>}>
    <button className="btn sm" style={{ width: 'fit-content' }} onClick={() => { atualizar({ q: 9 }); nav('/triagem'); }}><Ic n="back" s={16} />Voltar</button>
    <h1 className="c-h1">Antes do resultado</h1>
    <p className="muted" style={{ lineHeight: 1.5 }}>As respostas {outra ? 'sobre a pessoa ' : ''}ficam guardadas só neste aparelho. Você decide o que mais acontece.</p>
    <div className="card">
      <Linha titulo="Registrar a triagem anônima para o CRAS" sub="Vai só o bairro, quantas pessoas, a renda por pessoa arredondada e os benefícios. Nunca nome, CPF ou telefone."><Interruptor ligado={c.consentimento} rotulo="Registrar a triagem anônima" onChange={v => atualizar({ consentimento: v })} /></Linha>
      <Linha titulo="O CRAS pode mandar aviso pelo app" sub="Por exemplo: “volte com o comprovante de endereço”."><Interruptor ligado={c.autorizou} rotulo="Autorizar avisos do CRAS" onChange={v => atualizar({ autorizou: v })} /></Linha>
      <span className="xs muted" style={{ lineHeight: 1.5 }}>Renda e saúde são dados sensíveis. Só usamos para avaliar direitos (Lei Geral de Proteção de Dados, art. 11). Dá para apagar tudo quando quiser.</span>
    </div>
    {!c.consentimento && <Aviso>Sem o registro, o resultado aparece normalmente, mas o CRAS não vê sua triagem e não há lembretes nem retornos.</Aviso>}
    {erro && <Aviso tipo="erro">{erro}</Aviso>}
  </CidadaoPagina>;
}
