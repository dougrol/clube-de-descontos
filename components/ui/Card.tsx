import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
    return (
        <div
            className={`rounded-xl border border-gray-800 bg-gray-900/50 p-4 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
