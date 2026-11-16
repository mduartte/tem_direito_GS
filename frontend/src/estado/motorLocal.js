// Motor de regras do protótipo, idêntico ao motor Java (o teste de paridade compara os dois).
// Usado como reserva quando o servidor não responde (plano gratuito acordando, sem rede):
// o resultado aparece mesmo assim. Gerado de scripts/paridade/motor-prototipo.cjs; não edite aqui.
/* Motor de regras do protótipo funcional (referência para o teste de paridade).
 * Copiado sem alterações de app/index.html (protótipo publicado como artifact).
 * Não edite: se a regra mudar, mude o motor Java e o protótipo juntos. */
const brl = (v, cents) => 'R$ ' + Number(v||0).toLocaleString('pt-BR', {minimumFractionDigits: cents?2:0, maximumFractionDigits: cents?2:0});
const REGRAS_PADRAO = {
  sm: 1621,
  cad:   {v:5, frac:0.5, totSM:3},
  bolsa: {v:5, lim:218, base:691, pessoa:164, crianca:173, variavel:58, protecao:706},
  bpcI:  {v:3, idade:65, frac:0.25, texto:'Você tem 65 anos ou mais e a renda da casa é baixa. Então pode ter direito ao BPC, um salário mínimo por mês.'},
  bpcP:  {v:2, frac:0.25},
  tar:   {v:4, frac:0.5, kwh:80},
  farm:  {v:3},
  desc:  {v:1, ate:1, kwh:120},
  gas:   {v:1, frac:0.5},
  agua:  {v:1, frac:0.5, vuln:218},
  pdm:   {v:1, frac:0.5},
  dign:  {v:1, lim:218, fracEst:0.5},
  idj:   {v:1, totSM:2},
  cpi:   {v:1, idade:60, sm2:2},
  mcmv:  {v:1, lim:3200},
  abono: {v:1, lim:2766},
  segd:  {v:1},
  incl:  {v:1},
  isen:  {v:1, frac:0.5},
  prouni:{v:1, integral:1.5, parcial:3},
  fies:  {v:1, frac:0.5},
  plpcd: {v:1, frac:1},
  sup:   {v:1, frac:0.5, lim:218, valor:150.33},
  bom:   {v:1},
  ple:   {v:1, frac:1.5},
  tid:   {v:1, idade:60},
  bupcd: {v:1},
  ctd:   {v:1},
  mae:   {v:1},
  pot:   {v:1, bolsa:1702.05}
};
function avaliar(a, P){
  P = P || R;
  const sm = P.sm, pessoas = Math.max(1, +a.pessoas||1), renda = Math.max(0, +a.renda||0), pc = renda/pessoas;
  const inCad = a.cad === 'sim';
  const G = new Set(Array.isArray(a.grupos) ? a.grupos : []);
  const kids = a.criancas==='sim' || G.has('c06') || G.has('c717');
  const out = [];
  const cadLim = sm*P.cad.frac, cadTot = sm*P.cad.totSM;
  const cadOk = pc <= cadLim || renda <= cadTot;
  out.push({id:'cad', nome:'Cadastro Único', icon:'doc', v:P.cad.v, orgao:'CRAS',
    status: inCad ? 'tem' : (cadOk ? 'prov' : 'nao'),
    resumo:'Cadastro que abre a porta para os outros benefícios', valor:'Gratuito, feito no CRAS',
    desc:'É o cadastro das famílias de baixa renda. Sem ele não dá para pedir BPC, Bolsa Família nem Tarifa Social.',
    conds:[{t:`Renda por pessoa até ${brl(cadLim,1)} (meio salário mínimo)`, val:brl(pc,1), ok:pc<=cadLim},
           {t:`ou renda da casa até ${brl(cadTot)} (3 salários mínimos)`, val:brl(renda), ok:renda<=cadTot}],
    logica:'basta uma', lei:'Decreto 11.016/2022'});
  const bpcLim = sm*P.bpcI.frac;
  const ci = [{t:`Ter ${P.bpcI.idade} anos ou mais`, val:(a.idade??'—')+' anos', ok:(+a.idade||0) >= P.bpcI.idade},
              {t:`Renda por pessoa até ${brl(bpcLim,1)} (${P.bpcI.frac===0.25?'¼':'½'} do salário mínimo)`, val:brl(pc,1), ok:pc<=bpcLim},
              {t:'Ninguém da casa recebe aposentadoria ou BPC', val:a.aposent==='sim'?'recebe':'não recebe', ok:a.aposent!=='sim'}];
  const bpcIok = ci.every(c=>c.ok);
  out.push({id:'bpci', nome:'BPC Idoso', icon:'wallet', v:P.bpcI.v, orgao:'INSS', status: bpcIok?'prov':'nao',
    resumo:'1 salário mínimo por mês · '+brl(sm), valor:brl(sm)+' por mês', texto:P.bpcI.texto,
    desc:'Benefício de Prestação Continuada: um salário mínimo por mês para quem tem 65 anos ou mais e renda baixa. Não precisa ter contribuído com o INSS.',
    conds: ci.concat([{t:'Estar no Cadastro Único', val:inCad?'já está':'falta fazer', ok:inCad, passo:true}]), lei:'Lei 8.742/1993 (LOAS), art. 20'});
  const bpcPLim = sm*P.bpcP.frac;
  const cp = [{t:'Pessoa com deficiência de longo prazo na casa', val:a.pcd==='sim'?'sim':a.pcd==='naosei'?'não sabe':'não', ok:a.pcd==='sim', talvez:a.pcd==='naosei'},
              {t:`Renda por pessoa até ${brl(bpcPLim,1)}`, val:brl(pc,1), ok:pc<=bpcPLim},
              {t:'Ninguém da casa recebe BPC ou aposentadoria', val:a.aposent==='sim'?'recebe':'não recebe', ok:a.aposent!=='sim'}];
  const bpcPst = cp.every(c=>c.ok) ? 'prov' : (cp[0].talvez && cp[1].ok && cp[2].ok ? 'ver' : 'nao');
  out.push({id:'bpcp', nome:'BPC Pessoa com Deficiência', icon:'heart', v:P.bpcP.v, orgao:'INSS', status:bpcPst,
    resumo:'1 salário mínimo por mês, com perícia', valor:brl(sm)+' por mês',
    desc:'Um salário mínimo por mês para pessoa com deficiência de qualquer idade, em família de baixa renda. Tem perícia médica e avaliação social no INSS.',
    conds: cp.concat([{t:'Estar no Cadastro Único', val:inCad?'já está':'falta fazer', ok:inCad, passo:true}]), lei:'Lei 8.742/1993 (LOAS), art. 20'});
  const bfOk = pc <= P.bolsa.lim;
  out.push({id:'bolsa', nome:'Bolsa Família', icon:'users', v:P.bolsa.v, orgao:'CRAS / MDS', status: bfOk?'prov':'nao',
    resumo:'A partir de '+brl(P.bolsa.base)+' por mês', valor:'A partir de '+brl(P.bolsa.base)+' por mês: '+brl(P.bolsa.pessoa)+' por pessoa'+(kids||G.has('gest')?', mais '+brl(P.bolsa.crianca)+' por criança de até 6 anos e '+brl(P.bolsa.variavel)+' por gestante ou criança de 7 a 17':''),
    desc:'Transferência de renda para famílias em situação de pobreza. Desde outubro de 2026 paga '+brl(P.bolsa.pessoa)+' por pessoa, com piso de '+brl(P.bolsa.base)+' por família e adicionais por criança, gestante e mãe que amamenta. Se a renda subir até '+brl(P.bolsa.protecao)+' por pessoa, a família pode manter metade do valor por até 12 meses.',
    conds:[{t:`Renda por pessoa até ${brl(P.bolsa.lim)}`, val:brl(pc,1), ok:bfOk},{t:'Estar no Cadastro Único', val:inCad?'já está':'falta fazer', ok:inCad, passo:true}], lei:'Lei 14.601/2023 · Decreto 13.120/2026'});
  const tarLim = sm*P.tar.frac;
  const tarRenda = pc <= tarLim || bpcIok || bpcPst==='prov';
  const tarSt = a.luz==='semluz' ? 'nao' : (tarRenda ? 'prov' : 'nao');
  out.push({id:'tar', nome:'Tarifa Social de Energia (Luz do Povo)', icon:'bolt', v:P.tar.v, orgao:'Distribuidora de energia (Enel SP)', status:tarSt,
    resumo:'Conta de luz sem cobrança de energia até '+P.tar.kwh+' kWh por mês', valor:'100% de desconto na energia até '+P.tar.kwh+' kWh por mês; acima disso, paga só o que passar',
    desc:'Desde julho de 2025, famílias do Cadastro Único com renda de até meio salário mínimo por pessoa, ou que recebem BPC, não pagam a energia dos primeiros '+P.tar.kwh+' kWh do mês. O desconto entra sozinho na conta quando o cadastro está em dia. Iluminação pública e impostos continuam na fatura.',
    conds:[{t:`Renda por pessoa até ${brl(tarLim,1)} ou receber BPC`, val:brl(pc,1), ok:tarRenda},
           {t:'Ter conta de luz', val:a.luz==='semluz'?'não tem':'tem', ok:a.luz!=='semluz'},
           {t:'Conta no nome de alguém da casa', val:a.luz==='sim'?'sim':'não', ok:a.luz==='sim', passo:true},
           {t:'Estar no Cadastro Único', val:inCad?'já está':'falta fazer', ok:inCad, passo:true}], lei:'Lei 12.212/2010, alterada pela Lei 15.235/2025'});
  out.push({id:'farm', nome:'Farmácia Popular', icon:'pill', v:P.farm.v, orgao:'Ministério da Saúde', status: a.remedio==='sim' ? 'pode' : 'nao',
    resumo:'Remédios de uso contínuo de graça', valor:'Grátis, com receita médica',
    desc:'São 41 itens gratuitos: remédios para pressão, diabetes, asma, colesterol, osteoporose, Parkinson, glaucoma e rinite, além de anticoncepcionais e fraldas geriátricas (60 anos ou mais, ou laudo). Basta receita, documento com foto e CPF. Não precisa ser de baixa renda.',
    conds:[{t:'Usar remédio de uso contínuo ou anticoncepcional', val:a.remedio==='sim'?'sim':'não', ok:a.remedio==='sim'}], lei:'Programa Farmácia Popular do Brasil (Ministério da Saúde)'});
  novos(a, P, {sm, pessoas, renda, pc, inCad, cadOk, G, kids, bpcIok, bpcPst}).forEach(b => out.push(b));
  const CAT = {cad:'Renda', bolsa:'Renda', bpci:'Renda', bpcp:'Renda', tar:'Contas da casa', farm:'Saúde'};
  out.forEach(b => { b.cat = b.cat || CAT[b.id] || 'Outros'; b.esf = b.esf || 'Federal'; });
  return out;
}
/* ---- benefícios além dos 6 iniciais (federais, Estado de SP e cidade de SP) ---- */
function novos(a, P, ctx){
  const {sm, pessoas, renda, pc, inCad, cadOk, G, kids, bpcIok, bpcPst} = ctx;
  const has = k => G.has(k), idade = +a.idade||0, idoso = idade>=60 || has('ido');
  const pcd = a.pcd==='sim', pcdTalvez = a.pcd==='naosei', temBPC = a.aposent==='sim' || bpcIok || bpcPst==='prov';
  const cadP = {t:'Estar no Cadastro Único (feito no CRAS)', val:inCad?'já está':'falta fazer', ok:inCad, passo:true};
  const cadPos = inCad || cadOk;
  const meio = sm*0.5, ate = (f) => sm*f;
  const R_ = (t, val, ok, extra) => Object.assign({t, val, ok}, extra||{});
  const st = (conds, opt) => { const o = opt||{}; const duro = conds.filter(c=>!c.passo && !c.info); if (duro.every(c=>c.ok)) return o.ver ? 'ver' : (o.pode ? 'pode' : 'prov'); if (o.talvez && duro.every(c=>c.ok||c.talvez)) return 'ver'; return 'nao'; };
  const L = [];
  const add = (o) => { L.push(Object.assign({v:(P[o.id]||{}).v||1}, o)); };

  // ---------- Contas da casa ----------
  { const lim1 = ate(P.desc.ate); const c = [R_(`Renda por pessoa entre ${brl(meio,1)} e ${brl(lim1,1)}`, brl(pc,1), pc>meio && pc<=lim1), R_('Ter conta de luz', a.luz==='semluz'?'não tem':'tem', a.luz!=='semluz'), R_('Poder entrar no Cadastro Único (renda da casa até 3 salários mínimos)', brl(renda), cadPos), {t:'Conta no nome de alguém da casa', val:a.luz==='sim'?'sim':'não', ok:a.luz==='sim', passo:true}, cadP];
    add({id:'desc', nome:'Desconto Social de Energia', icon:'bolt', orgao:'Distribuidora de energia (Enel SP)', status:st(c), cat:'Contas da casa',
      resumo:'Desconto na conta de luz para quem consome até '+P.desc.kwh+' kWh', valor:'Desconto médio de cerca de 12% na conta, para consumo de até '+P.desc.kwh+' kWh por mês',
      desc:'Novo desde 1º de janeiro de 2026, para quem ganha um pouco mais do que o limite da conta zerada: famílias do Cadastro Único com renda entre meio e um salário mínimo por pessoa deixam de pagar um encargo da conta (a CDE).', conds:c, lei:'Lei 15.235/2025 (programa Luz do Povo)'}); }
  { const c = [R_(`Renda por pessoa até ${brl(meio,1)} (meio salário mínimo)`, brl(pc,1), pc<=meio), cadP, {t:'Cadastro atualizado nos últimos 2 anos', val:inCad?'confirmar no CRAS':'depois do cadastro', ok:inCad, passo:true}];
    add({id:'gas', nome:'Gás do Povo', icon:'flame', orgao:'MDS · revendas credenciadas', status:st(c), cat:'Contas da casa',
      resumo:'Botijão de gás de 13 kg de graça, por vale', valor:'Recarga gratuita do botijão de 13 kg, com vale no app Meu Social',
      desc:'Substituiu o Auxílio Gás. A família é escolhida automaticamente pelo Cadastro Único, com prioridade para quem recebe o Bolsa Família e tem duas pessoas ou mais. O vale aparece no app Meu Social e é usado em revendas credenciadas.', nota: pessoas<2 ? 'Prioridade para famílias com 2 ou mais pessoas' : '', conds:c, lei:'Lei 15.348/2026'}); }
  { const ok = pc<=meio || temBPC; const vuln = pc<=P.agua.vuln; const c = [R_(`Renda por pessoa até ${brl(meio,1)} ou alguém com BPC`, brl(pc,1), ok), cadP];
    add({id:'agua', nome:'Tarifa Social de Água (Sabesp)', icon:'drop', orgao:'Sabesp · Arsesp', status:st(c), cat:'Contas da casa', esf:'Estado de SP',
      resumo: vuln ? 'Conta de água a partir de R$ 16,42' : 'Conta de água com cerca de 70% de desconto', valor: vuln ? 'Tarifa Vulnerável: R$ 16,42 para até 10 mil litros por mês' : 'Tarifa Social: cerca de R$ 21,52 para até 10 mil litros por mês',
      desc:'A lei federal garante pelo menos 50% de desconto nos primeiros 15 m³ para famílias do Cadastro Único com renda até meio salário mínimo por pessoa ou com BPC. Em São Paulo, a Sabesp aplica a Tarifa Vulnerável (renda até R$ 218 por pessoa) e a Tarifa Social (até meio salário mínimo), de forma automática para quem tem o cadastro em dia.', conds:c, lei:'Lei 14.898/2024 · Deliberação Arsesp 1.544/2024'}); }

  // ---------- Renda ----------
  { const c = [R_(`Renda por pessoa até ${brl(meio,1)}`, brl(pc,1), pc<=meio), R_('Morar em cidade que aderiu ao programa', 'o CRAS confirma', true, {info:true}), cadP];
    const s = st(c); add({id:'sup', nome:'SuperAção SP', icon:'wallet', orgao:'Governo do Estado de SP (SEDS)', status: s==='prov' ? 'ver' : s, cat:'Renda', esf:'Estado de SP',
      resumo: pc<P.sup.lim ? brl(P.sup.valor)+' por pessoa por mês e acompanhamento' : 'Acompanhamento, cursos e apoio para gerar renda', valor: pc<P.sup.lim ? brl(P.sup.valor)+' por pessoa por mês, para renda abaixo de '+brl(P.sup.lim) : 'Trilhas de autonomia: cursos, emprego e acompanhamento por até 2 anos',
      desc:'Programa estadual de superação da pobreza. Agentes buscam as famílias pelo Cadastro Único e acompanham por até dois anos, com transferência de renda para quem está abaixo de R$ 218 por pessoa e cursos e encaminhamento para trabalho. Atende só municípios que aderiram.', nota:'O CRAS confirma se a sua cidade aderiu', conds:c, lei:'Lei Estadual 18.176/2025'}); }
  { const c = [R_('Pessoa com deficiência que recebe BPC', a.pcd==='sim'||G.has('bpct')?'sim':'não', G.has('bpct')), R_('Começou a trabalhar com carteira, ganhando até 2 salários mínimos', G.has('bpct')?'sim':'não', G.has('bpct'))];
    add({id:'incl', nome:'Auxílio-Inclusão', icon:'wallet', orgao:'INSS', status:st(c), cat:'Renda',
      resumo:'Meio salário mínimo por mês para quem saiu do BPC para trabalhar', valor:brl(sm*0.5,1)+' por mês, somados ao salário',
      desc:'Quem recebe o BPC por deficiência e consegue emprego formal não fica sem proteção: o BPC é suspenso e passa a receber meio salário mínimo por mês junto com o salário. Se perder o emprego, pode voltar ao BPC.', conds:c, lei:'Lei 14.176/2021'}); }

  // ---------- Saúde ----------
  { const ok = has('men') && (pc<=P.dign.lim || ((has('emp')||has('est')) && pc<=sm*P.dign.fracEst) || has('rua'));
    const c = [R_('Pessoa de 10 a 49 anos que menstrua', has('men')?'sim':'não', has('men')), R_(`Renda por pessoa até ${brl(P.dign.lim)}, ou estudante de escola pública com renda até ${brl(sm*P.dign.fracEst,1)}, ou em situação de rua`, brl(pc,1), ok || !has('men') ? (pc<=P.dign.lim || ((has('emp')||has('est')) && pc<=sm*P.dign.fracEst) || has('rua')) : false), cadP];
    add({id:'dign', nome:'Dignidade Menstrual', icon:'heart', orgao:'Ministério da Saúde', status:st(c), cat:'Saúde',
      resumo:'40 absorventes grátis a cada 56 dias', valor:'40 absorventes a cada 56 dias, na Farmácia Popular',
      desc:'Absorventes gratuitos para quem tem de 10 a 49 anos e está no Cadastro Único em situação de pobreza, é estudante de baixa renda da rede pública ou está em situação de rua. A autorização sai no app Meu SUS Digital e é usada em farmácias credenciadas.', conds:c, lei:'Lei 14.214/2021'}); }
  { const c = [R_('Gestante na casa', has('gest')?'sim':'não', has('gest')), R_('Fazer o pré-natal em UBS da cidade de São Paulo', 'na UBS mais perto', true, {info:true})];
    add({id:'mae', nome:'Mãe Paulistana', icon:'heart', orgao:'Prefeitura de SP · UBS', status:st(c,{pode:true}), cat:'Saúde', esf:'Cidade de SP',
      resumo:'Pré-natal, transporte grátis, enxoval e vaga em creche', valor:'Transporte grátis para o pré-natal, enxoval com 24 itens e vaga em creche',
      desc:'Gestante que faz o pré-natal na UBS tem consultas e exames, bilhete de transporte gratuito para ir às consultas (e para o bebê até 2 anos), enxoval com 24 itens a partir de 36 semanas com 7 consultas, e vaga garantida em creche se começar o pré-natal até o 4º mês.', conds:c, lei:'Lei Municipal 13.211/2001 · Rede Mãe Paulistana'}); }

  // ---------- Transporte ----------
  { const c = [R_('Pessoa com 60 anos ou mais na casa', idoso?'sim':'não', idoso)];
    add({id:'tid', nome:'Ônibus, metrô e trem grátis 60+', icon:'bus', orgao:'SPTrans · Metrô · CPTM', status:st(c,{pode:true}), cat:'Transporte', esf:'Cidade de SP',
      resumo:'Transporte público grátis em São Paulo para 60 anos ou mais', valor:'De 60 a 64 anos: Bilhete Único cadastrado. Com 65 ou mais: Bilhete Único Especial ou documento com foto',
      desc:'Na cidade de São Paulo, quem tem 60 anos ou mais não paga ônibus, metrô nem trem. De 60 a 64 anos é preciso cadastrar o Bilhete Único e recarregar a gratuidade todo mês; a partir de 65, basta o Bilhete Único Especial ou um documento com foto. Não depende de renda.', conds:c, lei:'Estatuto da Pessoa Idosa, art. 39 · regras SPTrans'}); }
  { const c = [R_('Pessoa com deficiência na casa', pcd?'sim':pcdTalvez?'não sabe':'não', pcd, {talvez:pcdTalvez}), R_('Relatório médico no modelo da SPTrans', 'o médico preenche', true, {info:true})];
    add({id:'bupcd', nome:'Bilhete Único Especial PcD', icon:'bus', orgao:'SPTrans', status:st(c,{talvez:true}), cat:'Transporte', esf:'Cidade de SP',
      resumo:'Ônibus, metrô e trem grátis para pessoa com deficiência', valor:'Gratuidade no transporte público, com acompanhante quando o laudo indicar',
      desc:'Pessoas com deficiência física, intelectual, visual, auditiva ou múltipla que gere incapacidade total ou parcial têm transporte gratuito em São Paulo. O pedido é feito no site da SPTrans, com relatório médico no modelo deles. Não depende de renda.', conds:c, lei:'Decreto Municipal 58.639/2019 · regras SPTrans'}); }
  { const c = [R_('Pessoa com deficiência na casa', pcd?'sim':pcdTalvez?'não sabe':'não', pcd, {talvez:pcdTalvez}), R_(`Renda por pessoa até ${brl(ate(P.plpcd.frac),1)} (1 salário mínimo)`, brl(pc,1), pc<=ate(P.plpcd.frac)), cadP];
    add({id:'plpcd', nome:'Passe Livre Interestadual PcD', icon:'bus', orgao:'Ministério dos Transportes · ANTT', status:st(c,{talvez:true}), cat:'Transporte',
      resumo:'Viagem grátis entre estados para pessoa com deficiência', valor:'Passagem grátis de ônibus, trem e barco entre estados, com acompanhante se o médico indicar',
      desc:'Para pessoa com deficiência e renda de até um salário mínimo por pessoa. Quem recebe BPC já comprova; os demais precisam estar no Cadastro Único e ter a deficiência atestada por médico no sistema do Passe Livre. O pedido é feito em passelivre.antt.gov.br com a conta gov.br.', conds:c, lei:'Lei 8.899/1994 · Portaria Interministerial 2/2026'}); }
  { const est = has('emp') || has('est'); const c = [R_('Estudante na casa', est?'sim':'não', est), R_(`Renda por pessoa abaixo de ${brl(ate(P.ple.frac),1)} (1,5 salário mínimo) para técnico e faculdade`, brl(pc,1), has('emp') || pc<ate(P.ple.frac)), {t:'Número do NIS informado à SPTrans', val:inCad?'tem NIS':'vem do Cadastro Único', ok:inCad, passo:true}];
    add({id:'ple', nome:'Passe Livre Estudantil', icon:'bus', orgao:'SPTrans · EMTU', status:st(c), cat:'Transporte', esf:'Cidade de SP',
      resumo:'Ônibus grátis para ir à escola ou faculdade', valor:'Gratuidade no Bilhete Único Estudante (e no intermunicipal da EMTU, se estudar em outra cidade)',
      desc:'Alunos de escola pública do fundamental e do médio têm passe livre nos ônibus municipais. Estudantes de técnico e faculdade também têm, se a renda da família for menor que 1,5 salário mínimo por pessoa ou se tiverem Prouni, Fies ou cota social. O pedido é feito no site da SPTrans.', conds:c, lei:'Regras SPTrans do Bilhete Único Estudante'}); }
  { const c = [R_('Alguém demitido há mais de 30 e menos de 180 dias', has('des')?'sim':'não', has('des'))];
    add({id:'ctd', nome:'Cartão do Trabalhador Desempregado', icon:'bus', orgao:'Metrô · CPTM (Governo de SP)', status:st(c), cat:'Transporte', esf:'Estado de SP',
      resumo:'Metrô e trem grátis por 90 dias para quem foi demitido', valor:'Metrô e trem grátis por 90 dias, sem renovação',
      desc:'Para quem está sem emprego formal há mais de 30 e menos de 180 dias. O pedido é feito pela internet com RG, CPF, carteira de trabalho e termo de rescisão; o cartão chega em até 10 dias úteis.', conds:c, lei:'Regras Metrô e CPTM'}); }

  // ---------- Educação e trabalho ----------
  { const c = [R_('Estudante do ensino médio em escola pública', has('emp')?'sim':'não', has('emp')), R_(`Renda por pessoa até ${brl(meio,1)}`, brl(pc,1), pc<=meio), R_('Frequência mínima de 80% nas aulas', 'manter', true, {info:true}), cadP];
    add({id:'pdm', nome:'Pé-de-Meia', icon:'cap', orgao:'MEC · Caixa', status:st(c), cat:'Educação e trabalho',
      resumo:'Poupança de até R$ 9.200 para terminar o ensino médio', valor:'Até R$ 9.200 ao longo do ensino médio, em parcelas de R$ 200 e prêmios de R$ 1.000',
      desc:'Incentivo para o estudante do ensino médio público, inclusive EJA, de família do Cadastro Único com renda até meio salário mínimo por pessoa. Não tem inscrição: o MEC cruza os dados da escola com o Cadastro Único, e o dinheiro cai numa poupança no Caixa Tem.', conds:c, lei:'Lei 14.818/2024'}); }
  { const quer = has('fac'); const c = [R_('Quer fazer faculdade e fez o Enem (média 450, redação não zerada)', quer?'sim':'não', quer), R_(`Renda por pessoa até ${brl(ate(P.prouni.parcial))} (3 salários mínimos)`, brl(pc,1), pc<=ate(P.prouni.parcial)), R_('Ensino médio em escola pública ou como bolsista', 'confirmar', true, {info:true})];
    add({id:'prouni', nome:'Prouni', icon:'cap', orgao:'MEC', status:st(c), cat:'Educação e trabalho',
      resumo: pc<=ate(P.prouni.integral) ? 'Bolsa de 100% em faculdade particular' : 'Bolsa de 50% em faculdade particular', valor: pc<=ate(P.prouni.integral) ? 'Bolsa integral (renda até '+brl(ate(P.prouni.integral),1)+' por pessoa)' : 'Bolsa parcial de 50% (renda até '+brl(ate(P.prouni.parcial))+' por pessoa)',
      desc:'Bolsas em faculdades particulares para quem fez o Enem. A seleção usa a nota e acontece duas vezes por ano, no Portal Acesso Único, com a conta gov.br.', conds:c, lei:'Lei 11.096/2005'}); }
  { const quer = has('fac'); const c = [R_('Quer fazer faculdade e fez o Enem', quer?'sim':'não', quer), R_(`Renda por pessoa até ${brl(meio,1)}`, brl(pc,1), pc<=meio), cadP];
    add({id:'fies', nome:'Fies Social', icon:'cap', orgao:'MEC · FNDE', status:st(c), cat:'Educação e trabalho',
      resumo:'Financiamento de até 100% da faculdade', valor:'Financiamento de até 100% do curso, com metade das vagas do Fies reservada',
      desc:'Modalidade do Fies para estudantes do Cadastro Único com renda até meio salário mínimo por pessoa: metade das vagas é reservada e o financiamento pode cobrir todo o curso.', conds:c, lei:'Lei 10.260/2001 (Fies)'}); }
  { const alvo = has('fac')||has('jov')||has('des')||has('des6'); const c = [R_('Alguém vai prestar concurso federal ou o Enem', alvo?'provável':'não informado', alvo), R_(`Renda por pessoa até ${brl(meio,1)}`, brl(pc,1), pc<=meio), cadP];
    add({id:'isen', nome:'Isenção de taxa em concursos e no Enem', icon:'doc', orgao:'Órgão do concurso · Inep', status:st(c), cat:'Educação e trabalho',
      resumo:'Inscrição grátis em concursos federais e no Enem', valor:'Não paga a taxa de inscrição; basta informar o NIS no prazo do edital',
      desc:'Quem é de família do Cadastro Único com renda até meio salário mínimo por pessoa pode pedir isenção da taxa em concursos federais. O pedido é feito na inscrição, informando o NIS, dentro do prazo do edital.', conds:c, lei:'Lei 13.656/2018'}); }
  { const c = [R_('Alguém trabalhou com carteira assinada em 2024', has('clt')?'sim':'não', has('clt')), R_('Média de salário em 2024 até '+brl(P.abono.lim)+' e PIS há 5 anos ou mais', 'confirmar no app', true, {info:true})];
    const s = st(c); add({id:'abono', nome:'Abono salarial (PIS/Pasep)', icon:'brief', orgao:'Ministério do Trabalho · Caixa e Banco do Brasil', status: s==='prov'?'ver':s, cat:'Educação e trabalho',
      resumo:'Até '+brl(sm)+' por ano para quem trabalhou com carteira', valor:'Até '+brl(sm)+', proporcional aos meses trabalhados em 2024',
      desc:'Pago uma vez por ano a quem trabalhou com carteira pelo menos 30 dias no ano-base, com média de até '+brl(P.abono.lim)+' por mês. Empregados domésticos não recebem. A consulta é feita na Carteira de Trabalho Digital; o calendário de 2026 vai até 30 de dezembro.', nota:'Confira na Carteira de Trabalho Digital · saque até 30/12/2026', conds:c, lei:'Lei 7.998/1990 · Emenda Constitucional 135/2024'}); }
  { const c = [R_('Alguém demitido sem justa causa há até 4 meses', has('des')?'sim':'não', has('des')), R_('Tempo de carteira: 12 meses (1º pedido), 9 meses (2º) ou 6 meses (3º em diante)', 'confirmar', true, {info:true})];
    const s = st(c); add({id:'segd', nome:'Seguro-desemprego', icon:'brief', orgao:'Ministério do Trabalho', status: s==='prov'?'ver':s, cat:'Educação e trabalho',
      resumo:'De 3 a 5 parcelas para quem foi demitido', valor:'De 3 a 5 parcelas, conforme o tempo trabalhado',
      desc:'Para quem foi demitido sem justa causa. O pedido é feito na Carteira de Trabalho Digital ou no gov.br, entre 7 e 120 dias depois da demissão, com o termo de rescisão.', nota:'Peça em até 120 dias da demissão', conds:c, lei:'Lei 7.998/1990 · Lei 13.134/2015'}); }
  { const c = [R_('Sem emprego formal há 6 meses ou mais, sem seguro-desemprego', has('des6')?'sim':'não', has('des6')), R_('Ter 18 anos ou mais e morar em São Paulo há 2 anos', 'confirmar', true, {info:true})];
    const s = st(c); add({id:'pot', nome:'POT · Programa Operação Trabalho', icon:'brief', orgao:'Prefeitura de SP (SMDET)', status: s==='prov'?'ver':s, cat:'Educação e trabalho', esf:'Cidade de SP',
      resumo:'Bolsa e curso para voltar ao trabalho', valor:'Bolsa de '+brl(P.pot.bolsa)+' por mês nos projetos atuais, com 30 horas semanais de atividade e qualificação',
      desc:'Programa da Prefeitura para desempregados de baixa renda: a pessoa trabalha em projetos públicos e faz cursos nos Centros POT, recebendo uma bolsa. As vagas abrem por projeto, no Portal Cate.', nota:'Depende de vagas abertas no Portal Cate', conds:c, lei:'Lei Municipal 18.064/2023'}); }

  // ---------- Moradia e alimentação ----------
  { const c = [R_('A família não tem casa própria', has('casa')?'sim':'não', has('casa')), R_('Renda da casa até '+brl(P.mcmv.lim)+' (sem contar Bolsa Família e BPC)', brl(renda), renda<=P.mcmv.lim), cadP];
    const s = st(c); add({id:'mcmv', nome:'Minha Casa, Minha Vida (Faixa 1)', icon:'home', orgao:'Prefeitura (SEHAB/COHAB) · Caixa', status: s==='prov'?'ver':s, cat:'Moradia e alimentação',
      resumo:'Casa com até 95% de subsídio; sem parcelas para quem tem Bolsa Família ou BPC', valor:'Subsídio de até 95%; imóvel sem prestações para quem recebe Bolsa Família ou BPC',
      desc:'A Faixa 1 é para famílias com renda bruta de até '+brl(P.mcmv.lim)+' por mês em 2026. A inscrição é feita na prefeitura, que seleciona as famílias. Quem recebe Bolsa Família ou BPC não paga prestações.', nota:'A inscrição é na prefeitura; estar inscrito não garante a casa', conds:c, lei:'Lei 14.620/2023 · Portaria MCID 333/2026'}); }
  { const c = [R_('Renda por pessoa até 1 salário mínimo ou em situação de rua', brl(pc,1), pc<=sm || has('rua'))];
    add({id:'bom', nome:'Bom Prato', icon:'food', orgao:'Governo do Estado de SP', status:st(c,{pode:true}), cat:'Moradia e alimentação', esf:'Estado de SP',
      resumo:'Almoço por R$ 1 e café da manhã por R$ 0,50', valor:'Almoço e jantar a R$ 1; café da manhã a R$ 0,50',
      desc:'Restaurantes do Governo de SP com refeição completa (arroz, feijão, proteína, salada e fruta) a preço simbólico. Não precisa de cadastro: é só chegar.', conds:c, lei:'Decreto Estadual 70.225/2025'}); }

  // ---------- Documentos e descontos ----------
  { const c = [R_('Jovem de 15 a 29 anos na casa', has('jov')?'sim':'não', has('jov')), R_(`Renda da casa até ${brl(ate(P.idj.totSM))} (2 salários mínimos)`, brl(renda), renda<=ate(P.idj.totSM)), cadP];
    add({id:'idj', nome:'ID Jovem', icon:'id', orgao:'Secretaria Nacional de Juventude', status:st(c), cat:'Documentos e descontos',
      resumo:'Meia-entrada e viagens grátis entre estados', valor:'Meia-entrada em cultura e esporte e 2 vagas grátis por ônibus interestadual',
      desc:'Documento digital para jovens de 15 a 29 anos de família com renda de até 2 salários mínimos no Cadastro Único atualizado. Não precisa ser estudante. É emitido no app ID Jovem.', conds:c, lei:'Decreto 8.537/2015'}); }
  { const c = [R_('Pessoa com 60 anos ou mais na casa', idoso?'sim':'não', idoso), R_(`Renda própria até ${brl(ate(P.cpi.sm2))} (2 salários mínimos)`, brl(pessoas===1?renda:pc), (pessoas===1?renda:pc) <= ate(P.cpi.sm2)), cadP];
    add({id:'cpi', nome:'Carteira da Pessoa Idosa', icon:'id', orgao:'MDS', status:st(c), cat:'Documentos e descontos',
      resumo:'Viagem grátis ou com 50% de desconto entre estados', valor:'2 vagas grátis por ônibus interestadual e 50% de desconto quando acabarem',
      desc:'Documento digital que comprova renda para usar o direito do Estatuto da Pessoa Idosa no transporte interestadual: duas vagas gratuitas por veículo e, depois, desconto de pelo menos 50%.', conds:c, lei:'Lei 10.741/2003 (Estatuto da Pessoa Idosa), art. 40'}); }

  return L;
}
const ativos = res => res.filter(b => b.status==='prov' || b.status==='pode' || b.status==='ver');

