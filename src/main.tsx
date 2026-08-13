import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress transient IndexedDB/Firebase "Database is closing/hidden" errors during iframe tab hidden/sleeping states
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    reason.includes('Database is closing') ||
    reason.includes('closing/hidden') ||
    reason.includes('IndexedDB') ||
    reason.includes('database is closing')
  ) {
    event.preventDefault();
    console.warn('[Handled transient DB closing/hidden event]:', reason);
  }
});

window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.includes('Database is closing') ||
    msg.includes('closing/hidden') ||
    msg.includes('IndexedDB')
  ) {
    event.preventDefault();
    console.warn('[Handled transient DB closing/hidden error]:', msg);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
