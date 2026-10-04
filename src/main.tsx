import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { aplicarTema, useApp } from './store';
import './index.css';

aplicarTema(useApp.getState().tema);
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => aplicarTema(useApp.getState().tema));

if (!__SINGLE__) {
  // El service worker solo existe en el build PWA (no en el archivo único ni en desarrollo).
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
