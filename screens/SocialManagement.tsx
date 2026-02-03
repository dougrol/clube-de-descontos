import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, Users, Target, Shield, GraduationCap } from 'lucide-react';
import { Button, Badge } from '../components/ui';

const SocialManagement: React.FC = () => {
   const navigate = useNavigate();

   return (
      <div className="min-h-screen bg-black pb-24 animate-fade-in">
         {/* Stylish Header */}
         <div className="bg-gradient-to-b from-purple-900/20 to-black pt-10 pb-10 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

            <button onClick={() => navigate(-1)} className="text-white mb-6 relative z-10"><ArrowLeft /></button>

            <div className="relative z-10">
               <div className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-purple-500/20 mb-4">
                  B2B Services
               </div>
               <h1 className="text-3xl font-serif font-bold text-white mb-2">
                  Consultoria para <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Associações</span>
               </h1>
               <p className="text-gray-400 text-sm max-w-[90%]">
                  Gestão completa, marketing e treinamentos corporativos para o mercado de Proteção Veicular.
               </p>
            </div>
         </div>

         <div className="px-6 space-y-8">

            {/* Official Partners / Authority */}
            <div className="border-y border-white/5 py-6">
               <p className="text-center text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">Parceiros Oficiais & Cases</p>
               <div className="flex justify-center gap-3">
                  <div className="bg-obsidian-800 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-2 min-w-[130px] justify-center shadow-lg">
                     <Shield size={18} className="text-blue-500" />
                     <span className="font-bold text-white tracking-wider text-sm">PROTBEM</span>
                  </div>
                  <div className="bg-obsidian-800 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-2 min-w-[130px] justify-center shadow-lg">
                     <Shield size={18} className="text-green-500" />
                     <span className="font-bold text-white tracking-wider text-sm">ELEVAMAIS</span>
                  </div>
               </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between pb-2">
               <div className="text-center">
                  <p className="text-2xl font-bold text-white">+50</p>
                  <p className="text-[10px] text-gray-500 uppercase">Associações</p>
               </div>
               <div className="text-center border-l border-white/10 pl-6">
                  <p className="text-2xl font-bold text-white">+10k</p>
                  <p className="text-[10px] text-gray-500 uppercase">Vendas/Mês</p>
               </div>
               <div className="text-center border-l border-white/10 pl-6">
                  <p className="text-2xl font-bold text-white">360º</p>
                  <p className="text-[10px] text-gray-500 uppercase">Soluções</p>
               </div>
            </div>

            {/* Services List */}
            <div className="space-y-6">
               <h3 className="text-white font-bold text-sm border-l-2 border-purple-500 pl-3">O que entregamos</h3>

               <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-obsidian-800 flex items-center justify-center flex-shrink-0 text-gold-500 border border-white/5">
                     <GraduationCap size={24} />
                  </div>
                  <div>
                     <h3 className="text-white font-bold">Treinamento Corporativo</h3>
                     <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Capacitação especializada para <span className="text-white font-medium">Consultores e Gestores</span>.
                        Do script de vendas e quebra de objeções à liderança de alta performance.
                     </p>
                     <div className="flex gap-2 mt-2">
                        <Badge variant="dark">Consultores</Badge>
                        <Badge variant="dark">Gestores</Badge>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-obsidian-800 flex items-center justify-center flex-shrink-0 text-pink-500 border border-white/5">
                     <Instagram size={24} />
                  </div>
                  <div>
                     <h3 className="text-white font-bold">Gestão de Redes Sociais</h3>
                     <p className="text-gray-400 text-xs mt-1 leading-relaxed">Design premium e estratégia de conteúdo para posicionar sua associação como líder de mercado.</p>
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-obsidian-800 flex items-center justify-center flex-shrink-0 text-blue-500 border border-white/5">
                     <Target size={24} />
                  </div>
                  <div>
                     <h3 className="text-white font-bold">Tráfego Pago (Ads)</h3>
                     <p className="text-gray-400 text-xs mt-1 leading-relaxed">Geração de leads qualificados (Google & Meta) focados na sua região de atuação.</p>
                  </div>
               </div>
            </div>

            {/* CTA Box */}
            <div className="bg-gradient-to-r from-obsidian-800 to-obsidian-900 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users size={100} />
               </div>
               <h3 className="text-white font-bold text-lg mb-2 relative z-10">Solicite uma Consultoria</h3>
               <p className="text-gray-400 text-xs mb-6 relative z-10 max-w-[80%]">
                  Junte-se à PROTBEM, ELEVAMAIS e outras gigantes que confiam na Tavares Car.
               </p>
               <Button className="relative z-10 bg-white text-black hover:bg-gray-200 border-none shadow-none">
                  FALAR COM ESPECIALISTA
               </Button>
            </div>
         </div>
      </div>
   );
};

export default SocialManagement;