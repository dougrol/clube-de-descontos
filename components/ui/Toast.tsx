import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />
};

const bgColors = {
    success: 'bg-obsidian-900 border-green-500/20',
    error: 'bg-obsidian-900 border-red-500/20',
    info: 'bg-obsidian-900 border-blue-500/20'
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    return (
        <div className={`
      flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-md 
      animate-slide-in-right max-w-sm w-full pointer-events-auto
      ${bgColors[type]}
    `}>
            <div className="shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <p className="text-white text-sm flex-1">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};
