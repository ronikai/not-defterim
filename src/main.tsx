import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource/jetbrains-mono/400.css';
import './index.css';
import App from './App';
import { StoreProvider } from './store/store';

const root = document.getElementById('root');
if (!root) throw new Error('root bulunamadı');

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* çevrimdışı destek kapalı */
    });
  });
}
