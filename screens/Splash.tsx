import React, { useEffect } from 'react';

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
          <h1 className="text-4xl font-serif font-bold text-[#D4AF37] tracking-wider text-center leading-tight">
            TAVARES CAR
          </h1>
          <p className="text-[#D4AF37] text-sm tracking-[0.4em] mt-2 font-serif uppercase opacity-90">
            Consultoria
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent my-4 opacity-50"></div>
          <h2 className="text-[#D4AF37] text-xs tracking-[0.3em] font-serif uppercase opacity-70">
            Clube de Descontos
          </h2>
        </div>
      </div>

      <div className="absolute bottom-12 text-gray-600 text-[10px] animate-fade-in delay-500 uppercase tracking-[0.2em] font-medium">
        v2.0.0
      </div>
    </div>
  );
};

export default Splash;