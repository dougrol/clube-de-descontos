import React, { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
    fallbackComponent?: React.ReactNode;
    showSkeleton?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
    src,
    alt,
    className = '',
    fallbackSrc,
    fallbackComponent,
    showSkeleton = true,
    ...props
}) => {
    const [status, setStatus] = useState<'loading' | 'error' | 'loaded'>('loading');
    const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

    useEffect(() => {
        setStatus('loading');
        setCurrentSrc(src);
    }, [src]);

    const handleError = () => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            // Se tiver uma src de fallback e ainda não estivermos nela, tenta carregar
            setCurrentSrc(fallbackSrc);
            // Mantém status loading até a fallback carregar (a img vai disparar onLoad ou onError de novo)
        } else {
            // Se não tem fallbackSrc ou já falhou nele
            setStatus('error');
        }
    };

    const handleLoad = () => {
        setStatus('loaded');
    };

    if (status === 'error') {
        if (fallbackComponent) {
            return <>{fallbackComponent}</>;
        }
        return (
            <div className={`flex items-center justify-center bg-gray-800 text-gray-600 ${className}`}>
                <ImageOff size={24} />
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {status === 'loading' && showSkeleton && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center z-10">
                    <Loader2 size={24} className="text-gray-600 animate-spin" />
                </div>
            )}

            <img
                src={currentSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                onError={handleError}
                onLoad={handleLoad}
                {...props}
            />
        </div>
    );
};
