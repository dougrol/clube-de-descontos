import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, User, ChevronRight, ArrowLeft, CheckCircle, CreditCard, Phone, Building2, Info, Car } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

// Helpers
const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

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

interface AgvData {
    id: string;
    nome: string;
    telefone: string;
    placa: string;
    placa_normalizada: string;
    primeiro_acesso_realizado: boolean;
}

const RegisterAgv: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    
    // Check if we came from the placa validation
    const agvData = location.state?.agvData as AgvData | undefined;

    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Redirect back if no data (security measure so people don't bypass placa validation)
        if (!agvData) {
            navigate('/primeiro-acesso-agv');
            return;
        }

        // Pre-fill data
        setFormData(prev => ({
            ...prev,
            name: agvData.nome || '',
            phone: agvData.telefone ? formatPhone(agvData.telefone) : '',
        }));
    }, [agvData, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agvData) return;

        setIsLoading(true);
        setError(null);

        const cleanCPF = formData.cpf.replace(/\D/g, '');

        if (!isValidCPF(cleanCPF)) {
            setError('CPF inválido. Verifique os números digitados.');
            setIsLoading(false);
            return;
        }

        const pwdError = (() => {
            const pwd = formData.password;
            if (pwd.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
            if (!/[a-zA-Z]/.test(pwd)) return 'A senha deve conter pelo menos uma letra.';
            if (!/\d/.test(pwd)) return 'A senha deve conter pelo menos um número.';
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'A senha deve conter pelo menos um caractere especial.';
            if (pwd !== formData.confirmPassword) return 'As senhas não coincidem.';
            return null;
        })();

        if (pwdError) {
            setError(pwdError);
            setIsLoading(false);
            return;
        }

        try {
            // 1. Run deduplication check
            const { data: duplicateData, error: dedupError } = await supabase.rpc('check_duplicate_associado', {
                p_cpf: cleanCPF,
                p_email: formData.email,
                p_telefone: formData.phone,
                p_placa: agvData.placa,
                p_nome: formData.name
            });

            if (dedupError) {
                console.error("Dedup error:", dedupError);
            }

            const isDuplicate = duplicateData?.[0]?.found;
            const existingCpf = duplicateData?.[0]?.cpf_existente || cleanCPF;
            const matchedBy = duplicateData?.[0]?.matched_by;

            // 2. Check if Auth/Users account exists for this CPF
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('cpf', existingCpf)
                .single();

            let userId = existingUser?.id;

            if (isDuplicate && userId) {
                // User already exists and has an account. Just link the AGV record.
                await supabase.from('associado_associacoes').upsert({
                    cpf_associado: existingCpf,
                    association_name: 'universo_agv'
                }, { onConflict: 'cpf_associado,association_name' });

                await supabase.from('associados_universo_agv').update({
                    primeiro_acesso_realizado: true,
                    data_primeiro_acesso: new Date().toISOString(),
                    cadastro_completo: true,
                    user_id: userId,
                    cpf: existingCpf,
                    email: formData.email,
                    nome: formData.name,
                    telefone: formData.phone.replace(/\D/g, '')
                }).eq('id', agvData.id);

                setError(`Identificamos que você já possui cadastro no sistema (match por ${matchedBy}). Seus benefícios foram unificados. Por favor, faça login com sua senha atual.`);
                setIsLoading(false);
                return;
            }

            // If we are here, we need to create an auth account
            if (!userId) {
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
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

                if (signUpError) throw signUpError;
                userId = authData?.user?.id;
            }

            if (userId) {
                // 1. Insert/Update user record
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
                }

                // 2. Add to associates table
                await supabase.from('associates').upsert({
                    cpf: cleanCPF,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone.replace(/\D/g, ''),
                    association: 'universo_agv',
                    status: 'active'
                }, { onConflict: 'cpf' });

                // 3. Link associations
                await supabase.from('associado_associacoes').upsert({
                    cpf_associado: cleanCPF,
                    association_name: 'universo_agv'
                }, { onConflict: 'cpf_associado,association_name' });

                // 4. Update associados_universo_agv table
                const { error: agvError } = await supabase
                    .from('associados_universo_agv')
                    .update({
                        primeiro_acesso_realizado: true,
                        data_primeiro_acesso: new Date().toISOString(),
                        cadastro_completo: true,
                        user_id: userId,
                        cpf: cleanCPF,
                        email: formData.email,
                        nome: formData.name,
                        telefone: formData.phone.replace(/\D/g, ''),
                    })
                    .eq('id', agvData.id);
                    
                if (agvError) {
                    console.error('Error updating AGV record:', agvError);
                }
            }

            setSuccess(true);

        } catch (err: unknown) {
            console.error('Registration error:', err);
            const message = err instanceof Error ? err.message : 'Erro ao criar conta';
            if (message?.includes('already registered')) {
                setError('Este e-mail já está em uso.');
                showToast("Email já cadastrado!", "error");
            } else {
                setError(message);
                showToast(message, "error");
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
                <h2 className="text-2xl font-bold text-white mb-2">Cadastro Concluído!</h2>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                    Seu cadastro na <b>Universo AGV</b> foi validado e ativado. Você já pode acessar o clube de benefícios.
                </p>
                <Button onClick={() => navigate('/login')} variant="outline">
                    VOLTAR PARA O LOGIN
                </Button>
            </div>
        );
    }

    if (!agvData) return null; // Wait for redirect

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center px-6 py-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-sm mx-auto animate-fade-in">
                <button
                    onClick={() => navigate('/primeiro-acesso-agv')}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors text-sm"
                >
                    <ArrowLeft size={16} className="mr-2" /> Voltar
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">
                        Complete seu <span className="text-gold-500">Cadastro</span>
                    </h2>
                    
                    <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 flex items-center gap-3 mt-4">
                       <Car size={20} className="text-gold-500" />
                       <div>
                         <p className="text-gold-500 text-xs font-bold uppercase tracking-wider">Placa Localizada</p>
                         <p className="text-white text-sm font-medium">{agvData.placa}</p>
                       </div>
                    </div>
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
                        onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                        required
                    />

                    <Input
                        icon={<Phone size={18} />}
                        type="text"
                        label="Telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
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
                        type="password"
                        label="Senha"
                        placeholder="Crie uma senha forte"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    <Input
                        type="password"
                        label="Confirmar Senha"
                        placeholder="Repita a senha"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                            Associação de Origem
                        </label>
                        <div className="relative">
                            <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <div className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-300">
                                Universo AGV
                            </div>
                        </div>
                    </div>

                    <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
                        <p className="text-gold-400 text-sm flex items-center gap-2">
                            <Info size={16} className="shrink-0" />
                            <span>Sua senha será seu <b>CPF</b> (apenas os números). Você poderá alterá-la depois.</span>
                        </p>
                    </div>

                    <Button type="submit" isLoading={isLoading} className="mt-4 w-full">
                        <span className="flex items-center justify-center">
                            FINALIZAR CADASTRO <ChevronRight size={18} className="ml-1" />
                        </span>
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default RegisterAgv;
