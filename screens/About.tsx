import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Eye, Heart, Award, Users, TrendingUp } from 'lucide-react';
import { Card, SectionTitle, Badge } from '../components/ui';

const About: React.FC = () => {
    const navigate = useNavigate();

    const activePartners = [
        {
            name: "Glauciene Tavares",
            role: "Sócia Fundadora",
            image: "/images/about/glauciene.png",
            bio: [
                "Fundadora da Tavares Car Consultoria",
                "Mais de 25 anos de experiência em vendas",
                "10 anos no ramo de proteção veicular",
                "Primeira Gestora do plano de carreira",
                "Referência nacional na formação de equipes comerciais",
                "Especialista em fechamento de vendas (Leves e Pesados)",
                "Gestora Comercial e de Expansão"
            ]
        },
        {
            name: "Bertony Tavares",
            role: "Sócio Diretor",
            image: "/images/about/bertony.png",
            bio: [
                "Sócio da Tavares Car",
                "Mais de 20 anos de experiência em vendas internas e externas",
                "Gestor Comercial",
                "Experiência em abertura de rotas comerciais"
            ]
        },
        {
            name: "Glayson Fernando",
            role: "Sócio Diretor",
            image: "/images/about/glayson.png",
            bio: [
                "Mais de 25 anos de experiência em vendas externas",
                "Gestor Comercial",
                "Experiência em abertura de rotas comerciais",
                "Gestor de Expansão"
            ]
        }
    ];

    return (
        <div className="bg-obsidian-950 min-h-screen pb-32 font-sans text-theme-text">
            {/* Header */}
            <div className="pt-8 px-6 md:px-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-theme-muted hover:text-theme-text transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </button>

                <header className="mb-16 animate-fade-in">
                    <Badge>INSTITUCIONAL</Badge>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mt-4 mb-6">
                        Quem <span className="text-gold-500">Somos?</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed">
                        Fundada em 2017, atuamos com excelência no segmento de proteção veicular e consultoria.
                        Com mais de 10 anos de experiência no setor e mais de <span className="text-gold-500 font-bold">300 profissionais formados</span>.
                    </p>
                </header>
            </div>

            {/* Mission Vision Values Grid */}
            <section className="px-6 md:px-12 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Missão */}
                    <Card className="p-8 border-gold-500/20 bg-gradient-to-br from-obsidian-900 to-obsidian-950">
                        <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center mb-6 text-gold-500">
                            <Target size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-theme-text">Missão</h3>
                        <p className="text-theme-muted leading-relaxed">
                            Impactar vidas e transformar pessoas por meio de oportunidades profissionais no setor automotivo.
                        </p>
                    </Card>

                    {/* Visão */}
                    <Card className="p-8 border-gold-500/20 bg-gradient-to-br from-obsidian-900 to-obsidian-950">
                        <div className="w-12 h-12 bg-signal-500/10 rounded-full flex items-center justify-center mb-6 text-signal-500">
                            <Eye size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-theme-text">Visão</h3>
                        <p className="text-theme-muted leading-relaxed">
                            Ser referência nacional em consultoria, capacitação e liderança em proteção veicular.
                        </p>
                    </Card>

                    {/* Valores */}
                    <Card className="p-8 border-gold-500/20 bg-gradient-to-br from-obsidian-900 to-obsidian-950">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                            <Heart size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-theme-text">Valores</h3>
                        <ul className="space-y-3 text-theme-muted">
                            <li className="flex items-center gap-2"><Award size={16} className="text-gold-500" /> Comprometimento</li>
                            <li className="flex items-center gap-2"><Award size={16} className="text-gold-500" /> Integridade</li>
                            <li className="flex items-center gap-2"><TrendingUp size={16} className="text-gold-500" /> Crescimento Contínuo</li>
                            <li className="flex items-center gap-2"><Users size={16} className="text-gold-500" /> Liderança com Propósito</li>
                            <li className="flex items-center gap-2"><Users size={16} className="text-gold-500" /> Trabalho em Equipe</li>
                        </ul>
                    </Card>
                </div>
            </section>

            {/* Partners Section */}
            <section className="px-6 md:px-12 max-w-[1600px] mx-auto">
                <SectionTitle title="Liderança" subtitle="Conheça quem faz acontecer" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                    {activePartners.map((partner, idx) => (
                        <div key={idx} className="group relative">
                            {/* Image Container */}
                            <div className="aspect-video w-full overflow-hidden rounded-sm relative mb-4 bg-obsidian-900 border border-white/5">
                                <img
                                    src={partner.image}
                                    alt={partner.name}
                                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
                                />
                            </div>

                            {/* Bio Content */}
                            <div className="bg-obsidian-900/50 border border-white/5 p-6 rounded-sm backdrop-blur-sm group-hover:bg-obsidian-900 group-hover:border-gold-500/30 transition-all duration-300">
                                <div className="mb-4">
                                    <span className="text-signal-500 font-bold text-xs tracking-[0.2em] uppercase mb-1 block">
                                        {partner.role}
                                    </span>
                                    <h3 className="text-2xl font-serif font-bold text-theme-text">
                                        {partner.name.split(' ')[0]} <span className="text-gold-500">{partner.name.split(' ').slice(1).join(' ')}</span>
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    {partner.bio.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-theme-muted group-hover:text-gray-300 transition-colors">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Empresas Parceiras */}
            <section className="px-6 md:px-12 mt-24 max-w-[1600px] mx-auto text-center">
                <div className="mb-12">
                    <span className="text-gold-500 font-bold tracking-[0.2em] text-sm uppercase">Parcerias</span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-theme-text mt-2">Empresas Parceiras</h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 items-stretch justify-center">
                    {[
                        { name: 'Auto Vale', logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a9/12/21/a91221e9-c268-a94b-3986-62c30998eea8/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/1200x630wa.png', alt: 'Auto Vale Proteção Veicular' },
                        { name: 'AGV Proteção', logo: '/images/partners/agv.png', alt: 'AGV Proteção' },
                        { name: 'Eleva Mais', logo: 'https://elevamais.org/wp-content/uploads/2025/05/Foto-Capa-Branding-Elevamais-Protecao-Veicular.png', alt: 'Eleva Mais Proteção' },
                        { name: 'Protebem', logo: '/images/partners/protebem.png', alt: 'Protebem' },
                        { name: 'APVS Brasil', logo: '/images/partners/apvs.png', alt: 'APVS Brasil' }
                    ].map((partner, index) => (
                        <div key={index} className="flex flex-col items-center gap-6 group cursor-pointer transition-all duration-500">
                            {/* Modern Logo Container (Glassmorphism + Silhouette) */}
                            <div className="relative w-full aspect-[4/3] flex items-center justify-center rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.08] backdrop-blur-md group-hover:bg-white/[0.07] group-hover:border-gold-500/30 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),0_0_25px_rgba(212,175,55,0.15)] transition-all duration-700">
                                {/* Ambient Glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/0 via-gold-500/0 to-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                
                                <div className="relative z-10 w-full h-full p-10 flex items-center justify-center transition-all duration-700 group-hover:p-8">
                                    <img
                                        src={partner.logo}
                                        alt={partner.alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="max-w-full max-h-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 will-change-transform"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                const fallback = document.createElement('span');
                                                fallback.className = 'text-gold-500/80 font-serif text-2xl font-bold tracking-tighter italic select-none text-center';
                                                fallback.innerText = partner.name;
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Label */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-theme-muted font-bold text-[10px] sm:text-xs group-hover:text-gold-500 transition-all duration-500 uppercase tracking-[0.3em] transform group-hover:translate-y-[-2px]">
                                    {partner.name}
                                </span>
                                <div className="h-[2px] w-0 bg-gold-500 rounded-full transition-all duration-700 group-hover:w-12 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default About;
