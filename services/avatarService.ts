import { supabase } from './supabaseClient';

const BUCKET_NAME = 'avatars';

/**
 * Upload an avatar image for a user
 * @param userId - The user's ID (used as folder name)
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.');
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo: 2MB.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    try {
        const { data: existingFiles } = await supabase.storage
            .from(BUCKET_NAME)
            .list(userId);

        if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
            await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
        }
    } catch (err) {
        console.warn('Could not clean old avatars:', err);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Erro ao fazer upload. Tente novamente.');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Upload a partner logo or cover image
 * @param partnerId - The partner's ID
 * @param file - The image file to upload
 * @param type - 'logo' or 'cover'
 * @returns The public URL of the uploaded image
 */
export async function uploadPartnerImage(partnerId: string, file: File, type: 'logo' | 'cover'): Promise<string> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.');
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo: 2MB.');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `partners/${partnerId}/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Erro ao fazer upload. Tente novamente.');
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Update the user's avatar_url in the database
 * @param userId - The user's ID
 * @param avatarUrl - The new avatar URL
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

    if (error) {
        console.error('Error updating avatar URL:', error);
        throw new Error('Erro ao salvar avatar no perfil.');
    }
}

/**
 * Update partner logo or cover URL in the database
 * @param partnerId - The partner's ID
 * @param url - The new image URL
 * @param type - 'logo' or 'cover'
 */
export async function updatePartnerImage(partnerId: string, url: string, type: 'logo' | 'cover'): Promise<void> {
    const field = type === 'logo' ? 'logo_url' : 'cover_url';

    const { error } = await supabase
        .from('partners')
        .update({ [field]: url })
        .eq('id', partnerId);

    if (error) {
        console.error('Error updating partner image:', error);
        throw new Error('Erro ao salvar imagem do parceiro.');
    }
}
