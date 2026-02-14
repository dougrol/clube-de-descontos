import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        const initializeSession = async () => {
            try {
                // Get the full hash (everything after #)
                const fullHash = window.location.hash;
                console.log('Full hash:', fullHash);

                // Parse tokens from URL - Supabase sends them after the hash
                // Format can be: #/reset-password#access_token=...&type=recovery
                // Or: #access_token=...&type=recovery
                let tokenString = '';

                if (fullHash.includes('access_token=')) {
                    // Extract the token part
                    const tokenStart = fullHash.indexOf('access_token=');
                    tokenString = fullHash.substring(tokenStart);
                } else if (fullHash.includes('#', 1)) {
                    // Check if there's a second # (e.g., #/reset-password#access_token=...)
                    const secondHashIndex = fullHash.indexOf('#', 1);
                    tokenString = fullHash.substring(secondHashIndex + 1);
                }

                console.log('Token string:', tokenString);

                if (tokenString) {
                    const params = new URLSearchParams(tokenString);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token') || '';
                    const type = params.get('type');

                    console.log('Parsed - Type:', type, 'Has access token:', !!accessToken);

                    if (type === 'recovery' && accessToken) {
                        // Set session with recovery tokens
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        console.log('Set session result:', { data, error });

                        if (!error && data.session) {
                            setIsValidSession(true);
                            setCheckingSession(false);
                            return;
                        }
                    }
                }

                // Check if there's already a valid session (from PASSWORD_RECOVERY event)
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Existing session:', session);

                if (session) {
                    setIsValidSession(true);
                }

            } catch (err) {
                console.error('Session initialization error:', err);
            } finally {
                setCheckingSession(false);
            }
        };

        // Listen for PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session);
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
                setCheckingSession(false);
            } else if (event === 'SIGNED_IN' && session) {
                // Also accept SIGNED_IN with a valid session (in case recovery already authenticated)
                setIsValidSession(true);
                setCheckingSession(false);
            }
        });

        // Short delay to let Supabase process the hash
        setTimeout(() => {
            initializeSession();
        }, 500);

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);

            // Sign out and redirect to login after 3 seconds
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/login');
            }, 3000);

        } catch (err: unknown) {
            console.error('Reset password error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao redefinir senha. Tente novamente.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
                <div className="text-gold-500 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verificando sessão...</span>
                </div>
            </div>
        );
    }

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
                        <ShieldCheck size={40} className="text-gold-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Nova Senha
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isValidSession
                            ? 'Digite sua nova senha abaixo'
                            : 'Link inválido ou expirado'
                        }
                    </p>
                </div>

                {/* Card Form */}
                <div className="bg-obsidian-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Senha Redefinida!</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Sua senha foi alterada com sucesso. Redirecionando para o login...
                            </p>
                        </div>
                    ) : !isValidSession ? (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Link Inválido</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Este link de redefinição é inválido ou já expirou. Solicite um novo link.
                            </p>
                            <Button onClick={() => navigate('/admin-forgot-password')} className="w-full">
                                Solicitar Novo Link
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    placeholder="Mínimo 6 caracteres"
                                    label="Nova Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Input
                                icon={<Lock size={18} />}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirme sua senha"
                                label="Confirmar Senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                                Redefinir Senha
                            </Button>
                        </form>
                    )}
                </div>

                {/* Security notice */}
                <div className="mt-6 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                        🔒 Conexão Segura
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
