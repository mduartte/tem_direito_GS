// Bairros e pontos de atendimento vindos da API, guardados no aparelho para funcionar sem rede.
import { useEffect, useState } from 'react';
import { atendimentoApi } from '../api/servicos.js';
import { km } from './formato.js';

let cache = null;
function lerCache() { try { return JSON.parse(localStorage.getItem('td-territorio')); } catch { return null; } }

export function useTerritorio() {
  const [t, setT] = useState(() => cache || lerCache() || { bairros: [], pontos: [] });
  useEffect(() => {
    if (cache) return;
    Promise.all([atendimentoApi.bairros(), atendimentoApi.pontos()]).then(([bairros, pontos]) => {
      cache = { bairros, pontos };
      localStorage.setItem('td-territorio', JSON.stringify(cache));
      setT(cache);
    }).catch(() => {});
  }, []);
  const centro = nome => { const b = t.bairros.find(x => x.nome === nome) || t.bairros[0]; return b ? [b.lat, b.lng] : [-23.712, -46.768]; };
  const perto = (bairro, tipo) => { const c = centro(bairro); return t.pontos.filter(p => !tipo || p.tipo === tipo).map(p => ({ ...p, km: km(c, [p.lat, p.lng]) })).sort((a, b) => a.km - b.km); };
  return { ...t, centro, perto, pronto: t.pontos.length > 0 };
}
