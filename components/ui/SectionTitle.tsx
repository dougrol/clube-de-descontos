import React from 'react';

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className = '' }) => {
    return (
        <div className={`mb-8 ${className}`}>
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-wider">
                    {title}
                </h2>
                <div className="h-px bg-gold-500/50 flex-1"></div>
            </div>
            {subtitle && (
                <p className="text-gray-400 text-sm md:text-base max-w-2xl font-light">
                    {subtitle}
                </p>
            )}
        </div>
    );
};
