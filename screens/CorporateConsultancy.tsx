import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Presentation, TrendingUp, CheckCircle2, MessageCircle, Shield, Target, Award } from 'lucide-react';
import { Button, Card } from '../components/ui';

const services = [
    {
        icon: <Building2 size={28} className="text-gold-500" />,
        title: "Gestão para Associações",
        description: "Estruturação completa, otimização de processos e estratégias de crescimento sustentável para associações de proteção veicular."
    },
    {
        icon: <Users size={28} className="text-blue-400" />,
        title: "Capacitação de Equipes",
        description: "Treinamentos comerciais e operacionais que elevam a performance do seu time e aumentam conversões."
    },
    {
        icon: <Presentation size={28} className="text-emerald-400" />,
        title: "Palestras e Workshops",
        description: "Eventos de alto impacto sobre liderança, vendas e inovação no mercado automotivo."
    },
    {
        icon: <TrendingUp size={28} className="text-orange-400" />,
        title: "Consultoria Comercial",
        description: "Diagnóstico completo e implementação de funis de vendas de alta conversão."
    }
];

const differentials = [
    { icon: <Shield size={20} />, text: "Especialistas no mercado de proteção veicular" },
    { icon: <Target size={20} />, text: "Metodologia própria validada em +500 empresas" },
    { icon: <TrendingUp size={20} />, text: "Foco em resultados mensuráveis" },
    { icon: <Award size={20} />, text: "Parceria com os maiores players do setor" }
];

const CorporateConsultancy: React.FC = () => {
    const navigate = useNavigate();

    const handleContact = () => {
        const message = encodeURIComponent("Olá! Sou gestor de uma associação de proteção veicular e gostaria de conhecer os serviços de consultoria da Tavares Car.");
        window.open(`https://wa.me/5562999999999?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-black pb-28">
            {/* Header Compacto Mobile */}
            <div className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold-600/20 via-obsidian-950 to-black"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                {/* Back Button */}
                <div className="relative z-20 p-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 px-5 pb-8 pt-2">
                    <span className="inline-block px-3 py-1.5 bg-gold-500/15 border border-gold-500/30 rounded-full text-gold-400 text-[11px] font-bold tracking-widest uppercase mb-4">
                        Serviços B2B
                    </span>
                    <h1 className="text-3xl font-serif font-bold text-white leading-tight mb-3">
                        Consultoria para{' '}
                        <span className="text-gold-500">Associações</span>
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Soluções estratégicas da Tavares Car para elevar o padrão da sua associação de proteção veicular.
                    </p>
                </div>
            </div>

            <div className="px-5 space-y-8 -mt-2">

                {/* Serviços Grid */}
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 size={18} className="text-gold-500" />
                        Nossos Serviços
                    </h2>
                    <div className="space-y-3">
                        {services.map((service, index) => (
                            <Card
                                key={index}
                                className="bg-white/5 border-white/5 p-5 active:scale-[0.98] transition-transform"
                            >
                                <div className="flex gap-4">
                                    <div className="p-2.5 bg-white/5 rounded-xl shrink-0 h-fit">
                                        {service.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-white mb-1">{service.title}</h3>
                                        <p className="text-gray-400 text-xs leading-relaxed">{service.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Por que escolher */}
                <section className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-bold text-white mb-5">
                        Por que a Tavares Car?
                    </h2>

                    <div className="space-y-4">
                        {differentials.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="text-gold-500 mt-0.5 shrink-0">{item.icon}</div>
                                <span className="text-gray-300 text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">10+</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Anos</p>
                        </div>
                        <div className="text-center border-x border-white/10">
                            <p className="text-2xl font-bold text-white">500+</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Empresas</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">98%</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Satisfação</p>
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section className="pb-4">
                    <div className="bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-black mb-2">Transforme sua Associação</h2>
                            <p className="text-black/70 text-sm mb-6">
                                Agende uma reunião de diagnóstico gratuita
                            </p>

                            <Button
                                onClick={handleContact}
                                className="w-full bg-black text-white hover:bg-gray-900 border-none h-14 text-sm font-bold shadow-xl active:scale-[0.98] transition-transform"
                            >
                                <MessageCircle size={18} className="mr-2" />
                                FALAR COM CONSULTOR
                            </Button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default CorporateConsultancy;
