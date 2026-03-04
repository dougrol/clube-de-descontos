import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'lg' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
    }[maxWidth];

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 backdrop-blur-sm animate-fade-in p-4">
            <div
                ref={modalRef}
                className={`flex flex-col bg-obsidian-900 border border-obsidian-700 rounded-xl w-full ${maxWidthClass} shadow-2xl overflow-hidden animate-scale-in max-h-[90vh]`}
            >
                {/* Header - Fixed */}
                <div className="flex justify-between items-center p-4 border-b border-obsidian-800 shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-theme-text">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-theme-muted hover:text-theme-text transition-colors active:scale-95"
                        aria-label="Fechar"
                    >
                        <X size={24} />
                    </button>
                </div>
                {/* Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;

