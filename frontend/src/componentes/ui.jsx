// Peças visuais reutilizáveis, com as mesmas classes CSS do protótipo (estilos/prototipo.css).
import { ICON } from './icones-dados.js';
import { falar } from '../estado/voz.js';

export function Ic({ n, s = 18, c = 'currentColor', w = 1.8 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d={ICON[n] || ICON.doc} /></svg>;
}

/** Marca do Tem Direito: balão de fala com um "certo". */
export function Marca({ s = 28 }) {
  return <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M6 4h20a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H14l-6 5v-5H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#17704A" /><path d="M10.5 13.5l3.5 3.5 7.5-7.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export const Pill = ({ t, k = '' }) => <span className={'pill ' + k}>{t}</span>;

export function Ouvir({ texto, rotulo = 'Ouvir' }) {
  return <button className="btn sm" type="button" onClick={() => falar(texto)}><Ic n="speaker" s={16} />{rotulo}</button>;
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
