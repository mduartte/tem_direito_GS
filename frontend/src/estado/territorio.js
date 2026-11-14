// Pontos de atendimento perto da casa, para o Brasil todo: a API junta o cadastro da gestão
// com o OpenStreetMap. O resultado fica guardado no aparelho para abrir sem rede.
import { useEffect, useState } from 'react';
import { atendimentoApi } from '../api/servicos.js';
import { km } from './formato.js';

const chaveCache = (lat, lng, tipo) => `td-perto:${tipo || 'todos'}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
const ler = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

/** Lista de pontos perto de (lat, lng). tipo: CRAS, UBS, Farmácia, Defensoria ou vazio (todos). */
export function usePerto(lat, lng, tipo) {
  const [estado, setEstado] = useState({ lista: null, erro: null });
  useEffect(() => {
    if (lat == null || lng == null) { setEstado({ lista: [], erro: null }); return; }
    const k = chaveCache(lat, lng, tipo);
    const salvo = ler(k);
    setEstado({ lista: salvo, erro: null });
    let vivo = true;
    atendimentoApi.perto(lat, lng, tipo)
      .then(l => { if (!vivo) return; localStorage.setItem(k, JSON.stringify(l)); setEstado({ lista: l, erro: null }); })
      .catch(e => vivo && setEstado(x => ({ lista: x.lista || [], erro: e.message })));
    return () => { vivo = false; };
  }, [lat, lng, tipo]);
  return estado;
}

/** Recalcula a distância no aparelho (para listas vindas do cache). */
export const comDistancia = (lista, lat, lng) => (lista || []).map(p => ({ ...p, km: p.km ?? km([lat, lng], [p.lat, p.lng]) }));

/** Link de busca no mapa, para quando o mapa aberto não conhece nenhum ponto perto. */
export const buscaNoMapa = (tipo, a) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${tipo === 'CRAS' ? 'CRAS Centro de Referência de Assistência Social' : tipo} perto de ${[a.bairro, a.cidade, a.uf].filter(Boolean).join(', ')}`);
