import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button, AvatarUpload } from '../components/ui';
import { Settings, LogOut, ChevronRight, User, Ticket, LifeBuoy, Crown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadAvatar, updateUserAvatar } from '../services/avatarService';
import { supabase } from '../services/supabaseClient';

interface ProfileProps {
   userRole: UserRole;
}

const Profile: React.FC<ProfileProps> = ({ userRole }) => {
   const navigate = useNavigate();
   const { user, signOut } = useAuth();
   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   // Fetch avatar from database on mount
   useEffect(() => {
      const fetchAvatar = async () => {
         if (!user?.id) {
            setLoading(false);
            return;
         }

         try {
            const { data, error } = await supabase
               .from('users')
               .select('avatar_url')
               .eq('id', user.id)
               .single();

            if (data?.avatar_url) {
               setAvatarUrl(data.avatar_url);
            }
         } catch (err) {
            console.error('Error fetching avatar:', err);
         } finally {
            setLoading(false);
         }
      };

      fetchAvatar();
   }, [user?.id]);

   const handleLogout = async () => {
      const isAdmin = userRole === UserRole.ADMIN;
      const redirectUrl = isAdmin ? '/tc-portal-2024' : '/login';

      await signOut();

      // Force redirect using window.location to avoid React Router interference
      window.location.href = window.location.origin + window.location.pathname + '#' + redirectUrl;
   }

   const handleAvatarUpload = async (file: File) => {
      if (!user?.id) return;

      try {
         const newUrl = await uploadAvatar(user.id, file);
         await updateUserAvatar(user.id, newUrl);
         setAvatarUrl(newUrl);
      } catch (error: any) {
         console.error('Avatar upload failed:', error);
         throw error; // Re-throw to show error in component
      }
   };

   // Fallback data if user is loading or incomplete
   const userName = user?.user_metadata?.name || 'Membro Tavares';
   const userEmail = user?.email || 'email@exemplo.com';
   const userPlan = user?.user_metadata?.plan || 'Basic';
   const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=D4AF37&color=000';
   const displayAvatar = avatarUrl || defaultAvatar;
   const memberSince = new Date(user?.created_at || Date.now()).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });

   return (
      <div className="min-h-screen bg-black animate-fade-in relative overflow-hidden">
         {/* Top Bar */}
         <div className="relative z-10 p-4 flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 text-white">
               <ChevronRight className="rotate-180" size={24} />
            </button>
            <h1 className="flex-1 text-center text-white text-sm font-bold tracking-[0.2em] uppercase">Perfil</h1>
            <div className="w-10" />
         </div>

         <div className="p-6 pb-24 space-y-8 relative z-10">

            {/* Profile Header with Avatar Upload */}
            <div className="flex flex-col items-center text-center">
               <div className="relative mb-4">
                  <div className="p-1 bg-gradient-to-b from-gold-400 to-gold-700 rounded-full">
                     <AvatarUpload
                        currentImageUrl={displayAvatar}
                        onUpload={handleAvatarUpload}
                        size="lg"
                     />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-gold-500 text-black rounded-full p-1.5 border-4 border-black">
                     <CheckCircle2 size={16} strokeWidth={3} />
                  </div>
               </div>
               <h2 className="text-2xl font-bold text-white">{userName}</h2>
               <p className="text-gray-500 text-sm">{userEmail}</p>
               <p className="text-gold-500 text-xs mt-1">Toque na foto para alterar</p>
            </div>

            {/* Premium Gold Card - Only for Non-Admins */}
            {userRole !== UserRole.ADMIN && (
               <div className="relative w-full aspect-[1.8/1] rounded-2xl overflow-hidden shadow-2xl shadow-gold-500/20 group">
                  {/* Card Background with Texture */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FAD961] via-[#D4AF37] to-[#B4932A]"></div>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-black">
                     <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">Status de Membro</span>
                           <span className="text-3xl font-black italic tracking-tighter mt-1 uppercase">Plano {userPlan}</span>
                        </div>
                        <Crown size={24} className="opacity-60" />
                     </div>

                     <div className="space-y-3">
                        <div className="h-px w-full bg-black/10" />
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-bold uppercase opacity-70">Membro Desde</p>
                              <p className="text-xs font-bold">{memberSince}</p>
                           </div>
                           <button onClick={() => navigate('/benefits')} className="bg-black text-gold-500 text-[10px] font-bold px-3 py-2 rounded-lg uppercase tracking-wider shadow-lg active:scale-95 transition-transform">
                              Ver Benefícios
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Settings List */}
            <div className="space-y-1">
               <h3 className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase pl-4 mb-2">Minha Conta</h3>

               {[
                  { icon: <User size={20} />, label: "Dados Pessoais" },
                  { icon: <Ticket size={20} />, label: "Histórico de Cupons" },
                  { icon: <LifeBuoy size={20} />, label: "Suporte WhatsApp", action: () => window.open('https://wa.me/', '_blank') },
               ].map((item, idx) => (
                  <div
                     key={idx}
                     onClick={item.action}
                     className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
                           {item.icon}
                        </div>
                        <span className="text-white font-medium">{item.label}</span>
                     </div>
                     <ChevronRight size={18} className="text-gray-600 group-hover:text-gold-500 transition-colors" />
                  </div>
               ))}

               <div className="pt-4 px-4">
                  <div className="h-px w-full bg-gray-800" />
               </div>

               <div
                  onClick={handleLogout}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-red-500/10 cursor-pointer transition-colors group mt-2"
               >
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <LogOut size={20} />
                     </div>
                     <span className="text-red-500 font-bold">Sair da Conta</span>
                  </div>
               </div>
            </div>

            {userRole === UserRole.ADMIN && (
               <Button onClick={() => navigate('/admin')} variant="outline" className="mt-4">
                  Acessar Painel Admin
               </Button>
            )}

            <div className="h-10" />
         </div>
      </div>
   );
};

export default Profile;