#!/usr/bin/env node
// Smoke test de interface com Playwright: faz a triagem como uma pessoa faria,
// pergunta ao assistente e entra no painel com as duas etapas.
// Uso: node scripts/smoke-ui.mjs [http://localhost:4173]
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const passo = async (nome, fn) => { process.stdout.write('  • ' + nome + ' … '); await fn(); console.log('ok'); };
try {
  await passo('início', async () => { await page.goto(URL); await page.getByRole('button', { name: /Começar/ }).click(); });
  await passo('para quem', async () => { await page.getByRole('button', { name: /Para mim/ }).click(); await page.getByRole('button', { name: 'Continuar' }).click(); });
  await passo('10 perguntas', async () => {
    const cont = () => page.getByRole('button', { name: /^(Continuar|Ver meus direitos)$/ }).click();
    await page.getByRole('button', { name: 'Menos uma pessoa' }).click(); await cont();           // 1 pessoa
    await page.getByLabel('Idade em anos').fill('70'); await cont();
    await page.getByRole('button', { name: 'Não', exact: true }).click(); await cont();          // deficiência
    await page.getByRole('button', { name: 'Nada' }).click(); await cont();                      // renda
    await page.getByRole('button', { name: 'Não', exact: true }).click(); await cont();          // aposentadoria
    await page.getByRole('button', { name: 'Nenhuma destas' }).click(); await cont();
    await page.getByRole('button', { name: 'Não', exact: true }).click(); await cont();          // Cadastro Único
    await page.getByRole('button', { name: 'Sim', exact: true }).click(); await cont();          // remédio
    await page.getByRole('button', { name: 'Sim', exact: true }).click(); await cont();          // luz
    await page.getByLabel('CEP').fill('04938000'); await page.getByText('Jardim Ângela', { exact: false }).first().waitFor(); await cont();
  });
  await passo('consentimento e resultado', async () => {
    await page.getByRole('switch', { name: 'Registrar a triagem anônima' }).click();
    await page.getByRole('button', { name: 'Ver o resultado' }).click();
    await page.getByText('BPC Idoso').first().waitFor({ timeout: 15000 });
  });
  await passo('kit do direito', async () => { await page.getByRole('link', { name: 'Montar o Kit do Direito' }).click(); await page.getByText('No balcão, diga').waitFor(); });
  await passo('assistente', async () => {
    await page.goto(URL + '/duvidas');
    await page.getByRole('button', { name: 'Quem tem direito ao BPC?' }).click();
    await page.locator('.msg.a .txt').filter({ hasText: /BPC/ }).first().waitFor({ timeout: 30000 });
  });
  await passo('painel em duas etapas', async () => {
    await page.goto(URL + '/painel/entrar');
    await page.getByRole('button', { name: 'Entrar' }).click();
    const codigo = (await page.locator('.notice b.mono').textContent()).trim();
    await page.getByLabel('Dígito 1').fill(codigo);
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await page.getByText('Caminho do direito').waitFor({ timeout: 15000 });
  });
  await passo('encaminhamentos', async () => { await page.getByRole('link', { name: 'Encaminhamentos' }).click(); await page.locator('table.t tbody tr').first().waitFor(); });
  console.log('Interface ok.');
} catch (e) {
  await page.screenshot({ path: 'smoke-ui-falha.png', fullPage: true });
  console.error('\nFalhou:', e.message);
  process.exitCode = 1;
} finally { await browser.close(); }
