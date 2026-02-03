import React, { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

interface AvatarUploadProps {
    currentImageUrl?: string;
    onUpload: (file: File) => Promise<void>;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
}

const sizeMap = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
};

const iconSizeMap = {
    sm: 14,
    md: 18,
    lg: 22
};

const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentImageUrl,
    onUpload,
    size = 'lg',
    className = '',
    disabled = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClick = () => {
        if (!disabled && !isUploading) {
            inputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset error
        setError(null);

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Use JPG, PNG, WebP ou GIF');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Máximo 2MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro no upload';
            setError(errorMessage);
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
            // Reset input
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const displayUrl = previewUrl || currentImageUrl || 'https://ui-avatars.com/api/?name=U&background=333&color=D4AF37';

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || isUploading}
            />

            {/* Avatar container */}
            <div
                onClick={handleClick}
                className={`
                    ${sizeMap[size]} 
                    rounded-full 
                    overflow-hidden 
                    bg-gray-800 
                    border-2 border-gold-500/50
                    cursor-pointer
                    transition-all
                    hover:border-gold-500
                    hover:scale-105
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isUploading ? 'animate-pulse' : ''}
                `}
            >
                <img
                    src={displayUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                />

                {/* Overlay on hover */}
                {!disabled && !isUploading && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                        <Camera size={iconSizeMap[size]} className="text-white" />
                    </div>
                )}

                {/* Loading overlay */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                        <Loader2 size={iconSizeMap[size]} className="text-gold-500 animate-spin" />
                    </div>
                )}
            </div>

            {/* Edit button */}
            {!disabled && !isUploading && (
                <button
                    onClick={handleClick}
                    className="absolute bottom-0 right-0 bg-gold-500 text-black rounded-full p-1.5 border-2 border-black hover:bg-gold-400 transition-colors"
                >
                    <Camera size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} />
                </button>
            )}

            {/* Error message */}
            {error && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-red-500 text-xs flex items-center gap-1">
                    <X size={12} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default AvatarUpload;
