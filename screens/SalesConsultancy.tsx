import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Key, Banknote, Handshake, Landmark, Percent, Car } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

const SalesConsultancy: React.FC = () => {
   const navigate = useNavigate();

   return (
      <div className="min-h-screen bg-black pb-24 animate-fade-in">
         {/* Header */}
         <div className="p-5 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-md z-20">
            <button onClick={() => navigate(-1)} className="text-white"><ArrowLeft /></button>
            <h1 className="text-white font-bold uppercase tracking-widest text-sm">Parcerias</h1>
            <div className="w-6" />
         </div>

         <div className="p-5 space-y-8">

            {/* TL+Crédito Highlight - Strategic Partnership */}
            <div className="bg-gradient-to-r from-blue-900/40 to-obsidian-900 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Landmark size={80} className="text-blue-400" />
               </div>

               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                     <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Parceiro Oficial</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">TL+Crédito</h2>
                  <p className="text-blue-200 text-sm font-medium mb-4">Soluções Financeiras & Consórcios</p>

                  <div className="space-y-3 mb-6">
                     <div className="flex items-start gap-3">
                        <div className="bg-blue-900/50 p-1.5 rounded text-blue-400 mt-0.5"><Percent size={14} /></div>
                        <div>
                           <h4 className="text-white font-bold text-sm">Empréstimos Consignados</h4>
                           <p className="text-gray-400 text-xs">Todos os tipos disponiveis para você.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="bg-blue-900/50 p-1.5 rounded text-blue-400 mt-0.5"><Car size={14} /></div>
                        <div>
                           <h4 className="text-white font-bold text-sm">Consórcios de Veículos</h4>
                           <p className="text-gray-400 text-xs">Planeje seu carro novo com segurança.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="bg-blue-900/50 p-1.5 rounded text-blue-400 mt-0.5"><Banknote size={14} /></div>
                        <div>
                           <h4 className="text-white font-bold text-sm">Empréstimo com Garantia</h4>
                           <p className="text-gray-400 text-xs">Use seu veículo como garantia para melhores taxas.</p>
                        </div>
                     </div>
                  </div>

                  <Button
                     className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20"
                     onClick={() => window.open('https://wa.me/?text=Olá,%20tenho%20interesse%20no%20Consórcio%20TL+Crédito', '_blank')}
                  >
                     SIMULAR CONSÓRCIO
                  </Button>
               </div>
            </div>

            {/* Other Partners Section Placeholder (Future) */}
            <div className="text-center space-y-2 pt-8 border-t border-white/10">
               <p className="text-gray-500 text-xs">
                  Em breve mais parceiros exclusivos.
               </p>
            </div>
         </div>
      </div>
   );
};

export default SalesConsultancy;