import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ChevronRight, ArrowLeft, CheckCircle, CreditCard, Phone, Building2 } from 'lucide-react';
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

// Phone formatting helper
const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

// CPF validation
const isValidCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;

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

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        phone: '',
        email: '',
        association: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, cpf: formatCPF(e.target.value) });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, phone: formatPhone(e.target.value) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const cleanCPF = formData.cpf.replace(/\D/g, '');

        // Validations
        if (!isValidCPF(cleanCPF)) {
            setError('CPF inválido. Verifique os números digitados.');
            setIsLoading(false);
            return;
        }

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

        if (!formData.association) {
            setError('Informe a associação de origem.');
            setIsLoading(false);
            return;
        }

        try {
            // Check if CPF already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('cpf', cleanCPF)
                .single();

            if (existingUser) {
                throw new Error('Este CPF já está cadastrado. Faça login.');
            }

            // Create auth user
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        cpf: cleanCPF,
                        role: 'USER',
                        plan: 'Basic'
                    }
                }
            });

            if (error) throw error;

            // Insert/Update user record with CPF (upsert to handle auth trigger conflicts)
            const userId = data?.user?.id;
            if (userId) {
                const { error: upsertError } = await supabase.from('users').upsert({
                    id: userId,
                    email: formData.email,
                    name: formData.name,
                    cpf: cleanCPF,
                    role: 'USER',
                    plan: 'Basic'
                }, { onConflict: 'id' });

                if (upsertError) {
                    console.error('Could not upsert user record:', upsertError);
                    // Try update as fallback
                    await supabase.from('users').update({
                        cpf: cleanCPF,
                        name: formData.name
                    }).eq('id', userId);
                }

                // Also add to associates table for future reference
                await supabase.from('associates').upsert({
                    cpf: cleanCPF,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone.replace(/\D/g, ''),
                    association: formData.association,
                    status: 'active'
                }, { onConflict: 'cpf' });
            }

            if (data?.session) {
                navigate('/home');
            } else {
                setSuccess(true);
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.message?.includes('already registered')) {
                setError('Este e-mail já está cadastrado.');
            } else {
                setError(err.message || 'Erro ao criar conta. Tente novamente.');
            }
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
        <div className="min-h-screen bg-black flex flex-col justify-center px-6 py-10 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-sm mx-auto animate-fade-in">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center text-gray-500 hover:text-white mb-6 transition-colors text-sm"
                >
                    <ArrowLeft size={16} className="mr-2" /> Voltar
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">
                        Cadastro de <span className="text-gold-500">Associado</span>
                    </h2>
                    <p className="text-gray-500 text-xs">
                        Exclusivo para associados ativos das associações parceiras.
                    </p>
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
                        icon={<CreditCard size={18} />}
                        type="text"
                        label="CPF"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleCPFChange}
                        required
                    />

                    <Input
                        icon={<Phone size={18} />}
                        type="text"
                        label="Telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handlePhoneChange}
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

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                            Associação de Origem
                        </label>
                        <div className="relative">
                            <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <select
                                value={formData.association}
                                onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-gold-500 focus:bg-obsidian-900 outline-none transition-all appearance-none"
                                required
                            >
                                <option value="" className="bg-obsidian-900">Selecione sua associação</option>
                                <option value="ancore" className="bg-obsidian-900">Ancore</option>
                                <option value="sudoeste" className="bg-obsidian-900">Sudoeste</option>
                                <option value="prime" className="bg-obsidian-900">Prime</option>
                                <option value="outra" className="bg-obsidian-900">Outra</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider">Defina sua senha de acesso</p>
                    </div>

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

                    <Button type="submit" isLoading={isLoading} className="mt-4">
                        <span className="flex items-center">
                            CRIAR MINHA CONTA <ChevronRight size={18} className="ml-1" />
                        </span>
                    </Button>

                    <p className="text-[10px] text-gray-600 text-center mt-4">
                        Ao criar sua conta, você concorda com nossos termos de uso e política de privacidade.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
