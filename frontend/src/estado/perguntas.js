// As 10 perguntas da triagem (QS do protótipo). Para mudar uma pergunta, mude aqui e em Respostas.java.
export const perguntas = outra => [
  { k: 'pessoas', type: 'counter', t: `Quantas pessoas moram na casa, contando com ${outra ? 'a pessoa' : 'você'}?`, help: 'Conte quem divide as despesas e dorme lá.', why: 'O BPC, o Bolsa Família e a Tarifa Social olham a renda dividida por pessoa da casa.' },
  { k: 'idade', type: 'number', t: outra ? 'Qual a idade da pessoa?' : 'Qual a sua idade?', unit: 'anos', why: 'O BPC Idoso é para quem tem 65 anos ou mais.', voz: true },
  { k: 'pcd', type: 'choice', t: 'Alguém da casa tem deficiência ou doença que impede trabalhar por muito tempo?', opts: [['sim', 'Sim'], ['nao', 'Não'], ['naosei', 'Não sei']], why: 'Pode dar direito ao BPC para pessoa com deficiência, em qualquer idade.' },
  { k: 'renda', type: 'money', t: 'Quanto entra de dinheiro por mês na casa, somando todo mundo?', help: 'Pode ser aproximado. Conte salário, bicos e pensões. Não conte o Bolsa Família.', why: 'A renda por pessoa decide a maioria dos benefícios.', voz: true },
  { k: 'aposent', type: 'choice', t: 'Alguém da casa já recebe aposentadoria, pensão ou BPC?', opts: [['nao', 'Não'], ['sim', 'Sim']], why: 'Quem já recebe um benefício do INSS não pode acumular com o BPC.' },
  { k: 'grupos', type: 'multi', t: 'Quem mora na casa? Marque tudo o que vale para alguém da família.', help: 'Pode marcar várias. Se nada disso vale, toque em “Nenhuma destas”.', why: 'Cada situação abre benefícios diferentes: crianças mudam o Bolsa Família, estudantes têm Pé-de-Meia e passe livre, quem foi demitido tem seguro-desemprego, e assim por diante.',
    opts: [['c06', 'Criança de 0 a 6 anos'], ['c717', 'Criança ou adolescente de 7 a 17 anos'], ['gest', 'Gestante ou mãe que amamenta'], ['emp', 'Estudante do ensino médio em escola pública'], ['est', 'Outro estudante: fundamental, técnico ou faculdade'], ['fac', 'Quer entrar na faculdade (fez ou vai fazer o Enem)'], ['jov', 'Jovem de 15 a 29 anos'], ['ido', 'Pessoa com 60 anos ou mais'], ['men', 'Pessoa de 10 a 49 anos que menstrua'], ['des', 'Demitido sem justa causa há 1 a 6 meses'], ['des6', 'Sem emprego com carteira há mais de 6 meses'], ['clt', 'Trabalhou com carteira assinada em 2024'], ['bpct', 'Recebe BPC e começou a trabalhar'], ['rua', 'Pessoa em situação de rua'], ['casa', 'A família não tem casa própria'], ['nen', 'Nenhuma destas']] },
  { k: 'cad', type: 'choice', t: 'A família já está no Cadastro Único?', opts: [['sim', 'Sim'], ['nao', 'Não'], ['naosei', 'Não sei']], help: 'É o cadastro feito no CRAS. Quem tem, recebe um número chamado NIS.', why: 'É o primeiro passo para quase todos os benefícios.' },
  { k: 'remedio', type: 'choice', t: 'Alguém usa remédio de uso contínuo, como pressão, diabetes, asma ou colesterol?', opts: [['sim', 'Sim'], ['nao', 'Não']], why: 'Esses remédios, anticoncepcionais e fraldas geriátricas saem de graça na Farmácia Popular.' },
  { k: 'luz', type: 'choice', t: 'A conta de luz está no nome de alguém da casa?', opts: [['sim', 'Sim'], ['nao', 'Não, está no nome do dono'], ['semluz', 'Não temos conta de luz']], why: 'O desconto da Tarifa Social entra na conta de quem é titular.' },
  { k: 'cep', type: 'cep', t: 'Qual o CEP da casa?', help: 'Serve para achar o CRAS mais perto e ver os benefícios da sua cidade. Se não souber, escolha o estado e a cidade.', why: 'Mostramos o CRAS, a UBS e a farmácia mais perto. Alguns benefícios só existem em certas cidades ou estados. O CEP fica só no seu aparelho.' }
];

export function respondido(q, a) {
  const v = a[q.k];
  if (q.k === 'cep') return !!(a.cidade && a.uf);
  if (q.type === 'counter') return v >= 1;
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
  return v !== null && v !== '' && v !== undefined;
}

export const respostasVazias = () => ({ pessoas: 2, idade: null, pcd: null, renda: null, aposent: null, criancas: null, grupos: [], cad: null, remedio: null, luz: null, cep: '', bairro: null, cidade: null, uf: null, logradouro: '', lat: null, lng: null });

/** O motor recebe "criancas" (sim/nao); a pergunta de grupos já diz isso. */
export function paraMotor(a) {
  const g = a.grupos || [];
  // CEP, rua e coordenadas ficam no aparelho: o servidor só precisa de bairro, cidade e UF.
  const { cep, logradouro, lat, lng, ...resto } = a; // eslint-disable-line no-unused-vars
  return { ...resto, idade: a.idade === null || a.idade === '' ? null : +a.idade, renda: a.renda === null || a.renda === '' ? null : +a.renda,
    criancas: g.includes('c06') || g.includes('c717') ? 'sim' : 'nao', grupos: g.filter(x => x !== 'nen') };
}
