import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronRight, AlertCircle, Store, User, Sparkles, CreditCard, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, ImageWithFallback } from '../components/ui';
import { StaggerContainer, StaggerItem } from '../components/motion';
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
  const [showPassword, setShowPassword] = useState(false);
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

        if (!userData) {
          throw new Error('Usuário não encontrado.');
        }

        if (userData.role === 'ADMIN') {
          // navigate('/admin'); // Handled by AppRoutes
        } else {
          // navigate('/partner-dashboard'); // Handled by AppRoutes
        }
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
        // navigate('/home'); // Handled by AppRoutes
      }

    } catch (err: unknown) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'Erro no login';
      if (message === 'Invalid login credentials') {
        setError('Senha incorreta ou usuário não encontrado.');
      } else if (message.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        setError(message || 'Ocorreu um erro ao entrar. Tente novamente.');
      }
      setIsLoading(false);
    }
    // Finally block removed to keep loading state on success until redirect happens
  };


  return (
    <div className="min-h-screen bg-black flex flex-col justify-center px-6 relative overflow-hidden">
      {/* Background Decor with pulse animation */}
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold-600/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <StaggerContainer className="relative z-10 w-full max-w-sm mx-auto" staggerDelay={0.12}>
        {/* Logo */}
        <StaggerItem>
          <div className="mb-8 flex flex-col items-center">
            <motion.div
              className="mb-4 relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gold-500 blur-2xl opacity-20 rounded-full"></div>
              <ImageWithFallback
                src="/logo.png"
                alt="Tavares Car Logo"
                className="w-20 h-20 object-contain drop-shadow-xl relative z-10"
                showSkeleton={false}
                fallbackComponent={
                  <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-xl">
                    <path d="M100 10 L180 40 V90 C180 145 100 190 100 190 C100 190 20 145 20 90 V40 L100 10 Z" stroke="#D4AF37" strokeWidth="6" fill="black" />
                    <text x="100" y="135" textAnchor="middle" fill="#D4AF37" fontFamily="'Playfair Display', serif" fontSize="100" fontWeight="bold">TC</text>
                  </svg>
                }
              />
            </motion.div>

            <h2 className="text-2xl font-serif font-bold text-white mb-1">
              TAVARES <span className="text-gold-500">CAR</span>
            </h2>
            <p className="text-gold-500/80 text-[10px] tracking-[0.3em] uppercase font-medium">Clube de Vantagens</p>
          </div>
        </StaggerItem>

        {/* Role Switcher */}
        <StaggerItem>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {/* Client Option */}
            <motion.button
              onClick={() => setSelectedRole('client')}
              aria-pressed={selectedRole === 'client'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${selectedRole === 'client'
                ? 'bg-gold-500 border-gold-500 text-black shadow-lg shadow-gold-500/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
            >
              <User size={24} />
              <span className="text-sm font-bold">Associado</span>
              <span className="text-[10px] opacity-70">Acesse com CPF</span>
            </motion.button>

            {/* Partner Option */}
            <motion.button
              onClick={() => setSelectedRole('partner')}
              aria-pressed={selectedRole === 'partner'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.button>
          </div>
        </StaggerItem>

        {/* Dynamic Header */}
        <StaggerItem>
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
        </StaggerItem>

        {/* Login Form */}
        <StaggerItem>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3"
              >
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-200 text-xs">{error}</p>
              </motion.div>
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
              <div className="relative">
                <Input
                  icon={<Lock size={18} />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  label="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right">
                <motion.button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-gold-500 hover:text-gold-400 font-medium"
                >
                  Esqueceu a senha?
                </motion.button>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="mt-4"
            >
              <Button type="submit" isLoading={isLoading} className="w-full">
                <span className="flex items-center justify-center">
                  {selectedRole === 'partner' ? 'ACESSAR PAINEL' : 'ENTRAR NO CLUBE'}
                  <ChevronRight size={18} className="ml-1" />
                </span>
              </Button>
            </motion.div>
          </form>
        </StaggerItem>

        {/* Footer Actions */}
        <StaggerItem>
          <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
            {/* Partner Highlight when on Client mode */}
            {selectedRole === 'client' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-signal-500/10 to-orange-500/10 border border-signal-500/30 p-4 rounded-xl text-center"
              >
                <p className="text-white text-sm mb-2">
                  <Store size={16} className="inline mr-2 text-signal-500" />
                  Tem um negócio?
                </p>
                <motion.button
                  onClick={() => navigate('/register-partner')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-signal-500 font-bold text-sm hover:underline"
                >
                  SEJA UM PARCEIRO →
                </motion.button>
              </motion.div>
            )}

            {/* Client Registration */}
            {selectedRole === 'client' && (
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  Associado e ainda não tem conta?{' '}
                  <motion.button
                    onClick={() => navigate('/register')}
                    whileHover={{ scale: 1.02 }}
                    className="text-white font-semibold underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-400 transition-colors"
                  >
                    Cadastre-se
                  </motion.button>
                </p>
              </div>
            )}

            {/* Partner Registration Link */}
            {selectedRole === 'partner' && (
              <div className="text-center bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-gray-400 text-xs mb-2">Quer oferecer descontos no clube?</p>
                <motion.button
                  onClick={() => navigate('/register-partner')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-gold-500 font-bold text-sm hover:underline"
                >
                  CADASTRE SUA LOJA
                </motion.button>
              </div>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
};

export default Login;