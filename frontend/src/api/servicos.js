// Funções por recurso da API. Os nomes seguem o domínio em português.
import { api, apiPainel } from './cliente.js';

const q = o => { const p = new URLSearchParams(); Object.entries(o || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); }); const s = p.toString(); return s ? '?' + s : ''; };

export const triagemApi = {
  avaliar: respostas => api('/triagens/avaliar', { metodo: 'POST', corpo: respostas, tempo: 20000 }),
  registrar: (dados, token) => api('/triagens', { metodo: 'POST', corpo: dados, token, tempo: 20000 }),
  consultar: (codigo, chave) => api(`/triagens/${codigo}`, { chave }),
  atualizar: (codigo, chave, corpo) => api(`/triagens/${codigo}`, { metodo: 'PATCH', corpo, chave }),
  lembrete: (codigo, chave, corpo) => api(`/triagens/${codigo}/lembretes`, { metodo: 'POST', corpo, chave }),
  lida: (codigo, chave, id) => api(`/triagens/${codigo}/notificacoes/${id}/lida`, { metodo: 'POST', chave }),
  apagar: (codigo, chave) => api(`/triagens/${codigo}`, { metodo: 'DELETE', chave })
};

export const atendimentoApi = {
  cep: cep => api(`/cep/${cep}`, { tempo: 15000 }),
  bairros: () => api('/bairros'),
  pontos: tipo => api('/pontos' + q({ tipo })),
  perto: (lat, lng, tipo) => api('/pontos/perto' + q({ lat, lng, tipo })),
  local: (cidade, uf, bairro, rua) => api('/local' + q({ cidade, uf, bairro, rua }), { tempo: 30000 })
};

export const contaApi = {
  codigo: corpo => api('/contas/codigo', { metodo: 'POST', corpo }),
  confirmar: corpo => api('/contas/confirmar', { metodo: 'POST', corpo }),
  eu: token => api('/contas/eu', { token }),
  atualizar: (token, corpo) => api('/contas/eu', { metodo: 'PATCH', corpo, token }),
  vincular: (token, codigo, chave) => api(`/contas/eu/triagens/${codigo}`, { metodo: 'POST', token, chave }),
  dados: token => api('/contas/eu/dados', { token }),
  apagar: token => api('/contas/eu', { metodo: 'DELETE', token })
};

export const assistenteApi = {
  sugestoes: () => api('/assistente/sugestoes', { tempo: 90000 }),
  perguntar: corpo => api('/assistente/perguntar', { metodo: 'POST', corpo }),
  transcrever: arquivo => { const f = new FormData(); f.append('audio', arquivo); return api('/assistente/transcrever', { metodo: 'POST', corpo: f }); }
};

export const authPainelApi = {
  login: corpo => api('/auth/painel/login', { metodo: 'POST', corpo }),
  verificar: corpo => api('/auth/painel/verificar', { metodo: 'POST', corpo }),
  reenviar: corpo => api('/auth/painel/reenviar', { metodo: 'POST', corpo }),
  solicitarAcesso: corpo => api('/acesso/solicitar', { metodo: 'POST', corpo })
};

export const painelApi = {
  visao: f => apiPainel('/painel/visao-geral' + q(f)),
  mapa: f => apiPainel('/painel/mapa' + q(f)),
  encaminhamentos: f => apiPainel('/painel/encaminhamentos' + q(f)),
  detalhe: c => apiPainel(`/painel/triagens/${c}`),
  atualizar: (c, corpo) => apiPainel(`/painel/triagens/${c}`, { metodo: 'PATCH', corpo }),
  avisar: (c, texto) => apiPainel(`/painel/triagens/${c}/avisar`, { metodo: 'POST', corpo: { texto } }),
  csv: f => apiPainel('/painel/relatorios/bairros.csv' + q(f), { bruto: true }),
  automacoes: () => apiPainel('/painel/automacoes'),
  executar: t => apiPainel(`/painel/automacoes/${t}/executar`, { metodo: 'POST' })
};

export const gestaoApi = {
  beneficios: () => apiPainel('/gestao/beneficios'),
  ativar: (id, ativo) => apiPainel(`/gestao/beneficios/${id}`, { metodo: 'PATCH', corpo: { ativo } }),
  regras: () => apiPainel('/gestao/regras'),
  rascunho: (chave, campos) => apiPainel(`/gestao/regras/${chave}/rascunho`, { metodo: 'PUT', corpo: campos }),
  descartar: chave => apiPainel(`/gestao/regras/${chave}/rascunho`, { metodo: 'DELETE' }),
  simular: corpo => apiPainel('/gestao/simular', { metodo: 'POST', corpo }),
  publicar: (chave, corpo) => apiPainel(`/gestao/regras/${chave}/publicar`, { metodo: 'POST', corpo }),
  historico: () => apiPainel('/gestao/historico'),
  documentos: () => apiPainel('/gestao/documentos'),
  salvarDocumentos: (id, corpo) => apiPainel(`/gestao/documentos/${id}`, { metodo: 'PUT', corpo }),
  pontos: () => apiPainel('/gestao/pontos'),
  salvarPonto: (id, corpo) => apiPainel(`/gestao/pontos/${id}`, { metodo: 'PUT', corpo }),
  removerPonto: id => apiPainel(`/gestao/pontos/${id}`, { metodo: 'DELETE' })
};

export const configApi = {
  unidade: () => apiPainel('/config/unidade'),
  salvarUnidade: corpo => apiPainel('/config/unidade', { metodo: 'PUT', corpo }),
  equipe: () => apiPainel('/config/equipe'),
  convidar: corpo => apiPainel('/config/equipe', { metodo: 'POST', corpo }),
  alterar: (id, corpo) => apiPainel(`/config/equipe/${id}`, { metodo: 'PATCH', corpo }),
  solicitacoes: () => apiPainel('/config/solicitacoes')
};
