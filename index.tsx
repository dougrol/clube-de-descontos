import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Força a remoção de Service Workers antigos e limpa o cache para garantir atualizações nos celulares (PWA instalado)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      let unregistered = false;
      const unregisterPromises = registrations.map(registration => 
        registration.unregister().then(success => {
          if (success) unregistered = true;
        })
      );
      
      Promise.all(unregisterPromises).then(() => {
        if (unregistered && 'caches' in window) {
          // Limpa todos os caches salvos pelo Workbox/VitePWA para forçar download do zero
          caches.keys().then(cacheNames => {
            Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
              .then(() => {
                // Força o reload da página após limpar tudo
                window.location.reload();
              });
          });
        }
      });
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