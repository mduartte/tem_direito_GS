// Formatação igual à do protótipo (Intl pt-BR), para os textos baterem com o motor Java.
export const brl = (v, centavos) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: centavos ? 2 : 0, maximumFractionDigits: centavos ? 2 : 0 });
export const fmtN = v => Number(v || 0).toLocaleString('pt-BR');
export const dmy = d => { d = new Date(d); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
export const dmyy = d => { d = new Date(d); return dmy(d) + '/' + d.getFullYear(); };
export const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const diaCurto = d => { d = new Date(d); return DIAS[d.getDay()].replace('-feira', '') + ', ' + dmy(d); };
export const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const addDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const isoDia = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const quando = d => { const n = Math.round((hoje() - new Date(new Date(d).setHours(0, 0, 0, 0))) / 864e5); return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`; };
export const fmtMi = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toFixed(1).replace('.', ',') + ' mi' : v >= 1e3 ? 'R$ ' + Math.round(v / 1e3) + ' mil' : brl(v);
export const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

/** Status do motor → rótulo e cor da etiqueta (mesma tabela ST do protótipo). */
export const ST = { prov: ['Provável', 'brand'], pode: ['Pode usar', 'pos'], tem: ['Já tem', 'neutral'], ver: ['Verificar', 'warn'], nao: ['Não se aplica', ''] };
export const ativos = res => (res || []).filter(b => ['prov', 'pode', 'ver'].includes(b.status));
export const CATS = ["Renda", "Contas da casa", "Saúde", "Educação e trabalho", "Transporte", "Moradia e alimentação", "Documentos e descontos", "Outros"];
export const ETAPAS = { triagem: 'Triagem concluída', kit: 'Kit do Direito enviado', agendado: 'Cadastro Único agendado', atendido: 'Atendido no CRAS', conseguiu: 'Benefício concedido', travado: 'Travado' };
export const BEN_NOME = { cad: 'Cadastro Único', bolsa: 'Bolsa Família', bpci: 'BPC Idoso', bpcp: 'BPC PcD', tar: 'Tarifa Social de Energia', farm: 'Farmácia Popular', desc: 'Desconto Social de Energia', gas: 'Gás do Povo', agua: 'Tarifa Social de Água', pdm: 'Pé-de-Meia', dign: 'Dignidade Menstrual', idj: 'ID Jovem', cpi: 'Carteira da Pessoa Idosa', mcmv: 'Minha Casa, Minha Vida', abono: 'Abono salarial', segd: 'Seguro-desemprego', incl: 'Auxílio-Inclusão', isen: 'Isenção de taxas', prouni: 'Prouni', fies: 'Fies Social', plpcd: 'Passe Livre PcD', sup: 'SuperAção SP', bom: 'Bom Prato', ple: 'Passe Livre Estudantil', tid: 'Transporte grátis 60+', bupcd: 'Bilhete Único Especial PcD', ctd: 'Cartão do Desempregado', mae: 'Mãe Paulistana', pot: 'POT' };
export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
/** Bairros do território do CRAS do piloto (mapa de demanda do painel). */
export const BAIRROS = ['Jardim Ângela', 'Capão Redondo', 'Grajaú', 'Parelheiros', 'Jardim São Luís', 'Campo Limpo'];

/** Faixas de CEP do piloto (bairroDoCep do protótipo): só a reserva para quando não há rede. */
export function bairroDoCep(cep) {
  const n = parseInt(String(cep).replace(/\D/g, '').slice(0, 5), 10);
  if (isNaN(n)) return null;
  if (n >= 4930 && n <= 4949) return 'Jardim Ângela';
  if (n >= 5860 && n <= 5879) return 'Capão Redondo';
  if (n >= 4820 && n <= 4859) return 'Grajaú';
  if (n >= 4880 && n <= 4899) return 'Parelheiros';
  if ((n >= 5840 && n <= 5859) || (n >= 4900 && n <= 4929)) return 'Jardim São Luís';
  if (n >= 5760 && n <= 5799) return 'Campo Limpo';
  return null;
}

/** Distância em km entre dois pontos (fórmula de haversine). */
export function km(a, b) {
  const r = x => x * Math.PI / 180, R = 6371;
  const dLat = r(b[0] - a[0]), dLng = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const fmtKm = k => k.toFixed(1).replace('.', ',') + ' km';
