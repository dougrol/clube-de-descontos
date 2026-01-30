import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Phone, Mail, Lock, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, SectionTitle } from '../components/ui';
import { PartnerCategory } from '../types';

const RegisterPartner: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Form, 2: Success
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setStep(2);
        }, 1000);
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
                            Seu cadastro foi recebido com sucesso. Nossa equipe entrará em contato em breve para validar sua parceria.
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            VOLTAR PARA O LOGIN
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
                        placeholder="Crie uma senha segura"
                        icon={<Lock size={18} />}
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className="pt-6">
                        <Button type="submit" className="w-full py-4 text-base">
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
