import React from 'react';
import { Instagram, ArrowRight, ExternalLink } from 'lucide-react';
import { SOCIAL_LINKS } from '../constants';
import { Button } from '../components/ui';
import { WaveBackground } from '../components/WaveBackground';

const Social: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      <WaveBackground />

      <div className="relative z-10 w-full max-w-sm text-center animate-slide-up">
        {/* Instagram Icon Glow */}
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-[2rem] blur-xl opacity-50 animate-pulse-slow"></div>
          <div className="relative w-full h-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-[2rem] flex items-center justify-center p-1 shadow-2xl">
            <div className="bg-black w-full h-full rounded-[1.8rem] flex items-center justify-center">
              <Instagram size={48} className="text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
          Siga a <span className="text-gold-500">Tavares Car</span>
        </h1>

        <p className="text-gray-400 mb-10 leading-relaxed">
          Acompanhe nossos stories, novidades e o dia a dia da consultoria automotiva líder de mercado.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => window.open(SOCIAL_LINKS.instagram, '_blank')}
            variant="signal"
            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-signal-500/20 hover:scale-105 transition-transform"
          >
            <Instagram className="mr-2" size={24} />
            ACESSAR INSTAGRAM
            <ExternalLink className="ml-2 opacity-70" size={16} />
          </Button>

          <p className="text-xs text-gray-500 uppercase tracking-widest mt-8">
            @tavares_car_oficial_
          </p>
        </div>
      </div>
    </div>
  );
};

export default Social;