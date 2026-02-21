import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, Landmark, Percent, Car, MapPin, Tag, Loader2 } from 'lucide-react';
import { fetchPartners } from '../services/partners';
import { Partner } from '../types';
import { Button, Card } from '../components/ui';

const SalesConsultancy: React.FC = () => {
   const navigate = useNavigate();
   const [partners, setPartners] = React.useState<Partner[]>([]);
   const [loading, setLoading] = React.useState(true);

   React.useEffect(() => {
     fetchPartners().then(data => {
       // Only show active partners
       const filtered = data.filter(p => p.active !== false && p.status === 'active');
       // Sort by priority (desc) or destaque
       filtered.sort((a, b) => {
         if (a.plan === 'destaque' && b.plan !== 'destaque') return -1;
         if (a.plan !== 'destaque' && b.plan === 'destaque') return 1;
         return (b.priority || 0) - (a.priority || 0);
       });
       setPartners(filtered);
       setLoading(false);
     });
   }, []);

   return (
      <div className="min-h-screen bg-black pb-24 animate-fade-in">
         {/* Header */}
         <div className="p-5 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-md z-20">
            <button onClick={() => navigate(-1)} className="text-theme-text"><ArrowLeft /></button>
            <h1 className="text-theme-text font-bold uppercase tracking-widest text-sm">Parcerias</h1>
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
                  <h2 className="text-2xl font-bold text-theme-text mb-1">TL+Crédito</h2>
                  <p className="text-blue-200 text-sm font-medium mb-4">Soluções Financeiras & Consórcios</p>

                  <div className="space-y-3 mb-6">
                     <div className="flex items-start gap-3">
                        <div className="bg-blue-900/50 p-1.5 rounded text-blue-400 mt-0.5"><Percent size={14} /></div>
                        <div>
                           <h4 className="text-theme-text font-bold text-sm">Empréstimos Consignados</h4>
                           <p className="text-theme-muted text-xs">Todos os tipos disponiveis para você.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="bg-blue-900/50 p-1.5 rounded text-blue-400 mt-0.5"><Car size={14} /></div>
                        <div>
                           <h4 className="text-theme-text font-bold text-sm">Consórcios de Veículos</h4>
                           <p className="text-theme-muted text-xs">Planeje seu carro novo com segurança.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="bg-blue-900/50 p-1.5 rounded text-blue-400 mt-0.5"><Banknote size={14} /></div>
                        <div>
                           <h4 className="text-theme-text font-bold text-sm">Empréstimo com Garantia</h4>
                           <p className="text-theme-muted text-xs">Use seu veículo como garantia para melhores taxas.</p>
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

            {/* Dynamic Partners List */}
            <div className="space-y-4">
               <h3 className="text-theme-text font-bold text-sm uppercase tracking-widest mb-4">Nossos Parceiros</h3>
               
               {loading ? (
                  <div className="flex justify-center py-10 text-gold-500">
                     <Loader2 className="animate-spin" size={24} />
                  </div>
               ) : partners.length === 0 ? (
                  <div className="text-center py-10 text-theme-muted">
                     <p className="text-xs italic">Em breve mais parceiros exclusivos.</p>
                  </div>
               ) : (
                  partners.map((partner) => (
                     <Card key={partner.id} onClick={() => navigate(`/benefits/${partner.id}`)} className="flex gap-4 p-3 group border-l-4 border-l-transparent hover:border-l-gold-500 transition-all bg-obsidian-900/50 hover:bg-obsidian-900 border-y border-y-transparent hover:border-y-white/5 cursor-pointer">
                        <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                           <img
                              src={partner.logoUrl || 'https://placehold.co/200x200/1a1a1a/d4af37?text=TC'}
                              alt={partner.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           />
                           {partner.plan === 'destaque' && (
                              <div className="absolute top-0 right-0 bg-gold-500 text-black text-[7px] font-black px-1 py-0.5 rounded-bl-lg shadow-lg uppercase tracking-tighter">
                                 Oficial
                              </div>
                           )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                           <div>
                              <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-theme-text text-sm leading-tight mb-1">{partner.name}</h4>
                                 {partner.benefit.includes("%") && (
                                    <Tag size={12} className="text-gold-500" />
                                 )}
                              </div>
                              <div className="flex items-center text-theme-muted text-[10px] gap-1 mb-1">
                                 <MapPin size={10} /> {partner.city}
                              </div>
                              <p className="text-xs text-theme-muted line-clamp-2 leading-tight">{partner.description}</p>
                           </div>
                           <div className="mt-1 flex items-center justify-between">
                              <div className="text-gold-500 text-[10px] font-bold bg-gold-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gold-500/20">
                                 {partner.benefit}
                              </div>
                           </div>
                        </div>
                     </Card>
                  ))
               )}
            </div>

            {/* Footer */}
            <div className="text-center pt-8 opacity-40">
               <p className="text-theme-muted text-[10px] uppercase tracking-widest font-medium">
                  Tavares Car &copy; 2024
               </p>
            </div>
         </div>
      </div>
   );
};

export default SalesConsultancy;