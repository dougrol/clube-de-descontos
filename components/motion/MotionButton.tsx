import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface MotionButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const MotionButton: React.FC<MotionButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    ...props
}) => {
    const baseStyles = 'font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/50';

    const variants: Record<string, string> = {
        primary: 'bg-gold-500 text-black hover:bg-gold-400',
        secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
        ghost: 'bg-transparent text-gold-500 hover:bg-gold-500/10',
    };

    const sizes: Record<string, string> = {
        sm: 'px-4 py-2 text-xs rounded-lg',
        md: 'px-6 py-3 text-sm rounded-xl',
        lg: 'px-8 py-4 text-base rounded-xl',
    };

    return (
        <motion.button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <motion.span
                    className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            ) : (
                children
            )}
        </motion.button>
    );
};

export default MotionButton;
