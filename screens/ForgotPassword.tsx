import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldAlert, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });

            if (error) throw error;
            setSuccess(true);
            showToast('Email de recuperação enviado com sucesso!', 'success');
        } catch (err: unknown) {
            console.error('Reset password error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar email de redefinição.';
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian-950 flex flex-col justify-center px-8 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px]" />

            <div className="relative z-10 w-full max-w-md mx-auto animate-fade-in">

                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500/10 rounded-2xl border border-gold-500/20 mb-6">
                        <ShieldAlert size={40} className="text-gold-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Redefinir Senha
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Digite seu email cadastrado para receber o link de redefinição
                    </p>
                </div>

                {/* Card Form */}
                <div className="bg-obsidian-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Email Enviado!</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Verifique sua caixa de entrada e spam. Clique no link para redefinir sua senha.
                            </p>
                            <Button onClick={() => navigate('/login')} className="w-full">
                                Voltar ao Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                icon={<Mail size={18} />}
                                type="email"
                                placeholder="seu@email.com"
                                label="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                                Enviar Link de Redefinição
                            </Button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-500 text-sm hover:text-gray-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                        <ChevronLeft size={16} /> Voltar para login
                    </button>
                </div>

                {/* Security notice */}
                <div className="mt-6 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                        🔒 Conexão Segura · Acesso Monitorado
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
