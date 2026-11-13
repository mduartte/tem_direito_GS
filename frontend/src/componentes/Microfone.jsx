// Bloco de microfone das perguntas de número (idade e renda): fala → número.
import { useEffect, useRef, useState } from 'react';
import { Ic } from './ui.jsx';
import { numeroFalado, ouvir, temReconhecimento } from '../estado/voz.js';

const ALTURAS = [10, 18, 28, 36, 26, 40, 30, 20, 34, 24, 14, 28, 18, 12];

export default function Microfone({ onNumero }) {
  const [estado, setEstado] = useState('parado');
  const [ao, setAo] = useState('');
  const parar = useRef(() => {});
  useEffect(() => () => parar.current(), []);
  if (!temReconhecimento()) return <p className="xs muted"><Ic n="mic" s={14} /> Responder falando funciona no Chrome e no Edge.</p>;
  const iniciar = () => {
    if (estado === 'ouvindo') { parar.current(); return; }
    setEstado('ouvindo'); setAo('');
    parar.current = ouvir({
      onTexto: (t, final) => { setAo(t); if (final) { const n = numeroFalado(t); if (n !== null) onNumero(n); else setAo(t + ' · não entendi o número'); } },
      onFim: () => setEstado('parado'),
      onErro: m => { setAo(m); setEstado('parado'); }
    });
  };
  return <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
    <button className="mic" type="button" onClick={iniciar} aria-label="Responder falando">{estado === 'ouvindo' && <><span className="ring" /><span className="ring" /></>}<Ic n="mic" s={38} c="#fff" w={2} /></button>
    <div className="wavebox" style={{ visibility: estado === 'ouvindo' ? 'visible' : 'hidden' }}>{ALTURAS.map((h, i) => <i key={i} style={{ height: h, animationDelay: `${i * 0.07}s` }} />)}</div>
    <span className="small muted">{estado === 'ouvindo' ? 'Ouvindo… fale o número' : 'Toque no microfone e fale'}</span>
    <span className="small" style={{ minHeight: 20 }} aria-live="polite">{ao}</span>
  </div>;
}
