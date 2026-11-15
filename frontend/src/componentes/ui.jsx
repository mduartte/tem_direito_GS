// Peças visuais reutilizáveis, com as mesmas classes CSS do protótipo (estilos/prototipo.css).
import { ICON } from './icones-dados.js';
import { useEffect, useRef, useState } from 'react';
import { falar, ouvirEstadoVoz, pararFala } from '../estado/voz.js';

export function Ic({ n, s = 18, c = 'currentColor', w = 1.8 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d={ICON[n] || ICON.doc} /></svg>;
}

/** Marca do Tem Direito: balão de fala com um "certo". */
export function Marca({ s = 28 }) {
  return <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}><defs><linearGradient id="td-marca" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#059669" /><stop offset="1" stopColor="#0E7490" /></linearGradient></defs><path d="M6 4h20a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H14l-6 5v-5H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="url(#td-marca)" /><path d="M10.5 13.5l3.5 3.5 7.5-7.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export const Pill = ({ t, k = '' }) => <span className={'pill ' + k}>{t}</span>;

/** Botão de leitura em voz alta: vira "Parar" enquanto lê e explica quando o aparelho não consegue ler. */
export function Ouvir({ texto, rotulo = 'Ouvir', classe = 'btn sm' }) {
  const [lendo, setLendo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const meu = useRef(false);
  useEffect(() => ouvirEstadoVoz(f => { if (!f) meu.current = false; setLendo(f && meu.current); }), []);
  const tocar = () => {
    if (lendo) { pararFala(); return; }
    meu.current = true;
    if (!falar(texto)) { meu.current = false; setAviso('Este navegador não lê em voz alta. Abra o site no Chrome ou no Safari.'); return; }
    setAviso('Se não ouvir, tire o celular do modo silencioso e aumente o volume.');
    setTimeout(() => setAviso(null), 6000);
  };
  return <span className="col" style={{ gap: 4, display: 'inline-flex', width: classe.includes('block') ? '100%' : undefined }}>
    <button className={classe} type="button" aria-pressed={lendo} onClick={tocar}><Ic n={lendo ? 'x' : 'speaker'} s={16} />{lendo ? 'Parar' : rotulo}</button>
    {aviso && <span className="xs muted" role="status">{aviso}</span>}
  </span>;
}

export function Interruptor({ ligado, onChange, rotulo }) {
  return <button className="tog" type="button" role="switch" aria-checked={!!ligado} aria-label={rotulo} onClick={() => onChange(!ligado)} />;
}

export function Linha({ titulo, sub, children }) {
  return <div className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)' }}><span className="col" style={{ gap: 2 }}><span style={{ fontWeight: 500 }}>{titulo}</span>{sub && <span className="xs muted">{sub}</span>}</span>{children}</div>;
}

export function Passos({ itens }) {
  return <div className="steps">{itens.map(([t, s, st], i) => <div key={i} className={'st ' + st + ' rise'} style={{ animationDelay: `${0.1 + i * 0.1}s` }}><span className="n">{st === 'ok' ? <Ic n="check" s={14} c="#fff" w={3} /> : st === 'bad' ? <Ic n="x" s={13} c="#c4242a" w={3} /> : i + 1}</span><div className="col" style={{ gap: 2 }}><b style={{ fontSize: 15, color: st === 'next' ? 'var(--mute)' : 'var(--ink)' }}>{t}</b><span className="small muted">{s}</span></div></div>)}</div>;
}

export function Aviso({ children, tipo }) {
  return <div className="notice" role={tipo === 'erro' ? 'alert' : 'status'} style={tipo === 'erro' ? { borderColor: '#f3c5c2', background: '#fff5f4', color: 'var(--neg)' } : undefined}>{children}</div>;
}

export function Carregando({ texto = 'Carregando…' }) {
  return <div className="row small muted" role="status"><span className="dots" aria-hidden="true"><i /><i /><i /></span>{texto}</div>;
}

/** Baixa um texto como arquivo (kit, lembrete .ics, CSV). */
export function baixar(nome, texto, tipo = 'text/plain') {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo + ';charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
