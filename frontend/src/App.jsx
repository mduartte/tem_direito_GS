// Rotas do app. Cidadão em "/", painel em "/painel", gestão em "/gestao" e unidade em "/config".
import { Navigate, Route, Routes } from 'react-router-dom';
import { sessaoPainel } from './api/cliente.js';
import { FiltroProvider } from './componentes/PainelShell.jsx';
import { useCidadao } from './estado/cidadao.jsx';
import { Inicio, Modo } from './telas/cidadao/Inicio.jsx';
import { Consentimento, Triagem } from './telas/cidadao/Triagem.jsx';
import { Detalhe, Resultado } from './telas/cidadao/Resultado.jsx';
import { Kit, Lembrete, OndeIr } from './telas/cidadao/Kit.jsx';
import { MeusDireitos, Negado, Perfil } from './telas/cidadao/MeusDireitos.jsx';
import { Apagar, Codigo, CriarConta, Privacidade } from './telas/cidadao/Conta.jsx';
import Duvidas from './telas/cidadao/Duvidas.jsx';
import { CodigoPainel, EntrarPainel, SolicitarAcesso } from './telas/painel/Acesso.jsx';
import { Automacoes, DetalheTriagem, Encaminhamentos, MapaDemanda, Relatorios, VisaoGeral } from './telas/painel/Painel.jsx';
import { Beneficios, Documentos, EditorRegras, Historico, Pontos, Simulador } from './telas/gestao/Gestao.jsx';
import { Equipe, Preferencias, Unidade } from './telas/config/Config.jsx';

/** Telas que só fazem sentido depois da triagem. */
function ComTriagem({ children }) {
  const { c } = useCidadao();
  return c.feito ? children : <Navigate to="/" replace />;
}
/** Telas do painel exigem sessão (login + segunda etapa). */
function ComSessao({ children }) {
  return sessaoPainel.token() ? <FiltroProvider>{children}</FiltroProvider> : <Navigate to="/painel/entrar" replace />;
}

export default function App() {
  const T = el => <ComTriagem>{el}</ComTriagem>;
  const P = el => <ComSessao>{el}</ComSessao>;
  return <Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/modo" element={<Modo />} />
    <Route path="/triagem" element={<Triagem />} />
    <Route path="/consentimento" element={<Consentimento />} />
    <Route path="/duvidas" element={<Duvidas />} />
    <Route path="/resultado" element={T(<Resultado />)} />
    <Route path="/beneficio/:id" element={T(<Detalhe />)} />
    <Route path="/kit" element={T(<Kit />)} />
    <Route path="/onde-ir" element={T(<OndeIr />)} />
    <Route path="/lembrete" element={T(<Lembrete />)} />
    <Route path="/meus-direitos" element={T(<MeusDireitos />)} />
    <Route path="/negado/:id" element={T(<Negado />)} />
    <Route path="/perfil" element={T(<Perfil />)} />
    <Route path="/conta" element={<CriarConta />} />
    <Route path="/entrar" element={<CriarConta entrar />} />
    <Route path="/codigo" element={<Codigo />} />
    <Route path="/privacidade" element={<Privacidade />} />
    <Route path="/apagar" element={<Apagar />} />
    <Route path="/acesso" element={<SolicitarAcesso />} />
    <Route path="/painel/entrar" element={<EntrarPainel />} />
    <Route path="/painel/codigo" element={<CodigoPainel />} />
    <Route path="/painel" element={P(<VisaoGeral />)} />
    <Route path="/painel/mapa" element={P(<MapaDemanda />)} />
    <Route path="/painel/encaminhamentos" element={P(<Encaminhamentos />)} />
    <Route path="/painel/encaminhamentos/:codigo" element={P(<DetalheTriagem />)} />
    <Route path="/painel/relatorios" element={P(<Relatorios />)} />
    <Route path="/painel/automacoes" element={P(<Automacoes />)} />
    <Route path="/gestao/beneficios" element={P(<Beneficios />)} />
    <Route path="/gestao/regras" element={P(<EditorRegras />)} />
    <Route path="/gestao/simulador" element={P(<Simulador />)} />
    <Route path="/gestao/documentos" element={P(<Documentos />)} />
    <Route path="/gestao/historico" element={P(<Historico />)} />
    <Route path="/gestao/pontos" element={P(<Pontos />)} />
    <Route path="/config/unidade" element={P(<Unidade />)} />
    <Route path="/config/equipe" element={P(<Equipe />)} />
    <Route path="/config/preferencias" element={P(<Preferencias />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
