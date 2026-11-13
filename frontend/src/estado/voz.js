// Voz: leitura em voz alta (speechSynthesis) e resposta falada (SpeechRecognition).
// "palavras" converte números ditos por extenso ("mil e duzentos") em número, como no protótipo.

export function falar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(texto));
  u.lang = 'pt-BR';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export const temReconhecimento = () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

/** Escuta uma frase e chama onTexto(parcial, final). Devolve função para parar. */
export function ouvir({ onTexto, onFim, onErro }) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) { onErro && onErro('Seu navegador não reconhece voz. Digite a resposta.'); return () => {}; }
  const r = new R();
  r.lang = 'pt-BR';
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.onresult = e => { const t = Array.from(e.results).map(x => x[0].transcript).join(' '); onTexto(t, e.results[e.results.length - 1].isFinal); };
  r.onerror = e => onErro && onErro(e.error === 'not-allowed' ? 'Permita o uso do microfone.' : 'Não entendi. Tente de novo.');
  r.onend = () => onFim && onFim();
  r.start();
  return () => r.stop();
}

const U = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900 };

export function palavras(t) {
  let total = 0, cur = 0, achou = false;
  String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).forEach(w => {
    if (w in U) { cur += U[w]; achou = true; } else if (w === 'mil') { cur = (cur || 1) * 1000; total += cur; cur = 0; achou = true; }
  });
  return achou ? total + cur : null;
}

/** Número de uma fala: dígitos ("1200", "1.200") ou por extenso. */
export function numeroFalado(t) {
  const d = String(t).replace(/(\d)\.(\d{3})/g, '$1$2').match(/\d+([,.]\d+)?/);
  if (d) return Math.round(parseFloat(d[0].replace(',', '.')));
  return palavras(t);
}