function montarKit(a, res){
  const on = id => res.find(b => b.id===id && (b.status==='prov'||b.status==='ver'||b.status==='pode'));
  const precisaCad = a.cad!=='sim' && res.some(b => (b.id==='cad' && on('cad')) || (on(b.id) && b.conds.some(c=>c.passo && !c.ok && /Cadastro/.test(c.t))));
  const passos = [];
  if (precisaCad) passos.push({id:'cras', curto:'CRAS', titulo:'Cadastro Único no CRAS', onde:'CRAS', frase:`Quero fazer o Cadastro Único${on('bpci')||on('bpcp')?' para pedir o BPC':''}.`,
    docs:['Documento com foto do responsável (RG ou CNH)','RG ou certidão de nascimento de cada morador','CPF de todos da casa','Comprovante de endereço recente','Carteira de trabalho, se tiver']});
  if (on('bpci')||on('bpcp')) passos.push({id:'inss', curto:'INSS', titulo:'Pedido do BPC no INSS', onde:'Meu INSS ou telefone 135', frase:'Quero pedir o Benefício de Prestação Continuada.',
    docs:['Número do CPF','Comprovante do Cadastro Único atualizado','Documento com foto'].concat(on('bpcp')?['Laudo médico com CID e assinatura']:[])});
  if (on('tar')) passos.push({id:'luz', curto:'Luz', titulo:'Tarifa Social na conta de luz', onde:'Distribuidora (Enel SP)', frase:'Quero a Tarifa Social de Energia Elétrica.',
    docs:['Conta de luz recente','Número do NIS (vem do Cadastro Único)'].concat(a.luz==='nao'?['Pedido de troca de titularidade da conta']:[])});
  if (on('farm') || on('dign')) passos.push({id:'farm', curto:'Farmácia', titulo:on('farm')?'Retirar na Farmácia Popular':'Absorventes na Farmácia Popular', onde:'Farmácia com o selo “Aqui tem Farmácia Popular”', frase:on('farm')?'Quero retirar pelo Farmácia Popular.':'Quero retirar os absorventes do Dignidade Menstrual.',
    docs:(on('farm')?['Receita médica dentro da validade']:[]).concat(['Documento com foto e CPF'], on('dign')?['Autorização do Dignidade Menstrual (app Meu SUS Digital)']:[])});
  const auto = ['gas','agua','desc','pdm','sup'].filter(on);
  if (auto.length) passos.push({id:'auto', curto:'Automáticos', titulo:'Benefícios que chegam sozinhos depois do cadastro', onde:'Não precisa pedir: o governo cruza o Cadastro Único', frase:'Meu Cadastro Único está atualizado? Quero conferir se meus dados estão certos.',
    docs:['Manter o Cadastro Único atualizado (pelo menos a cada 2 anos)'].concat(on('gas')?['Gás do Povo: ver o vale no app Meu Social']:[], on('agua')?['Água: se o desconto não vier na conta, ligar para a Sabesp com CPF e NIS']:[], on('desc')?['Luz: conferir “Desconto Social” na conta']:[], on('pdm')?['Pé-de-Meia: estudante frequentando 80% das aulas']:[], on('sup')?['SuperAção SP: perguntar no CRAS se a cidade aderiu']:[])});
  const docsDig = ['idj','cpi','isen'].filter(on);
  if (docsDig.length) passos.push({id:'docs', curto:'Carteirinhas', titulo:'Documentos digitais e isenções', onde:'Pelo celular, depois do Cadastro Único', frase:'Quero emitir minha carteirinha com o meu NIS.',
    docs:['Número do NIS'].concat(on('idj')?['ID Jovem: emitir no app ID Jovem']:[], on('cpi')?['Carteira da Pessoa Idosa: emitir no site do gov.br ou no CRAS']:[], on('isen')?['Isenção: informar o NIS na inscrição, dentro do prazo do edital']:[])});
  const sp = ['tid','bupcd','ple','ctd'].filter(on);
  if (sp.length || on('plpcd')) passos.push({id:'transp', curto:'Transporte', titulo:'Transporte grátis', onde: sp.length?'Site da SPTrans (atendimento.sptrans.com.br)':'passelivre.antt.gov.br', frase:'Quero pedir a gratuidade no transporte.',
    docs:['Documento com foto e CPF','Comprovante de endereço'].concat(on('tid')?['60+: Bilhete Único cadastrado (65+ pode usar só o documento)']:[], on('bupcd')?['PcD: relatório médico no modelo da SPTrans']:[], on('ple')?['Estudante: matrícula e NIS']:[], on('ctd')?['Desempregado: carteira de trabalho e termo de rescisão']:[], on('plpcd')?['Viagem entre estados: atestado do médico no sistema do Passe Livre']:[])});
  const trab = ['segd','abono','pot','incl'].filter(on);
  if (trab.length) passos.push({id:'trab', curto:'Trabalho', titulo:'Trabalho e renda', onde:'Carteira de Trabalho Digital, Meu INSS ou Portal Cate', frase:'Quero pedir o meu benefício de trabalhador.',
    docs:['CPF e carteira de trabalho'].concat(on('segd')?['Seguro-desemprego: termo de rescisão (pedir em até 120 dias)']:[], on('abono')?['Abono: consultar na Carteira de Trabalho Digital até 30/12/2026']:[], on('pot')?['POT: inscrição no Portal Cate quando abrir vaga']:[], on('incl')?['Auxílio-Inclusão: pedir no Meu INSS ou pelo 135']:[])});
  const est = ['prouni','fies'].filter(on);
  if (est.length) passos.push({id:'estudo', curto:'Faculdade', titulo:'Bolsa ou financiamento na faculdade', onde:'Portal Acesso Único (com a conta gov.br)', frase:'Quero me inscrever no Prouni e no Fies Social.',
    docs:['Número de inscrição e notas do Enem','Comprovante de renda da família','Histórico do ensino médio'].concat(on('fies')?['Comprovante do Cadastro Único']:[])});
  if (on('mae')) passos.push({id:'mae', curto:'UBS', titulo:'Pré-natal pelo Mãe Paulistana', onde:'UBS mais perto', frase:'Quero começar o pré-natal pelo Mãe Paulistana.',
    docs:['Cartão SUS (ou RG e comprovante de endereço para fazer)','Teste de gravidez, se tiver']});
  if (on('mcmv')) passos.push({id:'casa', curto:'Moradia', titulo:'Inscrição no Minha Casa, Minha Vida', onde:'Prefeitura (SEHAB/COHAB)', frase:'Quero me inscrever na Faixa 1 do Minha Casa, Minha Vida.',
    docs:['Documento com foto e CPF de todos','Comprovante do Cadastro Único','Comprovante de renda','Comprovante de endereço']});
  return passos;
}
export { REGRAS_PADRAO, avaliar, montarKit };

/** Mesmo ajuste do FiltroRegional.java: benefícios de SP só para quem mora em SP. */
export function filtroRegional(res, a) {
  if (!a || !a.uf) return res;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const estadoSp = a.uf.toUpperCase() === 'SP', cidadeSp = estadoSp && norm(a.cidade) === 'sao paulo';
  const onde = (a.cidade ? a.cidade + ' - ' : '') + a.uf.toUpperCase();
  return res.map(b => {
    const bloq = (b.esf === 'Estado de SP' && !estadoSp) ? 'Mora no Estado de São Paulo' : (b.esf === 'Cidade de SP' && !cidadeSp) ? 'Mora na cidade de São Paulo' : null;
    return bloq ? { ...b, status: 'nao', conds: [{ t: bloq, val: onde, ok: false }, ...b.conds], nota: 'Só para quem mora em São Paulo. Pergunte no CRAS se sua cidade tem um programa parecido.' } : b;
  });
}

/** Avaliação completa no aparelho, no mesmo formato da API. */
export function avaliarLocal(a) {
  const res = filtroRegional(avaliar(a, REGRAS_PADRAO), a);
  return { resultado: res, kit: montarKit(a, res), salarioMinimo: REGRAS_PADRAO.sm, local: true };
}
