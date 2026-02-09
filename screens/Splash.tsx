import React, { useEffect } from 'react';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

interface SplashProps {
  onFinish: () => void;
}

const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="relative animate-pulse-slow flex flex-col items-center">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-500 blur-[90px] opacity-15 rounded-full animate-pulse pointer-events-none" />

        <div className="relative flex flex-col items-center animate-slide-up z-10">
          <ImageWithFallback
            src="/logo.png"
            alt="Tavares Car Logo"
            className="w-[140px] h-[140px] mb-8 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            showSkeleton={false}
            fallbackComponent={
              <svg width="140" height="140" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-8 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                <path d="M100 10 L180 40 V90 C180 145 100 190 100 190 C100 190 20 145 20 90 V40 L100 10 Z" stroke="#D4AF37" strokeWidth="5" fill="none" />
                <path d="M100 20 L170 45 V90 C170 135 100 175 100 175 C100 175 30 135 30 90 V45 L100 20 Z" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.4" />
                <text x="100" y="135" textAnchor="middle" fill="#D4AF37" fontFamily="'Playfair Display', serif" fontSize="100" fontWeight="bold">TC</text>
              </svg>
            }
          />

          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] tracking-wider text-center leading-tight">
            TAVARES CAR
          </h1>
          <p className="text-[#D4AF37] text-sm tracking-[0.4em] mt-2 font-serif uppercase opacity-90">
            Consultoria
          </p>
        </div>
      </div>

      <div className="absolute bottom-12 text-gray-500 text-[10px] animate-fade-in delay-500 uppercase tracking-[0.2em] font-medium">
        Clube de Vantagens
      </div>
    </div>
  );
};

export default Splash;