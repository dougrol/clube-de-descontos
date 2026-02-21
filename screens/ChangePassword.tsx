import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, ShieldCheck, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

const ChangePassword: React.FC = () => {
   const navigate = useNavigate();
   const { showToast } = useToast();
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (newPassword.length < 6) {
         setError('A nova senha deve ter pelo menos 6 caracteres.');
         return;
      }

      if (newPassword !== confirmPassword) {
         setError('As senhas não coincidem.');
         return;
      }

      setIsLoading(true);

      try {
         // Verify current password by re-authenticating
         const { data: { user } } = await supabase.auth.getUser();
         if (!user?.email) throw new Error('Usuário não encontrado.');

         const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
         });

         if (signInError) {
            setError('Senha atual incorreta.');
            setIsLoading(false);
            return;
         }

         // Update to new password
         const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
         });

         if (updateError) throw updateError;

         setSuccess(true);
         showToast('Senha alterada com sucesso!', 'success');

         setTimeout(() => {
            navigate(-1);
         }, 2000);

      } catch (err: unknown) {
         console.error('Change password error:', err);
         const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar senha. Tente novamente.';
         setError(errorMessage);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col relative overflow-hidden">
         {/* Background */}
         <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
               backgroundImage: 'linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)',
               backgroundSize: '50px 50px'
            }}></div>
         </div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px]" />

         {/* Header */}
         <div className="sticky top-0 z-20 bg-obsidian-950/90 backdrop-blur-lg border-b border-white/5">
            <div className="flex items-center p-4">
               <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-theme-muted hover:text-theme-text">
                  <ChevronLeft size={24} />
               </button>
               <h1 className="flex-1 text-center text-theme-text text-sm font-bold tracking-[0.2em] uppercase">Alterar Senha</h1>
               <div className="w-10" />
            </div>
         </div>

         <div className="relative z-10 flex-1 flex flex-col justify-center px-8 py-10">
            <div className="w-full max-w-md mx-auto animate-fade-in">
               {/* Icon */}
               <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500/10 rounded-2xl border border-gold-500/20 mb-6">
                     <ShieldCheck size={40} className="text-gold-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-theme-text mb-2">Alterar Senha</h2>
                  <p className="text-theme-muted text-sm">Digite sua senha atual e a nova senha desejada</p>
               </div>

               {/* Form Card */}
               <div className="bg-obsidian-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                  {success ? (
                     <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                           <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-theme-text font-semibold mb-2">Senha Alterada!</h3>
                        <p className="text-theme-muted text-sm mb-6">
                           Sua senha foi alterada com sucesso. Voltando...
                        </p>
                     </div>
                  ) : (
                     <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                           <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                              <p className="text-red-300 text-sm">{error}</p>
                           </div>
                        )}

                        <div className="relative">
                           <Input
                              icon={<Lock size={18} />}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Digite sua senha atual"
                              label="Senha Atual"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                           />
                        </div>

                        <div className="border-t border-white/5 my-2" />

                        <div className="relative">
                           <Input
                              icon={<Lock size={18} />}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Mínimo 6 caracteres"
                              label="Nova Senha"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                           />
                        </div>

                        <div className="relative">
                           <Input
                              icon={<Lock size={18} />}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Confirme a nova senha"
                              label="Confirmar Nova Senha"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                           />
                        </div>

                        {/* Toggle visibility */}
                        <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="flex items-center gap-2 text-theme-muted text-xs hover:text-theme-text transition-colors"
                        >
                           {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                           {showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
                        </button>

                        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                           Alterar Senha
                        </Button>
                     </form>
                  )}
               </div>

               {/* Security note */}
               <div className="mt-6 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                     🔒 Conexão Segura
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ChangePassword;
