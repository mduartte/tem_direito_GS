// Ponto de entrada: estilos do protótipo, estado do cidadão e roteador.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CidadaoProvider } from './estado/cidadao.jsx';
import './estilos/prototipo.css';
import './estilos/ajustes.css';

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CidadaoProvider>
        <App />
      </CidadaoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
