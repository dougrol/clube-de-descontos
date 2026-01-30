import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: 'default' | 'secondary' | 'outline' | 'gold' | 'dark';
}

export const Badge: React.FC<BadgeProps> = ({
    className = '',
    variant = 'default',
    children,
    ...props
}) => {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground border border-gray-600",
        gold: "bg-gold-500/20 text-gold-500 border border-gold-500/30",
        dark: "bg-obsidian-800 text-gray-300 border border-white/10"
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    );
};
