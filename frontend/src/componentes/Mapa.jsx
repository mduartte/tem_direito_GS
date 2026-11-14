// Mapa real (Leaflet + OpenStreetMap). Usado em "Onde ir" (rota da casa ao ponto) e no mapa de demanda do painel.
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';

/** O MapContainer só lê o centro na criação; isto recentraliza quando a busca muda. */
function Recentrar({ centro, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(centro, zoom); }, [centro[0], centro[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const COR = { CRAS: '#131416', UBS: '#1d3f73', Farmácia: '#92400e', Defensoria: '#5b2a86' };

export default function Mapa({ centro, zoom = 13, pontos = [], origem, destino, circulos = [], altura = 320, rotulo = 'Mapa', onCirculo }) {
  return <div className="mapbox" role="img" aria-label={rotulo} style={{ height: altura }}>
    <MapContainer center={centro} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} attributionControl>
      <Recentrar centro={centro} zoom={zoom} />
      <TileLayer attribution='&copy; colaboradores do OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {circulos.map(c => <CircleMarker key={c.id} center={c.pos} radius={c.raio} pathOptions={{ color: c.selecionado ? '#131416' : '#fff', weight: c.selecionado ? 3 : 2, fillColor: '#17704A', fillOpacity: c.opacidade ?? 0.6 }} eventHandlers={onCirculo ? { click: () => onCirculo(c.id) } : undefined}><Tooltip direction="top" permanent={c.permanente}>{c.rotulo}</Tooltip></CircleMarker>)}
      {origem && destino && <Polyline positions={[origem, destino]} pathOptions={{ color: '#17704A', weight: 4, dashArray: '8 8' }} />}
      {origem && <CircleMarker center={origem} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2f70bb', fillOpacity: 1 }}><Tooltip>Sua casa (aproximado)</Tooltip></CircleMarker>}
      {pontos.map(p => <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={destino && p.lat === destino[0] && p.lng === destino[1] ? 11 : 6} pathOptions={{ color: '#fff', weight: 2, fillColor: destino && p.lat === destino[0] ? '#17704A' : COR[p.tipo] || '#131416', fillOpacity: 1 }}><Tooltip>{p.nome}</Tooltip></CircleMarker>)}
    </MapContainer>
  </div>;
}
