import React, { useEffect } from 'react';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

interface SplashProps {
  onFinish: () => void;
}

const partnerAssociations = [
  { name: 'Elevamais', logo: 'https://elevamais.org/wp-content/uploads/2025/05/Foto-Capa-Branding-Elevamais-Protecao-Veicular.png' },
  { name: 'AGV', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjxA4WhVJYldBDvC542WyVsqlPhdl2poQONw&s' },
  { name: 'Autovale', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWN3TvLukevIdp8lse0L3FeEIz6YOWGw-Tcg&s' }
];

const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 px-6">
      <div className="relative animate-pulse-slow flex flex-col items-center mt-32">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500 blur-[90px] opacity-15 rounded-full animate-pulse pointer-events-none" />

        <div className="relative flex flex-col items-center animate-slide-up z-10">
          {/* Shield Logo - Fixed dimensions to prevent cutting */}
          <ImageWithFallback
            src="/images/logo_shield_v2_transparent.png"
            alt="Escudo Tavares Car"
            className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 mb-6 drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            objectFit="contain"
            showSkeleton={false}
            loading="eager"
          />

          <h2 className="text-[#D4AF37] text-xs tracking-[0.3em] font-serif uppercase opacity-80">
            Clube de Descontos
          </h2>
        </div>
      </div>

      {/* Partner Associations */}
      <div className="absolute bottom-24 w-full px-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <p className="text-gray-600 text-[9px] uppercase tracking-[0.2em] text-center mb-4">
          Associações Parceiras
        </p>
        <div className="flex items-center justify-center gap-5">
          {partnerAssociations.map((partner, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white p-2 shadow-lg">
                <ImageWithFallback
                  src={partner.logo}
                  alt={partner.name}
                  className="w-full h-full rounded-full"
                  objectFit="contain"
                  showSkeleton={true}
                />
              </div>
              <span className="text-gray-500 text-[8px] mt-1.5 uppercase tracking-wider font-medium">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 text-gray-700 text-[9px] animate-fade-in delay-500 uppercase tracking-[0.15em] font-medium">
        v2.0.0
      </div>
    </div>
  );
};

export default Splash;