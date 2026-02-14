import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
            <div
                ref={modalRef}
                className="bg-obsidian-900 border border-obsidian-700 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg shadow-2xl overflow-hidden animate-scale-in max-h-[85vh] sm:max-h-[85vh] flex flex-col"
            >
                {/* Header - Fixed */}
                <div className="flex justify-between items-center p-4 border-b border-obsidian-800 shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors active:scale-95"
                        aria-label="Fechar"
                    >
                        <X size={24} />
                    </button>
                </div>
                {/* Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;

