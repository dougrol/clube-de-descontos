import { supabase } from './supabaseClient';
import {
    Product,
    ProductDB,
    Order,
    OrderDB,
    OrderItem,
    OrderItemDB,
    Payment,
    PaymentDB,
    OrderStatus,
    PaymentStatus,
    PaymentMethod
} from '../types';

// ===========================================
// PRODUCT MAPPERS
// ===========================================

const mapProductFromDB = (p: ProductDB): Product => ({
    id: p.id,
    partnerId: p.partner_id,
    title: p.title,
    description: p.description || '',
    priceOriginal: p.price_original,
    priceDiscount: p.price_discount,
    stock: p.stock,
    active: p.active,
    imageUrl: p.image_url || '',
    createdAt: p.created_at
});

const mapOrderFromDB = (o: OrderDB): Order => ({
    id: o.id,
    userId: o.user_id,
    partnerId: o.partner_id,
    status: o.status as OrderStatus,
    totalAmount: o.total_amount,
    createdAt: o.created_at
});

const mapOrderItemFromDB = (oi: OrderItemDB): OrderItem => ({
    id: oi.id,
    orderId: oi.order_id,
    productId: oi.product_id,
    quantity: oi.quantity,
    unitPrice: oi.unit_price,
    createdAt: oi.created_at
});

const mapPaymentFromDB = (p: PaymentDB): Payment => ({
    id: p.id,
    orderId: p.order_id,
    provider: p.provider,
    providerPaymentId: p.provider_payment_id || '',
    status: p.status as PaymentStatus,
    method: p.method as PaymentMethod,
    pixQrCode: p.pix_qr_code,
    pixQrCodeBase64: p.pix_qr_code_base64,
    checkoutUrl: p.checkout_url,
    createdAt: p.created_at
});

// ===========================================
// PRODUCTS
// ===========================================

export const fetchActiveProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      partners (name)
    `)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return (data || []).map((p: ProductDB & { partners?: { name: string } }) => ({
        ...mapProductFromDB(p),
        partnerName: p.partners?.name
    }));
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      partners (name)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return {
        ...mapProductFromDB(data),
        partnerName: data.partners?.name
    };
};

export const fetchProductsByPartner = async (partnerId: string): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching partner products:', error);
        return [];
    }

    return (data || []).map(mapProductFromDB);
};

export const createProduct = async (product: Omit<ProductDB, 'id' | 'created_at'>): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    if (error) {
        console.error('Error creating product:', error);
        return null;
    }

    return mapProductFromDB(data);
};

export const updateProduct = async (id: string, updates: Partial<ProductDB>): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        return null;
    }

    return mapProductFromDB(data);
};

export const toggleProductActive = async (id: string, active: boolean): Promise<boolean> => {
    const { error } = await supabase
        .from('products')
        .update({ active })
        .eq('id', id);

    if (error) {
        console.error('Error toggling product active:', error);
        return false;
    }

    return true;
};

// ===========================================
// ORDERS
// ===========================================

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      partners (name),
      order_items (*),
      payments (*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user orders:', error);
        return [];
    }

    return (data || []).map((o: OrderDB & {
        partners?: { name: string };
        order_items?: OrderItemDB[];
        payments?: PaymentDB[];
    }) => ({
        ...mapOrderFromDB(o),
        partnerName: o.partners?.name,
        items: (o.order_items || []).map(mapOrderItemFromDB),
        payment: o.payments?.[0] ? mapPaymentFromDB(o.payments[0]) : undefined
    }));
};

export const fetchOrderById = async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      partners (name),
      order_items (
        *,
        products (title, image_url)
      ),
      payments (*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }

    return {
        ...mapOrderFromDB(data),
        partnerName: data.partners?.name,
        items: (data.order_items || []).map((oi: OrderItemDB & { products?: { title: string; image_url: string } }) => ({
            ...mapOrderItemFromDB(oi),
            productTitle: oi.products?.title,
            productImageUrl: oi.products?.image_url
        })),
        payment: data.payments?.[0] ? mapPaymentFromDB(data.payments[0]) : undefined
    };
};

export const fetchAllOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      partners (name),
      payments (status)
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all orders:', error);
        return [];
    }

    return (data || []).map((o: OrderDB & {
        partners?: { name: string };
        payments?: { status: string }[];
    }) => ({
        ...mapOrderFromDB(o),
        partnerName: o.partners?.name,
        payment: o.payments?.[0] ? { status: o.payments[0].status as PaymentStatus } as Payment : undefined
    }));
};

// ===========================================
// PAYMENT - Call Edge Function
// ===========================================

export interface CreatePaymentRequest {
    productId: string;
    quantity: number;
    method: 'pix' | 'card';
}

export interface CreatePaymentResponse {
    success: boolean;
    orderId?: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    checkoutUrl?: string;
    error?: string;
}

export const createPayment = async (request: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('mp_create_payment', {
            body: request
        });

        if (error) {
            console.error('Error calling mp_create_payment:', error);
            return { success: false, error: error.message };
        }

        return data as CreatePaymentResponse;
    } catch (err) {
        console.error('Error creating payment:', err);
        return { success: false, error: 'Erro ao processar pagamento' };
    }
};

// ===========================================
// PRODUCT IMAGES
// ===========================================

export const uploadProductImage = async (file: File, productId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading product image:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
};
