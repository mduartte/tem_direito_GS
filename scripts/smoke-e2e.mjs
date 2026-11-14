#!/usr/bin/env node
// Smoke test de ponta a ponta com os três serviços no ar.
// Uso: node scripts/smoke-e2e.mjs [http://localhost:8080] (frontend com proxy de /api)
// Variáveis: API (padrão: <frontend>/api), IA (padrão: http://localhost:8000).
// Cobre o caminho principal: triagem → registro → lembrete → painel (2FA) → aviso →
// automação → app recebe o aviso → assistente → apagar (LGPD).

const FRONT = process.argv[2] || 'http://localhost:8080';
const API = process.env.API || FRONT + '/api';
const IA = process.env.IA || 'http://localhost:8000';
let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) falhas++; };
async function j(metodo, url, corpo, h = {}) {
  const r = await fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json', ...h }, body: corpo ? JSON.stringify(corpo) : undefined });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = t; }
  return { s: r.status, d };
}

const respostas = { pessoas: 1, idade: 70, pcd: 'nao', renda: 0, aposent: 'nao', criancas: 'nao', grupos: [], cad: 'nao', remedio: 'sim', luz: 'sim', bairro: 'Jardim Ângela' };

console.log('Frontend e serviços');
const home = await fetch(FRONT).then(r => r.text()).catch(() => '');
ok(home.includes('<div id="app">'), 'frontend responde com a PWA');
const saude = await j('GET', IA + '/saude').catch(() => ({ s: 0 }));
ok(saude.s === 200, 'ia-service no ar (' + (saude.d?.llm || '?') + ')');

console.log('Cidadão');
const av = await j('POST', API + '/triagens/avaliar', respostas);
ok(av.s === 200 && av.d.resultado.length === 29, 'avaliou os 29 benefícios');
ok(av.d.resultado?.find(b => b.id === 'bpci')?.status === 'prov', 'BPC Idoso provável para idosa sem renda');
const reg = await j('POST', API + '/triagens', { respostas, consentimento: true, autorizou: true, canal: 'App' });
ok(reg.s === 201 && /^T-\d+$/.test(reg.d.codigo), 'triagem anônima registrada: ' + reg.d.codigo);
const H = { 'X-Chave': reg.d.chave };
const amanha = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
ok((await j('POST', `${API}/triagens/${reg.d.codigo}/lembretes`, { data: amanha, canal: 'app', localNome: 'CRAS Vila Santa Lúcia' }, H)).s === 201, 'lembrete para amanhã');

console.log('Painel');
const l1 = await j('POST', API + '/auth/painel/login', { email: 'ana.ribeiro@prefeitura.sp.gov.br', senha: 'demo2026' });
ok(l1.d.etapa === 'codigo', 'senha aceita, pede código');
const l2 = await j('POST', API + '/auth/painel/verificar', { email: 'ana.ribeiro@prefeitura.sp.gov.br', codigo: l1.d.codigoTeste });
ok(!!l2.d.token, 'código aceito, sessão aberta');
const A = { Authorization: 'Bearer ' + l2.d.token };
const vg = await j('GET', API + '/painel/visao-geral?per=60', null, A);
ok(vg.s === 200 && vg.d.atual.tri > 0, `visão geral com ${vg.d.atual?.tri} triagens`);
const det = await j('GET', `${API}/painel/triagens/${reg.d.codigo}`, null, A);
ok(det.s === 200 && det.d.etapa === 'agendado' && !('nome' in det.d), 'painel vê a triagem agendada, sem dados pessoais');
ok((await j('POST', `${API}/painel/triagens/${reg.d.codigo}/avisar`, { texto: 'Traga o comprovante de endereço.' }, A)).s === 200, 'aviso enviado à família');
const auto = await j('POST', API + '/painel/automacoes/lembretes/executar', null, A);
ok(auto.s === 200 && auto.d.itens >= 1, 'automação de lembretes rodou: ' + auto.d.detalhe);

console.log('App recebe');
const st = await j('GET', `${API}/triagens/${reg.d.codigo}`, null, H);
const tipos = (st.d.notificacoes || []).map(n => n.tipo);
ok(tipos.includes('AVISO_CRAS') && tipos.includes('LEMBRETE'), 'avisos no app: ' + tipos.join(', '));

console.log('Assistente');
const q1 = await j('POST', API + '/assistente/perguntar', { pergunta: 'Quem tem direito ao BPC?', respostas });
ok(q1.s === 200 && q1.d.texto && q1.d.modo !== 'indisponivel', `respondeu (modo ${q1.d.modo}) com fontes ${JSON.stringify(q1.d.fontes)}`);
ok(!/voc[eê] tem direito/i.test(q1.d.texto || ''), 'não afirma "você tem direito"');
const q2 = await j('POST', API + '/assistente/perguntar', { pergunta: 'Me cobraram um pix para liberar o benefício' });
ok(/golpe/i.test(q2.d.texto || ''), 'reconhece golpe');

console.log('Brasil todo');
const se = await j('GET', API + '/cep/01001000');
ok(se.d.encontrado && se.d.uf === 'SP', `CEP real de São Paulo: ${se.d.logradouro || ''} ${se.d.cidade}-${se.d.uf} (${se.d.fonte})`);
let fora = null;
for (const cep of ['20040002', '40020000', '70040010', '30130010', '50030230']) { const r = await j('GET', API + '/cep/' + cep); if (r.d.encontrado && r.d.uf !== 'SP') { fora = r.d; break; } }
ok(!!fora, 'CEP de outro estado: ' + (fora ? `${fora.cidade}-${fora.uf}` : 'nenhum encontrado'));
const ba = await j('POST', API + '/triagens/avaliar', { ...respostas, cidade: 'Salvador', uf: 'BA', bairro: 'Centro' });
ok(ba.d.resultado.filter(b => b.esf !== 'Federal').every(b => b.status === 'nao'), 'fora de SP, benefícios de SP não se aplicam');
if (fora?.lat) {
  for (const t of ['CRAS', 'UBS', 'Farmácia']) {
    const p = await j('GET', `${API}/pontos/perto?lat=${fora.lat}&lng=${fora.lng}&tipo=${encodeURIComponent(t)}`);
    console.log(`  · ${t} perto de ${fora.cidade} (OpenStreetMap): ${Array.isArray(p.d) ? p.d.length : 0}${Array.isArray(p.d) && p.d[0] ? ' · ex.: ' + p.d[0].nome : ''}`);
  }
}

console.log('LGPD');
ok((await j('DELETE', `${API}/triagens/${reg.d.codigo}`, null, H)).s === 204, 'família apagou a triagem');
ok((await j('GET', `${API}/painel/triagens/${reg.d.codigo}`, null, A)).s === 404, 'painel não encontra mais');

console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
