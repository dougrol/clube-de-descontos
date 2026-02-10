import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'signal';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
        primary: "bg-white text-black hover:bg-gray-200",
        secondary: "bg-gray-800 text-white hover:bg-gray-700",
        outline: "border border-gray-700 bg-transparent hover:bg-gray-800 text-white",
        ghost: "hover:bg-gray-800 text-white",
        signal: "bg-signal-500 text-white hover:bg-signal-600 shadow-[0_0_20px_rgba(255,69,0,0.3)]"
    };

    // Mobile-optimized: min 44px (sm), 48px (md), 52px (lg) for touch targets
    const sizes = {
        sm: "h-11 px-4 text-sm min-w-[44px]",
        md: "h-12 px-5 py-2.5 min-w-[48px]",
        lg: "h-14 px-6 text-lg min-w-[52px]"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : null}
            {children}
        </button>
    );
};
