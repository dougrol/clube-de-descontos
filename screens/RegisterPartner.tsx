import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Phone, Mail, Lock, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { PartnerCategory } from '../types';
import { supabase } from '../services/supabaseClient';
import { createPartner } from '../services/partners';

const RegisterPartner: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        cnpj: '',
        companyName: '',
        tradingName: '',
        responsibleName: '',
        phone: '',
        email: '',
        password: '',
        category: PartnerCategory.SERVICES,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.tradingName,
                        role: 'PARTNER',
                        cnpj: formData.cnpj
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Partner Record
                const partnerData = {
                    id: authData.user.id,
                    cnpj: formData.cnpj,
                    name: formData.tradingName, // Using trading name as display name
                    company_name: formData.companyName,
                    responsible_name: formData.responsibleName,
                    phone: formData.phone,
                    category: formData.category,
                    email: formData.email,
                    description: `Parceiro ${formData.category} - ${formData.tradingName}`,
                    status: 'pending'
                };

                await createPartner(partnerData);

                // 3. Update User Role in public.users to PARTNER
                await supabase.from('users').upsert({
                    id: authData.user.id,
                    email: formData.email,
                    name: formData.tradingName,
                    role: 'PARTNER',
                    created_at: new Date().toISOString()
                });

                setStep(2);
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.message?.includes('already registered')) {
                setError('Este e-mail já está cadastrado.');
            } else {
                setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian-950 font-sans text-white pb-20">

            {/* Success State */}
            {step === 2 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/95 backdrop-blur-sm p-6">
                    <div className="bg-obsidian-900 border border-gold-500/30 p-8 rounded-2xl max-w-md w-full text-center animate-scale-up">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold font-serif mb-2">Solicitação Enviada!</h2>
                        <p className="text-gray-400 mb-8">
                            Seu cadastro foi recebido com sucesso. Verifique seu e-mail para confirmar a conta e aguarde a aprovação da nossa equipe.
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            IR PARA O LOGIN
                        </Button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="pt-8 px-6 md:px-12 mb-8">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </button>
            </div>

            <div className="max-w-2xl mx-auto px-6">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">
                        Seja um <span className="text-gold-500">Parceiro</span>
                    </h1>
                    <p className="text-gray-400">
                        Junte-se ao clube de vantagens mais exclusivo e expanda seus negócios.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="CNPJ"
                            name="cnpj"
                            placeholder="00.000.000/0000-00"
                            icon={<FileText size={18} />}
                            value={formData.cnpj}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Nome Fantasia"
                            name="tradingName"
                            placeholder="Nome da sua loja/empresa"
                            icon={<Building2 size={18} />}
                            value={formData.tradingName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Input
                        label="Razão Social"
                        name="companyName"
                        placeholder="Razão Social Completa"
                        icon={<FileText size={18} />}
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Nome do Responsável"
                            name="responsibleName"
                            placeholder="Seu nome completo"
                            icon={<User size={18} />}
                            value={formData.responsibleName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Telefone / WhatsApp"
                            name="phone"
                            placeholder="(00) 00000-0000"
                            icon={<Phone size={18} />}
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Categoria</label>
                        <div className="relative">
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-obsidian-950/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all appearance-none"
                            >
                                {Object.values(PartnerCategory).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <Building2 size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-6"></div>

                    <Input
                        label="E-mail de Acesso"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        icon={<Mail size={18} />}
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Senha"
                        name="password"
                        type="password"
                        placeholder="Crie uma senha segura (mínimo 6 dígitos)"
                        icon={<Lock size={18} />}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                    />

                    <div className="pt-6">
                        <Button type="submit" isLoading={isLoading} className="w-full py-4 text-base">
                            SOLICITAR CADASTRO
                        </Button>
                        <p className="text-center text-xs text-gray-500 mt-4">
                            Ao se cadastrar, você concorda com nossos termos de parceria.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPartner;
