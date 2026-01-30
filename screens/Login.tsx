import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, User, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Role redirect logic is handled in App.tsx routing or AuthContext
      // But we can double check role if needed or just let route guard handle it
      // For now, simple redirect
      if (selectedRole === UserRole.PARTNER) {
        navigate('/partner-dashboard');
      } else {
        navigate('/home');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : 'Ocorreu um erro ao entrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold-600/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm mx-auto animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          {/* Logo Icon */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-gold-500 blur-2xl opacity-20 rounded-full"></div>
            <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-xl">
              <path d="M100 10 L180 40 V90 C180 145 100 190 100 190 C100 190 20 145 20 90 V40 L100 10 Z" stroke="#D4AF37" strokeWidth="6" fill="black" />
              <text x="100" y="135" textAnchor="middle" fill="#D4AF37" fontFamily="'Playfair Display', serif" fontSize="100" fontWeight="bold">TC</text>
            </svg>
          </div>

          <h2 className="text-2xl font-serif font-bold text-white mb-1">
            TAVARES <span className="text-gold-500">CAR</span>
          </h2>
          <p className="text-gold-500/80 text-[10px] tracking-[0.3em] uppercase font-medium">Consultoria</p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-3 bg-white/5 p-1 rounded-xl mb-8 relative">
          <button
            onClick={() => setSelectedRole(UserRole.USER)}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${selectedRole === UserRole.USER ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Cliente
          </button>
          <button
            onClick={() => setSelectedRole(UserRole.PARTNER)}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${selectedRole === UserRole.PARTNER ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Parceiro
          </button>
          <button
            onClick={() => setSelectedRole(UserRole.ADMIN)}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${selectedRole === UserRole.ADMIN ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Admin
          </button>
        </div>

        <div className="mb-6 text-center">
          <h3 className="text-lg text-white font-medium">
            Login {selectedRole === UserRole.ADMIN ? 'Administrativo' : selectedRole === UserRole.PARTNER ? 'de Parceiro' : 'do Cliente'}
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            {selectedRole === UserRole.PARTNER ? 'Gerencie sua loja e cupons' : 'Acesse o Clube de Vantagens'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-200 text-xs">{error}</p>
            </div>
          )}

          <Input
            icon={<Mail size={18} />}
            type="email"
            placeholder={selectedRole === UserRole.PARTNER ? "email@empresa.com" : "seu@email.com"}
            label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1">
            <Input
              icon={<Lock size={18} />}
              type="password"
              placeholder="••••••••"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-right">
              <button type="button" className="text-xs text-gold-500 hover:text-gold-400 font-medium">
                Esqueceu a senha?
              </button>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="mt-4">
            <span className="flex items-center">
              ACESSAR PAINEL <ChevronRight size={18} className="ml-1" />
            </span>
          </Button>
        </form>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
          {/* Partner Registration Link */}
          {selectedRole === UserRole.PARTNER && (
            <div className="text-center bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-gray-400 text-xs mb-2">Quer oferecer descontos no clube?</p>
              <button
                onClick={() => navigate('/register-partner')}
                className="text-gold-500 font-bold text-sm hover:underline"
              >
                SEJA UM PARCEIRO
              </button>
            </div>
          )}

          {selectedRole === UserRole.USER && (
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Não é membro?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-white font-semibold underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-400 transition-colors"
                >
                  Assine agora
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;