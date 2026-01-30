import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'signal';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    className = '',
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-white text-black hover:bg-gray-200",
        secondary: "bg-gray-800 text-white hover:bg-gray-700",
        outline: "border border-gray-700 bg-transparent hover:bg-gray-800 text-white",
        ghost: "hover:bg-gray-800 text-white",
        signal: "bg-signal-500 text-white hover:bg-signal-600 shadow-[0_0_20px_rgba(255,69,0,0.3)]"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
