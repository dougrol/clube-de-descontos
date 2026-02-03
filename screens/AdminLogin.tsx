import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, ChevronRight, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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

            // Check if user is actually an admin
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user?.id)
                .single();

            if (userError) {
                console.error('Error fetching user role:', userError);
                throw new Error('Erro ao verificar permissões. Tente novamente.');
            }

            console.log('Admin login - User role from DB:', userData?.role);

            // Case-insensitive check for admin role
            const userRole = userData?.role?.toString().toUpperCase();
            if (userRole !== 'ADMIN') {
                await supabase.auth.signOut();
                throw new Error('Acesso não autorizado. Esta área é restrita a administradores.');
            }

            // Wait longer for AuthContext to sync the auth state
            await new Promise(resolve => setTimeout(resolve, 800));

            // Force full page reload to admin panel for clean state
            window.location.href = window.location.origin + window.location.pathname + '#/admin';
            window.location.reload();

        } catch (err: unknown) {
            console.error('Admin login error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.';
            setError(
                errorMessage === 'Invalid login credentials'
                    ? 'Credenciais inválidas.'
                    : errorMessage
            );
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
                        Painel Administrativo
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Acesso restrito a administradores do sistema
                    </p>
                </div>

                {/* Card Form */}
                <div className="bg-obsidian-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        <Input
                            icon={<Mail size={18} />}
                            type="email"
                            placeholder="admin@tavarescar.com"
                            label="E-mail Administrativo"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            icon={<Lock size={18} />}
                            type="password"
                            placeholder="••••••••"
                            label="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                            <span className="flex items-center justify-center">
                                ACESSAR ADMIN <ChevronRight size={18} className="ml-1" />
                            </span>
                        </Button>
                    </form>

                    {/* Forgot Password Link */}
                    <div className="mt-4 text-center border-t border-white/5 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-forgot-password')}
                            className="text-gold-500 text-sm hover:text-gold-400 transition-colors"
                        >
                            Esqueci minha senha
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
                    >
                        ← Voltar para login principal
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

export default AdminLogin;
