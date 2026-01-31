import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronRight, AlertCircle, Store, User, Sparkles, CreditCard } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';

// CPF formatting helper
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

// CPF validation
const isValidCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false; // All same digits

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;
  if (check2 !== parseInt(numbers[10])) return false;

  return true;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [cpf, setCPF] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'partner'>('client');
  const [error, setError] = useState<string | null>(null);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCPF(formatCPF(e.target.value));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const cleanCPF = cpf.replace(/\D/g, '');

    // Validate CPF format
    if (selectedRole === 'client' && !isValidCPF(cleanCPF)) {
      setError('CPF inválido. Verifique os números digitados.');
      setIsLoading(false);
      return;
    }

    try {
      if (selectedRole === 'partner') {
        // Partners login with email
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cpf, // For partners, this field is actually email
          password,
        });

        if (error) throw error;

        // Verify if user is actually a partner
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userData && userData.role !== 'PARTNER' && userData.role !== 'ADMIN') {
          await supabase.auth.signOut();
          throw new Error('Esta conta não tem permissão de parceiro.');
        }

        navigate('/partner-dashboard');
      } else {
        // Clients login with CPF
        // First, find user by CPF
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('cpf', cleanCPF)
          .single();

        if (userError || !userData) {
          throw new Error('CPF não encontrado. Se você é um associado, faça seu cadastro primeiro.');
        }

        // Login with the email associated with this CPF
        const { error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password,
        });

        if (error) throw error;
        navigate('/home');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('Senha incorreta ou usuário não encontrado.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        setError(err.message || 'Ocorreu um erro ao entrar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black flex flex-col justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold-600/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm mx-auto animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
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
          <p className="text-gold-500/80 text-[10px] tracking-[0.3em] uppercase font-medium">Clube de Vantagens</p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Client Option */}
          <button
            onClick={() => setSelectedRole('client')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${selectedRole === 'client'
              ? 'bg-gold-500 border-gold-500 text-black shadow-lg shadow-gold-500/20'
              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
              }`}
          >
            <User size={24} />
            <span className="text-sm font-bold">Associado</span>
            <span className="text-[10px] opacity-70">Acesse com CPF</span>
          </button>

          {/* Partner Option */}
          <button
            onClick={() => setSelectedRole('partner')}
            className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 relative overflow-hidden ${selectedRole === 'partner'
              ? 'bg-gold-500 border-gold-500 text-black shadow-lg shadow-gold-500/20'
              : 'bg-gradient-to-br from-signal-500/10 to-orange-500/10 border-signal-500/30 text-white hover:border-signal-500/60'
              }`}
          >
            {selectedRole !== 'partner' && (
              <div className="absolute top-1 right-1">
                <Sparkles size={14} className="text-signal-500" />
              </div>
            )}
            <Store size={24} />
            <span className="text-sm font-bold">Parceiro</span>
            <span className="text-[10px] opacity-70">Acesse com E-mail</span>
          </button>
        </div>

        {/* Dynamic Header */}
        <div className="mb-6 text-center">
          <h3 className="text-lg text-white font-medium">
            {selectedRole === 'partner' ? 'Acesse seu Painel' : 'Entre no Clube'}
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            {selectedRole === 'partner'
              ? 'Gerencie cupons, veja estatísticas e atualize sua loja'
              : 'Exclusivo para associados ativos das associações parceiras'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-200 text-xs">{error}</p>
            </div>
          )}

          {selectedRole === 'client' ? (
            <Input
              icon={<CreditCard size={18} />}
              type="text"
              placeholder="000.000.000-00"
              label="CPF"
              value={cpf}
              onChange={handleCPFChange}
              required
            />
          ) : (
            <Input
              icon={<Store size={18} />}
              type="email"
              placeholder="email@empresa.com"
              label="E-mail da Empresa"
              value={cpf}
              onChange={(e) => setCPF(e.target.value)}
              required
            />
          )}

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
              {selectedRole === 'partner' ? 'ACESSAR PAINEL' : 'ENTRAR NO CLUBE'}
              <ChevronRight size={18} className="ml-1" />
            </span>
          </Button>
        </form>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
          {/* Partner Highlight when on Client mode */}
          {selectedRole === 'client' && (
            <div className="bg-gradient-to-r from-signal-500/10 to-orange-500/10 border border-signal-500/30 p-4 rounded-xl text-center">
              <p className="text-white text-sm mb-2">
                <Store size={16} className="inline mr-2 text-signal-500" />
                Tem um negócio?
              </p>
              <button
                onClick={() => navigate('/register-partner')}
                className="text-signal-500 font-bold text-sm hover:underline"
              >
                SEJA UM PARCEIRO →
              </button>
            </div>
          )}

          {/* Client Registration */}
          {selectedRole === 'client' && (
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Associado e ainda não tem conta?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-white font-semibold underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-400 transition-colors"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          )}

          {/* Partner Registration Link */}
          {selectedRole === 'partner' && (
            <div className="text-center bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-gray-400 text-xs mb-2">Quer oferecer descontos no clube?</p>
              <button
                onClick={() => navigate('/register-partner')}
                className="text-gold-500 font-bold text-sm hover:underline"
              >
                CADASTRE SUA LOJA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;