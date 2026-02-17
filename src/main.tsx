import { StrictMode } from 'react';
import { pdfjs } from 'react-pdf';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n.js';

// Настройка PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
