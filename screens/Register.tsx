import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        role: 'USER', // Default role
                        plan: 'Basic' // Default plan
                    }
                }
            });

            if (error) throw error;

            // Prefer server-side upsert: call secure admin endpoint with the user's access token.
            try {
                const userId = (data as any)?.user?.id;
                const accessToken = (data as any)?.session?.access_token;
                const adminUrl = import.meta.env.VITE_ADMIN_URL; // e.g. http://localhost:8787

                if (adminUrl && accessToken && userId) {
                    try {
                        const resp = await fetch(`${adminUrl.replace(/\/+$/,'')}/create-user`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            body: JSON.stringify({ id: userId, email: formData.email, name: formData.name, role: 'USER', plan: 'Basic' })
                        });

                        if (!resp.ok) {
                            console.warn('Admin server responded with non-OK status', resp.status);
                        }
                    } catch (err) {
                        console.warn('Could not call admin server to create user record:', err);
                    }
                } else if (userId) {
                    // Fallback: keep attempting client-side insert (may fail under RLS)
                    try {
                        const { error: insertError } = await supabase.from('users').insert({
                            id: userId,
                            email: formData.email,
                            name: formData.name,
                            role: 'USER',
                            plan: 'Basic'
                        });
                        if (insertError) {
                            console.warn('Could not insert user record into users table (anon):', insertError);
                        }
                    } catch (insertEx) {
                        console.warn('Unexpected error inserting user record (anon):', insertEx);
                    }
                }
            } catch (insertEx) {
                console.warn('Unexpected error in persistence flow:', insertEx);
            }

            if ((data as any).session) {
                // User created and logged in (if email confirmation is disabled)
                navigate('/home');
            } else {
                // User created but needs email verification
                setSuccess(true);
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-gold-500/10 p-6 rounded-full mb-6">
                    <CheckCircle size={64} className="text-gold-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Conta Criada!</h2>
                <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                    Enviamos um link de confirmação para <b>{formData.email}</b>. Verifique sua caixa de entrada para ativar sua conta.
                </p>
                <Button onClick={() => navigate('/login')} variant="outline">
                    VOLTAR PARA O LOGIN
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center px-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-sm mx-auto animate-fade-in">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center text-gray-500 hover:text-white mb-8 transition-colors text-sm"
                >
                    <ArrowLeft size={16} className="mr-2" /> Voltar
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">
                        Crie sua <span className="text-gold-500">Conta</span>
                    </h2>
                    <p className="text-gray-500 text-xs">Junte-se ao clube de vantagens exclusivo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                            {error}
                        </div>
                    )}

                    <Input
                        icon={<User size={18} />}
                        type="text"
                        label="Nome Completo"
                        placeholder="Seu Nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Input
                        icon={<Mail size={18} />}
                        type="email"
                        label="E-mail"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <Input
                        icon={<Lock size={18} />}
                        type="password"
                        label="Senha"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    <Input
                        icon={<Lock size={18} />}
                        type="password"
                        label="Confirmar Senha"
                        placeholder="Repita a senha"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                    />

                    <Button type="submit" isLoading={isLoading} className="mt-6">
                        <span className="flex items-center">
                            CRIAR CONTA <ChevronRight size={18} className="ml-1" />
                        </span>
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Register;
