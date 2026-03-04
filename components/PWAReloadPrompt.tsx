import React from 'react';
// @ts-expect-error - plugin provides this virtual module
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: unknown) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-fade-in-up">
      <div className="bg-zinc-900 border border-gold-500/30 rounded-lg shadow-2xl p-4 max-w-sm w-full relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gold-500 animate-spin-slow" />
              Atualização Disponível
            </h3>
            <button 
              onClick={close}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-zinc-400 text-sm mb-4">
            Uma nova versão do Tavares Car está disponível. Atualize para ver as novidades!
          </p>
          
          <div className="flex gap-2">
            <button
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-black font-semibold py-2 px-4 rounded-md transition-colors text-sm"
              onClick={() => updateServiceWorker(true)}
            >
              Atualizar Agora
            </button>
            <button
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-4 rounded-md border border-zinc-700 transition-colors text-sm"
              onClick={close}
            >
              Mais Tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
