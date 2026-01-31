import { supabase } from './supabaseClient';

// Generate unique coupon code — higher entropy (production-safe)
const generateCouponCode = (): string => {
    // Use crypto.randomUUID() and a short base36 slice to increase entropy
    // Example output: TRV-5F3A8C9D2
    try {
        const raw = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
        return `TRV-${raw}`;
    } catch (err) {
        // Fallback to previous method if crypto.randomUUID() isn't available
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const prefix = 'TRV';
        let code = '';
        for (let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${prefix}-${code}`;
    }
};

export interface Coupon {
    id: string;
    code: string;
    user_id: string;
    user_name?: string;
    partner_id: string;
    partner_name: string;
    benefit: string;
    status: 'active' | 'used' | 'expired';
    expires_at: string;
    used_at?: string;
    created_at: string;
}

/**
 * Generate a new coupon for a user at a specific partner
 */
export const generateCoupon = async (
    userId: string,
    userName: string,
    partnerId: string,
    partnerName: string,
    benefit: string
): Promise<Coupon | null> => {
    try {
        const code = generateCouponCode();
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

        const { data, error } = await supabase
            .from('coupons')
            .insert({
                code,
                user_id: userId,
                user_name: userName,
                partner_id: partnerId,
                partner_name: partnerName,
                benefit,
                status: 'active',
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating coupon:', error);
            // If table doesn't exist, create coupon in memory only
            if (error.code === '42P01') {
                return createLocalCoupon(code, userId, userName, partnerId, partnerName, benefit, expiresAt);
            }
            return null;
        }

        return data as Coupon;
    } catch (err) {
        console.error('Error generating coupon:', err);
        return null;
    }
};

/**
 * Create a local coupon (fallback when DB not available)
 * NOTE: disabled in production to avoid client-side forgery
 */
const createLocalCoupon = (
    code: string,
    userId: string,
    userName: string,
    partnerId: string,
    partnerName: string,
    benefit: string,
    expiresAt: Date
): Coupon => {
    if (import.meta.env.PROD) {
        console.error('createLocalCoupon blocked: local fallback is disabled in production');
        throw new Error('local_fallback_disabled_in_production');
    }

    const coupon: Coupon = {
        id: crypto.randomUUID(),
        code,
        user_id: userId,
        user_name: userName,
        partner_id: partnerId,
        partner_name: partnerName,
        benefit,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    };

    // Store in localStorage as backup (dev only)
    const storedCoupons = JSON.parse(localStorage.getItem('coupons') || '[]');
    storedCoupons.push(coupon);
    localStorage.setItem('coupons', JSON.stringify(storedCoupons));

    return coupon;
};

/**
 * Validate a coupon by code
 */
export const validateCoupon = async (code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
    try {
        // Try database first
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error) {
            // Fallback to localStorage
            return validateLocalCoupon(code);
        }

        const coupon = data as Coupon;

        // Check if expired
        if (new Date(coupon.expires_at) < new Date()) {
            return { valid: false, error: 'Cupom expirado' };
        }

        // Check if already used
        if (coupon.status === 'used') {
            return { valid: false, error: 'Cupom já utilizado' };
        }

        return { valid: true, coupon };
    } catch (err) {
        console.error('Error validating coupon:', err);
        return validateLocalCoupon(code);
    }
};

/**
 * Server-side validation (partners should call this endpoint). Performs an authenticated, atomic "validate + consume" on the server.
 */
export const validateCouponServer = async (code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
    const adminUrl = (import.meta.env.VITE_ADMIN_SERVER_URL || 'http://localhost:3001').replace(/\/+$/, '');

    // Try to get an authenticated session token (if available)
    let token = '';
    try {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token ?? '';
    } catch (err) {
        // ignore - call may still be allowed with API key
    }

    try {
        const resp = await fetch(`${adminUrl}/partner/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ code })
        });

        const json = await resp.json().catch(() => ({}));

        if (resp.status === 200 && json.valid) {
            return { valid: true, coupon: json.coupon as Coupon };
        }

        if (resp.status === 409) return { valid: false, error: json.error || 'already_used_or_invalid' };
        if (resp.status === 404) return { valid: false, error: 'not_found' };

        return { valid: false, error: json.error || 'validation_failed' };
    } catch (err) {
        console.error('validateCouponServer error:', err);
        return { valid: false, error: 'network_error' };
    }
};

/**
 * Validate coupon from localStorage (DEV only)
 */
const validateLocalCoupon = (code: string): { valid: boolean; coupon?: Coupon; error?: string } => {
    if (import.meta.env.PROD) {
        // In production we must not trust client-side storage
        return { valid: false, error: 'local_validation_disabled_in_production' };
    }

    const storedCoupons: Coupon[] = JSON.parse(localStorage.getItem('coupons') || '[]');
    const coupon = storedCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
        return { valid: false, error: 'Cupom não encontrado' };
    }

    if (new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: 'Cupom expirado' };
    }

    if (coupon.status === 'used') {
        return { valid: false, error: 'Cupom já utilizado' };
    }

    return { valid: true, coupon };
};

/**
 * Mark coupon as used
 */
export const markCouponAsUsed = async (couponId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('coupons')
            .update({
                status: 'used',
                used_at: new Date().toISOString()
            })
            .eq('id', couponId);

        if (error) {
            // Fallback to localStorage
            return markLocalCouponAsUsed(couponId);
        }

        return true;
    } catch (err) {
        console.error('Error marking coupon as used:', err);
        return markLocalCouponAsUsed(couponId);
    }
};

/**
 * Mark local coupon as used (DEV only)
 */
const markLocalCouponAsUsed = (couponId: string): boolean => {
    if (import.meta.env.PROD) {
        console.error('markLocalCouponAsUsed blocked in production');
        return false;
    }

    const storedCoupons: Coupon[] = JSON.parse(localStorage.getItem('coupons') || '[]');
    const couponIndex = storedCoupons.findIndex(c => c.id === couponId);

    if (couponIndex === -1) return false;

    storedCoupons[couponIndex].status = 'used';
    storedCoupons[couponIndex].used_at = new Date().toISOString();
    localStorage.setItem('coupons', JSON.stringify(storedCoupons));

    return true;
};

export const getCouponRemainingTime = (expiresAt: string): string => {
    const diff = new Date(expiresAt).getTime() - Date.now();

    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min ${seconds}s`;
};

/**
 * Get all coupons for a specific user
 */
export const getUserCoupons = async (userId: string): Promise<Coupon[]> => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user coupons:', error);
            // Fallback to localStorage
            return getLocalUserCoupons(userId);
        }

        // Update expired status
        const now = new Date();
        const updatedCoupons = (data as Coupon[]).map(coupon => {
            if (coupon.status === 'active' && new Date(coupon.expires_at) < now) {
                return { ...coupon, status: 'expired' as const };
            }
            return coupon;
        });

        return updatedCoupons;
    } catch (err) {
        console.error('Error getting user coupons:', err);
        return getLocalUserCoupons(userId);
    }
};

/**
 * Get local coupons for a user
 */
const getLocalUserCoupons = (userId: string): Coupon[] => {
    if (import.meta.env.PROD) return [];

    const storedCoupons: Coupon[] = JSON.parse(localStorage.getItem('coupons') || '[]');
    const now = new Date();

    return storedCoupons
        .filter(c => c.user_id === userId)
        .map(coupon => {
            if (coupon.status === 'active' && new Date(coupon.expires_at) < now) {
                return { ...coupon, status: 'expired' as const };
            }
            return coupon;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};
