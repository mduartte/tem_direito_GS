#!/usr/bin/env node
/**
 * Teste de paridade do motor de regras.
 *
 * Por que existe: o motor de regras foi escrito primeiro no protótipo
 * (JavaScript) e depois portado para Java (backend). Os dois precisam dar
 * EXATAMENTE o mesmo resultado, inclusive nos textos com valores em reais,
 * para que o que foi validado com usuárias no protótipo continue valendo.
 *
 * Como funciona:
 *   1. Gera N perfis de família aleatórios (semente fixa, reprodutível),
 *      mais os casos-limite (renda exatamente no limite, renda vazia, idade
 *      vazia, todas as combinações de "não sei").
 *   2. Roda o motor do protótipo (scripts/paridade/motor-prototipo.cjs).
 *   3. Compila e roda o motor Java puro (backend/.../regras) com javac.
 *   4. Compara as saídas linha a linha e mostra as diferenças.
 *
 * Uso:  node scripts/paridade-motor.mjs [quantidade=3000]
 * Sai com código 1 se houver qualquer diferença (usado no CI).
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const motor = require(join(raiz, 'scripts/paridade/motor-prototipo.cjs'));
const N = Number(process.argv[2] || 3000);

// Gerador pseudoaleatório com semente fixa (mesmo do protótipo), para o teste ser reprodutível.
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261113);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const GRUPOS = ['c06', 'c717', 'gest', 'emp', 'est', 'fac', 'jov', 'ido', 'men', 'des', 'des6', 'clt', 'bpct', 'rua', 'casa'];

// Rendas que caem exatamente nos limites (por pessoa × pessoas) testam os "<=".
const sm = motor.REGRAS_PADRAO.sm;
const limites = [0, 218, sm * 0.25, sm * 0.5, sm, sm * 1.5, sm * 2, sm * 3, 2766, 3200];

const perfis = [];
for (let i = 0; i < N; i++) {
  const pessoas = 1 + Math.floor(rnd() * 7);
  const usarLimite = rnd() < 0.3;
  const renda = rnd() < 0.05 ? null
    : usarLimite ? Math.round(pick(limites) * pessoas * 100) / 100 + pick([0, 0, 0.01, -0.01])
    : Math.round(rnd() * 7000);
  const grupos = GRUPOS.filter(() => rnd() < 0.18);
  perfis.push({
    pessoas, renda: renda === null ? null : Math.max(0, renda),
    idade: rnd() < 0.05 ? null : Math.floor(rnd() * 95),
    pcd: pick(['sim', 'nao', 'naosei']), aposent: pick(['sim', 'nao']),
    criancas: grupos.includes('c06') || grupos.includes('c717') ? 'sim' : pick(['sim', 'nao']),
    cad: pick(['sim', 'nao', 'naosei']), remedio: pick(['sim', 'nao']),
    luz: pick(['sim', 'nao', 'semluz']), grupos,
  });
}

const s = (v) => (v === undefined || v === null ? '' : String(v));
function serializar(a) {
  const res = motor.avaliar({ ...a, grupos: a.grupos }, motor.REGRAS_PADRAO);
  const linhas = res.map((b) => [b.id, b.status, b.v, b.nome, s(b.resumo), s(b.valor), s(b.desc), s(b.texto), s(b.nota), s(b.lei), s(b.cat), s(b.esf), s(b.orgao), s(b.logica),
    b.conds.map((c) => [c.t, c.val, !!c.ok, !!c.passo, !!c.info, !!c.talvez].join('~')).join('¦')].join('|'));
  motor.montarKit(a, res).forEach((k) => linhas.push(['KIT', k.id, k.curto, k.titulo, k.onde, k.frase, k.docs.join('¦')].join('|')));
  linhas.push('--');
  return linhas.join('\n');
}

const tmp = mkdtempSync(join(tmpdir(), 'paridade-'));
const entrada = join(tmp, 'perfis.txt');
writeFileSync(entrada, perfis.map((a) => [a.pessoas, s(a.idade), a.pcd, s(a.renda), a.aposent, a.criancas, a.cad, a.remedio, a.luz, a.grupos.join(',')].join('|')).join('\n'));
const esperado = perfis.map(serializar).join('\n') + '\n';

// Compila o motor Java puro (sem Spring) e o harness.
const fontes = [];
// Só o pacote do motor (sem subpastas): regras/servico depende do Spring e não entra na comparação.
const pastaMotor = join(raiz, 'backend/src/main/java/br/com/temdireito/regras');
for (const f of readdirSync(pastaMotor)) { const p = join(pastaMotor, f); if (!statSync(p).isDirectory() && f.endsWith('.java')) fontes.push(p); }
fontes.push(join(raiz, 'scripts/paridade/Paridade.java'));
const classes = join(tmp, 'classes');
execFileSync('javac', ['-encoding', 'UTF-8', '-d', classes, ...fontes], { stdio: 'inherit' });
const obtido = execFileSync('java', ['-Dfile.encoding=UTF-8', '-Dstdout.encoding=UTF-8', '-cp', classes, 'Paridade', entrada], { encoding: 'utf8', maxBuffer: 1 << 30 });

const a = esperado.split('\n'), b = obtido.split('\n');
let difs = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) {
    difs++;
    if (difs <= 10) { console.log(`\nDiferença na linha ${i + 1}:\n  protótipo: ${a[i]}\n  java:      ${b[i]}`); }
  }
}
console.log(`\n${N} perfis · ${a.length} linhas comparadas · ${difs} diferença(s)`);
process.exit(difs ? 1 : 0);
