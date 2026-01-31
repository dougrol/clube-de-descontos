import { supabase } from './supabaseClient';

// Generate unique coupon code
const generateCouponCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const prefix = 'TRV';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
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

    // Store in localStorage as backup
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
 * Validate coupon from localStorage
 */
const validateLocalCoupon = (code: string): { valid: boolean; coupon?: Coupon; error?: string } => {
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
 * Mark local coupon as used
 */
const markLocalCouponAsUsed = (couponId: string): boolean => {
    const storedCoupons: Coupon[] = JSON.parse(localStorage.getItem('coupons') || '[]');
    const couponIndex = storedCoupons.findIndex(c => c.id === couponId);

    if (couponIndex === -1) return false;

    storedCoupons[couponIndex].status = 'used';
    storedCoupons[couponIndex].used_at = new Date().toISOString();
    localStorage.setItem('coupons', JSON.stringify(storedCoupons));

    return true;
};

/**
 * Get remaining time for coupon in formatted string
 */
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
