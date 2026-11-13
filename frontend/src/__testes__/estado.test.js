// Testes das regras do aparelho que não dependem do servidor.
import { describe, expect, it } from 'vitest';
import { bairroDoCep, brl, km } from '../estado/formato.js';
import { paraMotor, perguntas, respondido, respostasVazias } from '../estado/perguntas.js';
import { numeroFalado, palavras } from '../estado/voz.js';

describe('formatação', () => {
  it('reais como o Intl pt-BR', () => { expect(brl(1621)).toBe('R$ 1.621'); expect(brl(405.25, true)).toBe('R$ 405,25'); });
  it('CEP do território cai no bairro certo', () => { expect(bairroDoCep('04938-000')).toBe('Jardim Ângela'); expect(bairroDoCep('05845-000')).toBe('Jardim São Luís'); expect(bairroDoCep('01000-000')).toBeNull(); });
  it('distância em km', () => { expect(km([-23.71, -46.77], [-23.71, -46.77])).toBe(0); expect(km([-23.71, -46.77], [-23.66, -46.73])).toBeGreaterThan(5); });
});

describe('triagem', () => {
  it('tem 10 perguntas e muda o texto para outra pessoa', () => { expect(perguntas(false)).toHaveLength(10); expect(perguntas(true)[1].t).toContain('da pessoa'); });
  it('CEP só conta como respondido com bairro', () => { const q = perguntas(false)[9]; expect(respondido(q, { ...respostasVazias(), cep: '04938-000' })).toBe(false); expect(respondido(q, { ...respostasVazias(), bairro: 'Grajaú' })).toBe(true); });
  it('converte respostas para o motor', () => { const m = paraMotor({ ...respostasVazias(), renda: '760', idade: '67', grupos: ['c717', 'nen'] }); expect(m).toMatchObject({ renda: 760, idade: 67, criancas: 'sim', grupos: ['c717'] }); });
});

describe('voz', () => {
  it('entende números por extenso', () => { expect(palavras('mil e duzentos')).toBe(1200); expect(palavras('sessenta e sete anos')).toBe(67); });
  it('entende dígitos ditados', () => { expect(numeroFalado('uns 1.200 reais')).toBe(1200); expect(numeroFalado('setecentos e sessenta')).toBe(760); });
});
