import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Suprimir advertencias de React Router
const originalConsoleWarn = console.warn;
console.warn = (message, ...args) => {
  if (/React Router Future Flag Warning/.test(message)) {
    return;
  }
  originalConsoleWarn(message, ...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router basename="/App_Quiz">  {/* Solo usa el nombre del repositorio */}
      <App />
    </Router>
  </StrictMode>,
);