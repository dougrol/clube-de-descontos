import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
    return (
        <div
            className={`rounded-2xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
