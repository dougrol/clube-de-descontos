import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AvatarUpload } from '../components/ui';
import { LogOut, ChevronRight, User, Ticket, LifeBuoy, Crown, CheckCircle2, Key, ShoppingBag, BookOpen, CreditCard, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadAvatar, updateUserAvatar } from '../services/avatarService';
import { supabase } from '../services/supabaseClient';

interface ProfileProps {
   userRole: UserRole;
}

interface MenuOptionProps {
   icon: React.ElementType;
   label: string;
   subLabel?: string;
   onClick: () => void;
   color?: string;
}

const MenuOption: React.FC<MenuOptionProps> = ({ icon: Icon, label, subLabel, onClick, color = "text-white" }) => (
   <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-obsidian-900 border-b border-white/5 last:border-b-0 cursor-pointer active:bg-white/5 transition-colors"
   >
      <div className="flex items-center gap-4">
         <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800/50 ${color}`}>
            <Icon size={18} />
         </div>
         <div>
            <p className="text-white text-sm font-medium">{label}</p>
            {subLabel && <p className="text-gray-500 text-xs">{subLabel}</p>}
         </div>
      </div>
      <ChevronRight size={16} className="text-gray-600" />
   </div>
);

const Profile: React.FC<ProfileProps> = ({ userRole }) => {
   const navigate = useNavigate();
   const { user, signOut } = useAuth();
   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

   // Fetch avatar from database on mount
   useEffect(() => {
      const fetchAvatar = async () => {
         if (!user?.id) return;
         try {
            const { data } = await supabase
               .from('users')
               .select('avatar_url')
               .eq('id', user.id)
               .single();
            if (data?.avatar_url) setAvatarUrl(data.avatar_url);
         } catch (err) {
            console.error('Error fetching avatar:', err);
         }
      };
      fetchAvatar();
   }, [user?.id]);

   const handleLogout = async () => {
      const isAdmin = userRole === UserRole.ADMIN;
      const redirectUrl = isAdmin ? '/tc-portal-2024' : '/login';
      await signOut();
      window.location.href = window.location.origin + window.location.pathname + '#' + redirectUrl;
   }

   const handleAvatarUpload = async (file: File) => {
      if (!user?.id) return;
      try {
         const newUrl = await uploadAvatar(user.id, file);
         await updateUserAvatar(user.id, newUrl);
         setAvatarUrl(newUrl);
      } catch (error: unknown) {
         console.error('Avatar upload failed:', error);
         throw error;
      }
   };

   // Fallback data
   const userName = user?.user_metadata?.name || 'Membro Tavares';
   const userEmail = user?.email || 'email@exemplo.com';
   const userPlan = user?.user_metadata?.plan || 'Basic';
   const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=D4AF37&color=000';
   const displayAvatar = avatarUrl || defaultAvatar;



   return (
      <div className="min-h-screen bg-obsidian-950 pb-32 animate-fade-in">
         {/* Profile Header */}
         <div className="pt-8 pb-8 px-6 bg-gradient-to-b from-obsidian-900 to-obsidian-950 border-b border-white/5">
            <div className="flex flex-col items-center">
               <div className="relative mb-4">
                  <div className="p-1 bg-gradient-to-b from-gold-400 to-gold-700 rounded-full">
                     <AvatarUpload
                        currentImageUrl={displayAvatar}
                        onUpload={handleAvatarUpload}
                        size="lg"
                     />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-gold-500 text-black rounded-full p-1 border-4 border-obsidian-900">
                     <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
               </div>
               <h1 className="text-xl font-bold text-white mb-1">{userName}</h1>
               <p className="text-gray-500 text-sm mb-4">{userEmail}</p>

               {userRole !== UserRole.ADMIN && (
                  <div className="bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                     <Crown size={12} className="text-gold-500" />
                     <span className="text-gold-500 text-xs font-bold uppercase tracking-wide">Membro {userPlan}</span>
                  </div>
               )}
            </div>

            {/* Quick Stats / Actions */}
            <div className="grid grid-cols-3 gap-3 mt-8">
               <button onClick={() => navigate('/my-coupons')} className="bg-obsidian-800 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <Ticket className="text-orange-500" size={20} />
                  <span className="text-xs text-gray-400 font-medium">Cupons</span>
               </button>
               <button onClick={() => navigate('/consultancy')} className="bg-obsidian-800 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <BookOpen className="text-purple-500" size={20} />
                  <span className="text-xs text-gray-400 font-medium">Cursos</span>
               </button>
               <button onClick={() => navigate('/loja')} className="bg-obsidian-800 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <ShoppingBag className="text-emerald-500" size={20} />
                  <span className="text-xs text-gray-400 font-medium">Pedidos</span>
               </button>
            </div>
         </div>

         {/* Menu Groups */}
         <div className="px-5 mt-6 space-y-6">

            {/* Group 1: Account */}
            <div>
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 pl-2">Minha Conta</h3>
               <div className="rounded-xl overflow-hidden border border-white/5 bg-obsidian-900">
                  <MenuOption
                     icon={User}
                     label="Dados Pessoais"
                     subLabel="CPF, Telefone e Endereço"
                     onClick={() => navigate('/personal-data')}
                     color="text-blue-400"
                  />
                  <MenuOption
                     icon={Key}
                     label="Alterar Senha"
                     onClick={() => navigate('/forgot-password')}
                     color="text-yellow-400"
                  />
                  <MenuOption
                     icon={CreditCard}
                     label="Meu Plano"
                     subLabel="Gerenciar assinatura"
                     onClick={() => { }}
                     color="text-gold-400"
                  />
               </div>
            </div>

            {/* Group 1.5: Partner Controls (Conditional) */}
            {userRole === UserRole.PARTNER && (
               <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 pl-2 text-gold-500">Gestão de Loja</h3>
                  <div className="rounded-xl overflow-hidden border border-gold-500/20 bg-gold-500/5">
                     <MenuOption
                        icon={Building2}
                        label="Painel do Parceiro"
                        subLabel="Validar cupons e ver visitas"
                        onClick={() => navigate('/partner-dashboard')}
                        color="text-gold-500"
                     />
                  </div>
               </div>
            )}

            {/* Group 2: Support */}
            <div>
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 pl-2">Ajuda</h3>
               <div className="rounded-xl overflow-hidden border border-white/5 bg-obsidian-900">
                  <MenuOption
                     icon={LifeBuoy}
                     label="Suporte WhatsApp"
                     subLabel="Falar com atendente"
                     onClick={() => window.open('https://wa.me/5562982553770', '_blank')}
                     color="text-green-500"
                  />
                  {userRole === UserRole.ADMIN && (
                     <MenuOption
                        icon={Crown}
                        label="Painel Admin"
                        onClick={() => navigate('/admin')}
                        color="text-red-500"
                     />
                  )}
               </div>
            </div>

            {/* Logout Button */}
            <button
               onClick={handleLogout}
               className="w-full py-4 text-red-500 text-sm font-bold bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
               <LogOut size={16} />
               Sair da Conta
            </button>

            <p className="text-center text-[10px] text-gray-700 pt-2">Versão 2.1.0 • Tavares Car</p>
         </div>
      </div>
   );
};

export default Profile;