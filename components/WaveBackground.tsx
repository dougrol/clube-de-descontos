import React from 'react';

export const WaveBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Background Base */}
            <div className="absolute inset-0 bg-obsidian-950"></div>

            {/* Gradient Orb (Top Right) */}
            <div className="absolute -top-[10%] -right-[10%] w-[70%] h-[50%] bg-gold-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>

            {/* Gradient Orb (Bottom Left) */}
            <div className="absolute -bottom-[10%] -left-[10%] w-[70%] h-[50%] bg-gold-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

            {/* Waves SVG */}
            <svg
                className="absolute top-0 left-0 w-full h-[60vh] opacity-30"
                viewBox="0 0 1440 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <path
                    d="M0 400C200 450 400 350 600 400C800 450 1000 550 1200 500C1400 450 1440 400 1440 400V0H0V400Z"
                    fill="url(#paint0_linear)"
                    className="animate-float"
                    style={{ animationDuration: '8s' }}
                />
                <path
                    d="M0 350C250 400 500 300 750 350C1000 400 1250 450 1440 400V0H0V350Z"
                    fill="url(#paint1_linear)"
                    className="animate-float"
                    style={{ animationDuration: '12s', animationDelay: '-2s' }}
                />
                <defs>
                    <linearGradient id="paint0_linear" x1="720" y1="0" x2="720" y2="500" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#D4AF37" stopOpacity="0.1" />
                        <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="720" y1="0" x2="720" y2="400" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#B4932A" stopOpacity="0.15" />
                        <stop offset="1" stopColor="#B4932A" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Bottom Wave (Reverse) */}
            <svg
                className="absolute bottom-0 left-0 w-full h-[40vh] opacity-20 rotate-180"
                viewBox="0 0 1440 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <path
                    d="M0 200C300 150 600 250 900 200C1200 150 1440 200 1440 200V400H0V200Z"
                    fill="#D4AF37"
                    fillOpacity="0.05"
                />
            </svg>
        </div>
    );
};
