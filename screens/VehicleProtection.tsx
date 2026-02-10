import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Truck, Siren, CheckCircle2, Star, Shield, Loader2, Car, Bike, Calculator, ArrowRight } from 'lucide-react';
import { Button, Badge, ImageWithFallback } from '../components/ui';
import { supabase } from '../services/supabaseClient';

interface ProtectionPlan {
   id: string;
   name: string;
   price: number;
   features: string[];
   is_popular: boolean;
   active: boolean;
   display_order: number;
}

const Protection: React.FC = () => {
   const navigate = useNavigate();
   const [plans, setPlans] = useState<ProtectionPlan[]>([]);
   const [loading, setLoading] = useState(true);
   const [step, setStep] = useState<'vehicle-select' | 'plans'>('vehicle-select');
   const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

   useEffect(() => {
      fetchPlans();
   }, []);

   const fetchPlans = async () => {
      try {
         const { data, error } = await supabase
            .from('protection_plans')
            .select('*')
            .eq('active', true)
            .order('display_order', { ascending: true });

         if (error) throw error;
         setPlans(data || []);
      } catch (error) {
         console.error('Erro ao buscar planos:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleVehicleSelect = (type: string) => {
      setSelectedVehicle(type);
      setStep('plans');
   };

   return (
      <div className="min-h-screen bg-obsidian-950 pb-24 animate-fade-in">
         {/* Hero Compacto */}
         <div className="bg-obsidian-900 border-b border-white/5 pt-12 pb-6 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="flex items-center gap-4 relative z-10 mb-4">
               <button onClick={() => step === 'plans' ? setStep('vehicle-select') : navigate(-1)} className="p-2 bg-white/5 rounded-full text-white">
                  <ArrowLeft size={20} />
               </button>
               <h1 className="text-xl font-bold text-white">Simulação Online</h1>
            </div>

            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                  <span className={`w-8 h-1 rounded-full ${step === 'vehicle-select' ? 'bg-blue-500' : 'bg-blue-900'}`}></span>
                  <span className={`w-8 h-1 rounded-full ${step === 'plans' ? 'bg-blue-500' : 'bg-gray-800'}`}></span>
               </div>
               <p className="text-gray-400 text-xs">
                  {step === 'vehicle-select' ? 'Passo 1: Identificação' : 'Passo 2: Planos Recomendados'}
               </p>
            </div>
         </div>

         <div className="px-5 pt-8 space-y-8">

            {step === 'vehicle-select' && (
               <div className="animate-slide-up">
                  <h2 className="text-2xl font-bold text-white mb-2">Qual seu veículo?</h2>
                  <p className="text-gray-400 text-sm mb-8">Selecione o tipo para ver os planos ideais.</p>

                  <div className="grid grid-cols-1 gap-4">
                     <button
                        onClick={() => handleVehicleSelect('Carro')}
                        className="bg-obsidian-900 border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all hover:bg-blue-900/10"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                              <Car size={24} />
                           </div>
                           <div className="text-left">
                              <h3 className="text-white font-bold text-lg">Carro / SUV</h3>
                              <p className="text-gray-500 text-xs">Uso particular ou app</p>
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors">
                           <ArrowRight size={16} className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                     </button>

                     <button
                        onClick={() => handleVehicleSelect('Moto')}
                        className="bg-obsidian-900 border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all hover:bg-blue-900/10"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                              <Bike size={24} />
                           </div>
                           <div className="text-left">
                              <h3 className="text-white font-bold text-lg">Motocicleta</h3>
                              <p className="text-gray-500 text-xs">Todas as cilindradas</p>
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors">
                           <ArrowRight size={16} className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                     </button>

                     <button
                        onClick={() => handleVehicleSelect('Pesado')}
                        className="bg-obsidian-900 border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all hover:bg-blue-900/10"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                              <Truck size={24} />
                           </div>
                           <div className="text-left">
                              <h3 className="text-white font-bold text-lg">Pesados</h3>
                              <p className="text-gray-500 text-xs">Caminhões e Utilitários</p>
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors">
                           <ArrowRight size={16} className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                     </button>
                  </div>

                  <div className="mt-8 bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex gap-3 text-blue-200 text-xs">
                     <ShieldCheck className="shrink-0" size={18} />
                     <p>Ao continuar, você concorda com nossos termos de proteção de dados.</p>
                  </div>
               </div>
            )}

            {step === 'plans' && (
               <div className="animate-slide-up">
                  <div className="flex justify-between items-end mb-6">
                     <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Veículo Selecionado</p>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                           {selectedVehicle}
                           <button onClick={() => setStep('vehicle-select')} className="text-xs text-blue-400 font-normal underline">Alterar</button>
                        </h2>
                     </div>
                  </div>

                  {loading ? (
                     <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                     </div>
                  ) : (
                     <div className="space-y-6">
                        {plans.map((plan) => (
                           <div
                              key={plan.id}
                              className={`relative bg-obsidian-800 rounded-2xl p-6 border transition-all ${plan.is_popular ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50' : 'border-white/5'}`}
                           >
                              {plan.is_popular && (
                                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 shadow-lg">
                                    <Star size={10} fill="white" /> Recomendado
                                 </div>
                              )}

                              <div className="flex justify-between items-start mb-6 mt-2">
                                 <div>
                                    <h4 className="font-bold text-xl text-white">{plan.name}</h4>
                                    <p className="text-gray-500 text-xs mt-1">Cobertura Nacional</p>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-xs text-gray-400 block">Mensalidade</span>
                                    <span className="text-2xl font-bold text-white">R$ {plan.price.toFixed(0)}</span>
                                    <span className="text-xs text-gray-500">,00</span>
                                 </div>
                              </div>

                              <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl">
                                 {plan.features.slice(0, 4).map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                       <div className="bg-blue-500/20 p-1 rounded-full text-blue-400">
                                          <CheckCircle2 size={12} strokeWidth={3} />
                                       </div>
                                       <span className="text-gray-300 text-sm font-medium">{feat}</span>
                                    </div>
                                 ))}
                                 {plan.features.length > 4 && (
                                    <p className="text-xs text-center text-gray-500 pt-2">+ {plan.features.length - 4} benefícios inclusos</p>
                                 )}
                              </div>

                              <Button
                                 className={`w-full py-4 rounded-xl font-bold text-sm shadow-none transition-all ${plan.is_popular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                                 onClick={() => window.open(`https://wa.me/5562982553770?text=Olá!%20Fiz%20a%20simulação%20para%20${selectedVehicle}%20e%20gostei%20do%20plano%20${plan.name}`, '_blank')}
                              >
                                 CONTRATAR AGORA
                              </Button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
         </div>

         {/* Partner Associations */}
         <div className="px-5 py-8 border-t border-white/5 mt-8">
            <p className="text-gray-600 text-[9px] uppercase tracking-[0.2em] text-center mb-4">
               Associações Parceiras
            </p>
            <div className="flex items-center justify-center gap-5">
               {[
                  { name: 'Elevamais', logo: 'https://elevamais.org/wp-content/uploads/2025/05/Foto-Capa-Branding-Elevamais-Protecao-Veicular.png' },
                  { name: 'AGV', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjxA4WhVJYldBDvC542WyVsqlPhdl2poQONw&s' },
                  { name: 'Autovale', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWN3TvLukevIdp8lse0L3FeEIz6YOWGw-Tcg&s' }
               ].map((partner, index) => (
                  <div key={index} className="flex flex-col items-center">
                     <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white p-2 shadow-lg">
                        <ImageWithFallback
                           src={partner.logo}
                           alt={partner.name}
                           className="w-full h-full rounded-full"
                           objectFit="contain"
                           showSkeleton={true}
                        />
                     </div>
                     <span className="text-gray-500 text-[8px] mt-1.5 uppercase tracking-wider font-medium">{partner.name}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default Protection;