import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, ShoppingBag, ShieldCheck, Gem, LogOut, X, ArrowRight, Tag } from 'lucide-react';
import { Card, SectionTitle, Button, ImageWithFallback } from '../components/ui';
import { fetchPartners } from '../services/partners';
import { useNavigate } from 'react-router-dom';
import { Partner } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCMS } from '../contexts/CMSContext';
import { supabase } from '../services/supabaseClient';
import { WaveBackground } from '../components/WaveBackground';
import { AppGrid } from '../components/AppGrid';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getContent } = useCMS();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load partners from Supabase
    fetchPartners().then(data => {
      setPartners(data);
    });

    // Fetch user avatar from database
    const fetchAvatar = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error('Error fetching avatar:', err);
      }
    };
    fetchAvatar();
  }, [user?.id]);

  const featuredPartners = partners.slice(0, 5);
  const displayAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.name || 'User'}&background=D4AF37&color=000`;
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Membro';

  return (
    <div className="relative min-h-screen bg-obsidian-950 font-sans text-white overflow-hidden pb-32">

      {/* 1. Dynamic Wave Background */}
      <WaveBackground />

      {/* Main Content Container */}
      <div className="relative z-10 px-6 pt-8 md:pt-12 max-w-md mx-auto md:max-w-4xl lg:max-w-6xl">

        {/* 2. Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white">
              Olá, <span className="text-gold-500 font-bold">{firstName}</span>
            </h1>
            <p className="text-gray-400 text-xs md:text-sm">Bem-vindo ao seu Clube Exclusive</p>
          </div>

          <div onClick={() => navigate('/profile')} className="relative cursor-pointer group">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/10 p-1 group-hover:border-gold-500 transition-colors duration-300">
              <ImageWithFallback
                src={displayAvatar}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
                fallbackSrc={`https://ui-avatars.com/api/?name=${user?.user_metadata?.name || 'User'}&background=D4AF37&color=000`}
              />
            </div>
          </div>
        </header>

        {/* 3. Hero Card (Super App Style) */}
        <div className="mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative w-full bg-gradient-to-br from-white to-gray-100 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl shadow-white/5">

            {/* Card Content */}
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-black/5 rounded-full text-[10px] font-bold tracking-widest text-gray-500 mb-4 uppercase">
                Tavares Car
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-obsidian-950 leading-[0.9] mb-4">
                O seu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-400">
                  Super App
                </span> <br />
                de benefícios!
              </h2>
              <p className="text-gray-500 text-sm max-w-[200px] mb-6 leading-tight">
                Proteção, descontos e serviços exclusivos em um só lugar.
              </p>

              <Button
                onClick={() => navigate('/loja')}
                variant="signal"
                className="rounded-full px-6 shadow-lg shadow-signal-500/20 hover:shadow-signal-500/40 transition-all font-bold text-xs"
              >
                ACESSAR LOJA <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>

            {/* Decorative Elements inside Card */}
            <div className="absolute right-0 bottom-0 w-[60%] h-full pointer-events-none">
              <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              {/* Abstract Shapes resembling the logo/waves */}
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl transform translate-x-12 translate-y-12"></div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-signal-400/10 rounded-full blur-2xl"></div>

              {/* Optional: Add a phone mockup or shield image here if we had one */}
              {/* For now, just abstract luxury waves */}
              <svg className="absolute bottom-0 right-0 w-full h-full opacity-10 text-obsidian-900" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M45.7,-76.3C58.9,-69.3,69.1,-59.1,76.3,-47.2C83.5,-35.3,87.6,-21.7,85.8,-8.9C84,3.9,76.3,15.9,68.4,27.3C60.5,38.7,52.3,49.5,42.1,58.3C31.9,67.1,19.7,73.9,6.7,76.1C-6.3,78.3,-20.1,75.9,-32.4,69.5C-44.7,63.1,-55.5,52.7,-64.3,40.8C-73.1,28.9,-79.9,15.5,-80.6,1.8C-81.3,-11.9,-75.9,-25.9,-67.2,-37.9C-58.5,-49.9,-46.5,-59.9,-34.2,-67.3C-21.9,-74.7,-9.3,-79.5,2.1,-82.9C13.5,-86.3,27,-88.3,45.7,-76.3Z" transform="translate(100 100)" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3.5 Consultancy Highlight (New) */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div onClick={() => navigate('/consultancy')} className="bg-gradient-to-r from-purple-900 to-obsidian-900 rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden group cursor-pointer shadow-lg shadow-purple-900/10">
            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1 block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                  Consultoria Especializada
                </span>
                <h3 className="text-lg font-bold text-white mb-1">Escola de Negócios</h3>
                <p className="text-gray-400 text-xs max-w-[180px] leading-relaxed">Treinamentos exclusivos para alta performance em vendas.</p>
              </div>
              <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <ArrowRight size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Feature Grid (Replaces Bento) */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="font-bold text-white text-lg">O que você precisa?</h3>
          </div>
          <AppGrid />
        </div>

        {/* 5. Partners Carousel */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="font-bold text-white text-lg">Clube de Vantagens</h3>
            <button onClick={() => navigate('/benefits')} className="text-gold-500 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors">Ver Todos</button>
          </div>

          <div className="relative w-full overflow-hidden -mx-6 px-6 md:mx-0 md:px-0">
            <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x">
              {featuredPartners.map((partner, idx) => (
                <div key={idx} className="snap-start shrink-0 w-[260px]">
                  <Card
                    onClick={() => navigate(`/benefits/${partner.id}`)}
                    className="h-[320px] p-0 border-0 bg-obsidian-900 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 shadow-xl shadow-black/50"
                  >
                    <div className="h-[65%] relative">
                      <ImageWithFallback
                        src={partner.coverUrl}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        alt={partner.name}
                        fallbackSrc="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80" // Generic business image
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 to-transparent opacity-80"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-xl font-bold text-white leading-tight mb-1">{partner.name}</h4>
                        <span className="text-[10px] uppercase tracking-wider text-gold-500 font-bold bg-black/30 backdrop-blur px-2 py-1 rounded-full">
                          {partner.category}
                        </span>
                      </div>
                    </div>
                    <div className="h-[35%] p-5 bg-obsidian-900 relative">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                        <Tag size={12} className="text-gold-500" />
                        <span className="line-clamp-1">{partner.benefit}</span>
                      </div>
                      <button className="w-full py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-gold-500 hover:text-black transition-colors">
                        USAR DESCONTO
                      </button>
                    </div>
                  </Card>
                </div>
              ))}

              {/* View All Card */}
              <div className="snap-start shrink-0 w-[100px] flex items-center justify-center">
                <button
                  onClick={() => navigate('/benefits')}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-gold-500 hover:text-black transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;