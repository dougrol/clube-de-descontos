/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
    fallbackComponent?: React.ReactNode;
    showSkeleton?: boolean;
    aspectRatio?: 'square' | 'video' | '4/3' | '3/2' | 'auto';
    objectFit?: 'cover' | 'contain' | 'fill';
    loading?: 'lazy' | 'eager';
}

const aspectRatioClasses = {
    'square': 'aspect-square',
    'video': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    'auto': ''
};

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
    src,
    alt,
    className = '',
    fallbackSrc,
    fallbackComponent,
    showSkeleton = true,
    aspectRatio = 'auto',
    objectFit = 'cover',
    loading = 'lazy',
    ...props
}) => {
    const [status, setStatus] = useState<'loading' | 'error' | 'loaded'>(() => {
        // If no valid src supplied, start in error state so we don't render a blank img
        if (!src || (typeof src === 'string' && src.trim() === '')) return 'error';
        return 'loading';
    });

    const [currentSrc, setCurrentSrc] = useState<string | undefined>(() => {
        if (!src || (typeof src === 'string' && src.trim() === '')) return undefined;
        return src as string;
    });

    useEffect(() => {
        if (!src || (typeof src === 'string' && src.trim() === '')) {
            setCurrentSrc(undefined);
            setStatus('error');
            return;
        }
        setCurrentSrc(src as string);
        setStatus('loading');
    }, [src]);

    const handleError = () => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
        } else {
            setStatus('error');
        }
    };

    const handleLoad = () => {
        setStatus('loaded');
    };

    const objectFitClass = {
        'cover': 'object-cover',
        'contain': 'object-contain',
        'fill': 'object-fill'
    }[objectFit];

    const aspectClass = aspectRatioClasses[aspectRatio];

    if (status === 'error' || !currentSrc) {
        if (fallbackComponent) {
            return <>{fallbackComponent}</>;
        }
        return (
            <div className={`flex items-center justify-center bg-obsidian-900 text-gray-600 rounded-lg ${aspectClass} ${className}`}>
                <ImageOff size={24} className="opacity-50" />
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
            {status === 'loading' && showSkeleton && (
                <div className="absolute inset-0 bg-obsidian-900 animate-pulse flex items-center justify-center z-10 rounded-lg">
                    <Loader2 size={20} className="text-gray-600 animate-spin" />
                </div>
            )}

            {currentSrc && (
                <img
                    src={currentSrc}
                alt={alt}
                loading={loading}
                decoding="async"
                className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                onError={handleError}
                onLoad={handleLoad}
                {...props}
                />
            )}
        </div>
    );
};

