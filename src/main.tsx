import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silently ignore Vite dev server WebSocket disconnect / reconnect notices
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  if (
    msg.includes('WebSocket') ||
    msg.includes('failed to connect to websocket') ||
    reason?.name === 'WebSocketClosedError'
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

