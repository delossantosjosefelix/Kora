import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/variables.css';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-dark)',
          color: 'var(--color-white)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
        },
        success: {
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'var(--color-white)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'var(--color-white)',
          },
        },
      }}
    />
  </StrictMode>,
);
