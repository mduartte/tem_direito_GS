// Ponto de entrada: estilos do protótipo, estado do cidadão e roteador.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CidadaoProvider } from './estado/cidadao.jsx';
// Fontes do tema v2 servidas pelo próprio app (funcionam offline na PWA).
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import './estilos/prototipo.css';
import './estilos/ajustes.css';
import './estilos/tema-tech.css';

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CidadaoProvider>
        <App />
      </CidadaoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
