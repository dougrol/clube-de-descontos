import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Truck, Siren, CheckCircle2, Star, Shield } from 'lucide-react';
import { Button, Badge } from '../components/ui';

const Protection: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Básico",
      price: "69,90",
      features: ["Roubo e Furto", "Guincho 200km", "Assistência 24h"],
      popular: false
    },
    {
      name: "Ouro",
      price: "99,90",
      features: ["Colisão (PT)", "Roubo e Furto", "Guincho 500km", "Carro Reserva (7 dias)", "Vidros e Faróis"],
      popular: true
    },
    {
      name: "Premium",
      price: "149,90",
      features: ["Cobertura Completa", "Guincho Ilimitado", "Carro Reserva (15 dias)", "Danos a Terceiros (R$ 50k)", "Rastreamento Incluso"],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-black pb-24 animate-fade-in">
      {/* Hero */}
      <div className="relative h-[35vh] w-full">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
         
         <div className="absolute top-4 left-4 z-20">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/50 rounded-full text-white backdrop-blur-md">
              <ArrowLeft size={24} />
            </button>
         </div>

         <div className="absolute bottom-0 left-0 p-6 w-full z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/30 backdrop-blur-md mb-4">
               <ShieldCheck size={14} className="text-gold-500" />
               <span className="text-gold-500 text-[10px] font-bold uppercase tracking-wider">Vendas Online</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white leading-tight">
              Proteção Veicular
            </h1>
            <p className="text-gray-400 text-xs mt-2 max-w-[80%]">
              Contrate agora a proteção ideal para seu veículo sem burocracia.
            </p>
         </div>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-8">
         
         {/* Trust Badges - PROTBEM & ELEVAMAIS */}
         <div className="bg-obsidian-900/80 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Garantia e Qualidade</p>
             <div className="flex gap-4 opacity-90">
                 <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-500 fill-blue-500/20" />
                    <span className="font-bold text-white text-xs">PROTBEM</span>
                 </div>
                 <div className="w-px h-4 bg-gray-700"></div>
                 <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-green-500 fill-green-500/20" />
                    <span className="font-bold text-white text-xs">ELEVAMAIS</span>
                 </div>
             </div>
         </div>

         {/* Sales Plans */}
         <section>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
               Planos Disponíveis <Badge variant="gold">Mensal</Badge>
            </h3>
            
            <div className="space-y-4">
               {plans.map((plan, idx) => (
                  <div 
                    key={idx} 
                    className={`relative bg-obsidian-800 rounded-2xl p-5 border ${plan.popular ? 'border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'border-white/5'}`}
                  >
                     {plan.popular && (
                        <div className="absolute -top-3 right-4 bg-gold-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                           <Star size={10} fill="black" /> Mais Vendido
                        </div>
                     )}
                     
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className={`font-bold text-lg ${plan.popular ? 'text-gold-500' : 'text-white'}`}>{plan.name}</h4>
                           <p className="text-gray-500 text-[10px] uppercase tracking-wider">A partir de</p>
                        </div>
                        <div className="text-right">
                           <span className="text-sm text-gray-400">R$</span>
                           <span className="text-2xl font-bold text-white">{plan.price}</span>
                           <span className="text-xs text-gray-500">/mês</span>
                        </div>
                     </div>

                     <div className="space-y-2 mb-5">
                        {plan.features.map((feat, i) => (
                           <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 size={14} className={plan.popular ? "text-gold-500" : "text-gray-600"} />
                              <span className="text-gray-300 text-sm">{feat}</span>
                           </div>
                        ))}
                     </div>

                     <Button 
                        variant={plan.popular ? 'primary' : 'outline'}
                        className={!plan.popular ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
                        onClick={() => window.open(`https://wa.me/?text=Tenho%20interesse%20no%20Plano%20${plan.name}%20de%20Proteção%20(Parceiro%20Tavares%20Car)`, '_blank')}
                     >
                        CONTRATAR AGORA
                     </Button>
                  </div>
               ))}
            </div>
         </section>

         {/* Benefits Grid Summary */}
         <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div className="bg-obsidian-900 p-3 rounded-xl border border-white/5 text-center">
               <Siren className="text-red-500 mx-auto mb-2" size={20} />
               <p className="text-white text-xs font-bold">Roubo e Furto</p>
               <p className="text-[10px] text-gray-500">100% FIPE</p>
            </div>
            <div className="bg-obsidian-900 p-3 rounded-xl border border-white/5 text-center">
               <Truck className="text-gold-500 mx-auto mb-2" size={20} />
               <p className="text-white text-xs font-bold">Guincho 24h</p>
               <p className="text-[10px] text-gray-500">Nacional</p>
            </div>
         </div>

         <p className="text-center text-[10px] text-gray-600 pb-4">
            * Valores estimados. O preço final pode variar de acordo com o modelo do veículo.
         </p>
      </div>
    </div>
  );
};

export default Protection;