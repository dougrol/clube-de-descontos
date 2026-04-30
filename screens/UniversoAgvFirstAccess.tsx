import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ChevronRight, AlertCircle, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input } from '../components/ui';
import { StaggerContainer, StaggerItem } from '../components/motion';
import { supabase } from '../services/supabaseClient';

const formatPlaca = (placa: string): string => {
  // Remove espaços, traços e converte para maiúsculo
  return placa.replace(/[\s-]/g, '').toUpperCase();
};

const UniversoAgvFirstAccess: React.FC = () => {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const placaNormalizada = formatPlaca(placa);

    if (placaNormalizada.length < 7) {
      setError('Por favor, informe a placa completa (ex: ABC1234 ou ABC1D23).');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('associados_universo_agv')
        .select('*')
        .eq('placa_normalizada', placaNormalizada)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setError('Não encontramos essa placa na base da Universo AGV. Confira os dados digitados ou entre em contato com o suporte.');
        setIsLoading(false);
        return;
      }

      if (data.primeiro_acesso_realizado) {
        setError('Seu cadastro já foi iniciado. Faça login com seus dados cadastrados ou redefina sua senha.');
        setIsLoading(false);
        return;
      }

      // Found and not started
      // Navigate to RegisterAgv with the user data
      navigate('/register-agv', { state: { agvData: data } });

    } catch (err) {
      console.error('Error fetching placa:', err);
      setError('Erro ao validar a placa. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center px-6 py-10 relative overflow-hidden">
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <StaggerContainer className="relative z-10 w-full max-w-sm mx-auto" staggerDelay={0.1}>
        <StaggerItem>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Voltar ao Login
          </button>
        </StaggerItem>

        <StaggerItem>
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-500/20">
              <Car size={32} className="text-gold-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">
              Primeiro Acesso <span className="text-gold-500">AGV</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Informe a placa do seu veículo para localizar seu cadastro e ativar seu acesso ao clube.
            </p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/15 border border-red-500/60 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm font-medium leading-snug">{error}</p>
              </motion.div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <Input
                icon={<Search size={18} />}
                type="text"
                label="Placa do Veículo"
                placeholder="Ex: ABC1234 ou ABC1D23"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                required
                className="uppercase"
                maxLength={8}
              />

              <Button type="submit" isLoading={isLoading} className="w-full mt-6">
                <span className="flex items-center justify-center">
                  BUSCAR PLACA <ChevronRight size={18} className="ml-1" />
                </span>
              </Button>
            </div>
          </form>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
};

export default UniversoAgvFirstAccess;
