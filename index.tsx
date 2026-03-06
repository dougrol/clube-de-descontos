import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Força a remoção de Service Workers antigos/presos para garantir atualizações nos celulares
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(err => {
    console.error('Service worker unregister error:', err);
  });
}


const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);