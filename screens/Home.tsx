import React, { useEffect, useState } from 'react';
import { Tag, ShieldCheck, Instagram, ArrowRight, Key, Megaphone, Gem } from 'lucide-react';
import { Card, SectionTitle, Button } from '../components/ui';
import { fetchPartners } from '../services/partners';
import { useNavigate } from 'react-router-dom';
import { Partner } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCMS } from '../contexts/CMSContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getContent } = useCMS();

  const [loaded, setLoaded] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    setLoaded(true);
    // Load partners from Supabase
    fetchPartners().then(data => {
      setPartners(data);
    });
  }, []);

  const featuredPartners = partners.slice(0, 5);

  return (
    <div className="pb-32 bg-obsidian-950 min-h-screen font-sans selection:bg-signal-500 selection:text-white">

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[85vh] flex flex-col justify-between p-6 md:p-12 overflow-hidden">
        {/* Background Noise & Gradient */}
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

        {/* Top Bar */}
        <header className="relative z-20 flex justify-between items-start animate-fade-in delay-100">
          <div>
            <span className="block text-xs md:text-sm font-bold tracking-[0.3em] text-gray-400 mb-2">
              {getContent('home_intro_est', 'EST. 2024')}
            </span>
            <h3 className="text-xl font-serif text-white">TAVARES <span className="text-gold-500">CAR</span></h3>
          </div>

          <div onClick={() => navigate('/profile')} className="group flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors hidden md:block">
              Bem-vindo, {user?.user_metadata?.name?.split(' ')[0] || 'Membro'}
            </span>
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-sm border border-white/20 p-0.5 relative group-hover:border-signal-500 transition-colors">
              <img
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.name || 'User'}&background=D4AF37&color=000`}
                alt="Profile"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-signal-500 border-2 border-black"></div>
            </div>
          </div>
        </header>

        {/* MASSIVE TYPOGRAPHY HERO */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-[10vw] leading-[0.85] font-serif font-black text-white mix-blend-difference opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {getContent('home_hero_title_1', 'CLUBE DE')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-700">
              {getContent('home_hero_title_2', 'VANTAGENS')}
            </span>
          </h1>
          <div className="mt-8 flex flex-col md:flex-row gap-6 md:items-center opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-gray-400 max-w-md text-sm md:text-lg leading-relaxed border-l border-signal-500 pl-4">
              {getContent('home_hero_subtitle', 'Experiência exclusiva em proteção veicular e benefícios de alto padrão. Redefinindo o conceito de clube.')}
            </p>
            <Button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} variant="signal" className="w-[180px] md:w-[220px]">
              EXPLORAR
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hidden md:flex items-center gap-4 animate-bounce">
          <span className="h-px w-12 bg-gray-700"></span>
          <span className="text-xs uppercase tracking-widest text-gray-500">Scroll</span>
        </div>
      </section>

      <div id="services" className="px-6 md:px-12 py-20 space-y-24 max-w-[1600px] mx-auto">

        {/* --- BENTO GRID SERVICES --- */}
        <section>
          <SectionTitle title="Nossos Pilares" subtitle="Soluções completas para seu estilo de vida" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

            {/* Quem Somos (About) */}
            <div
              onClick={() => navigate('/about')}
              className="col-span-1 md:col-span-1 bg-obsidian-900 border border-white/5 p-6 group cursor-pointer hover:bg-gold-500 hover:text-black transition-all duration-300 rounded-sm min-h-[250px] flex flex-col justify-between"
            >
              <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <Gem size={24} className="text-gold-500 group-hover:text-black transition-colors" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Quem Somos</h3>
                <p className="text-sm text-gray-500 group-hover:text-black/70">Nossa história, missão e liderança.</p>
              </div>
            </div>

            {/* Proteção Veicular (Main Feature - Span 2) */}
            <div
              onClick={() => navigate('/protection')}
              className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-obsidian-900 border border-white/5 p-8 md:p-12 relative group cursor-pointer overflow-hidden rounded-sm hover:border-gold-500/30 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/80 to-transparent"></div>

              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="bg-gold-500 w-12 h-12 flex items-center justify-center mb-6 text-black">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">Proteção <br /> Veicular</h3>
                <p className="text-gray-400 max-w-sm mb-6">Cobertura premium 24h, rastreamento via satélite e assistência completa para seu patrimônio.</p>
                <div className="flex items-center text-gold-500 font-bold tracking-widest text-xs uppercase group-hover:translate-x-2 transition-transform">
                  Ver Detalhes <ArrowRight size={14} className="ml-2" />
                </div>
              </div>
            </div>

            {/* Consultoria */}
            <div
              onClick={() => navigate('/consultancy')}
              className="bg-obsidian-900 border border-white/5 p-6 group cursor-pointer hover:bg-gold-500 hover:text-black transition-all duration-300 rounded-sm min-h-[250px] flex flex-col justify-between"
            >
              <Key size={32} className="text-gray-600 group-hover:text-black transition-colors" />
              <div>
                <h3 className="text-xl font-bold mb-2">Consultoria</h3>
                <p className="text-sm text-gray-500 group-hover:text-black/70">Gestão para Associações e Treinamentos.</p>
              </div>
            </div>

            {/* Financeiro / Parcerias */}
            <div
              onClick={() => navigate('/partnership')}
              className="bg-obsidian-900 border border-white/5 p-6 group cursor-pointer hover:bg-signal-500 hover:text-white transition-all duration-300 rounded-sm min-h-[250px] flex flex-col justify-between"
            >
              <Megaphone size={32} className="text-gray-600 group-hover:text-white transition-colors" />
              <div>
                <h3 className="text-xl font-bold mb-2">Parcerias & Financeiro</h3>
                <p className="text-sm text-gray-500 group-hover:text-white/80">Soluções de crédito e consórcios (TL+).</p>
              </div>
            </div>

            {/* Social CTA */}
            <div
              onClick={() => navigate('/social')}
              className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-white/5 p-6 flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all rounded-sm"
            >
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px] rounded-full">
                  <div className="bg-black w-full h-full rounded-full flex items-center justify-center">
                    <Instagram size={32} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">@tavarescar</h3>
                  <p className="text-gray-400">Acompanhe nosso lifestyle.</p>
                </div>
              </div>
              <div className="h-12 w-12 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ArrowRight size={20} />
              </div>
            </div>

          </div>
        </section>

        {/* --- CLUBE SECTION (Ticker Style) --- */}
        <section className="relative border-t border-white/5 pt-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <SectionTitle
              title={getContent('home_partners_title', 'Exclusive Club')}
              subtitle={getContent('home_partners_subtitle', 'Parceiros selecionados')}
            />
            <Button onClick={() => navigate('/benefits')} variant="outline" className="w-auto px-8 py-3 mb-8 md:mb-0">
              VER TODOS OS PARCEIROS
            </Button>
          </div>

          <div className="relative w-full overflow-hidden">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-obsidian-950 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-obsidian-950 to-transparent z-10"></div>

            {/* Carousel */}
            <div className="flex gap-6 animate-marquee w-max hover:[animation-play-state:paused]">
              {[...featuredPartners, ...featuredPartners].map((partner, idx) => (
                <div key={`${partner.id}-${idx}`} className="w-[300px] md:w-[350px] shrink-0">
                  <Card onClick={() => navigate(`/benefits/${partner.id}`)} className="h-[400px] p-0 group bg-transparent border-white/5">
                    <div className="h-[60%] relative overflow-hidden">
                      <img src={partner.coverUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" alt={partner.name} />
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-xs font-bold px-3 py-1 border border-white/10 uppercase tracking-wider">
                        {partner.category}
                      </div>
                    </div>
                    <div className="h-[40%] p-6 bg-obsidian-900 border-t border-white/5 flex flex-col justify-between group-hover:bg-obsidian-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{partner.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2">{partner.description}</p>
                        </div>
                        <img src={partner.logoUrl} className="w-10 h-10 object-contain brightness-0 invert opacity-50" />
                      </div>
                      <div className="flex items-center gap-2 text-signal-500 text-sm font-bold">
                        <Tag size={14} />
                        {partner.benefit}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;