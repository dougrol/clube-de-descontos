-- Store Module Migration: Create Tables
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. PRODUCTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_original NUMERIC(10,2) NOT NULL,
  price_discount NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Products sold by partners in the store';
COMMENT ON COLUMN public.products.active IS 'Only ADMIN can set to true (product approval)';

-- ===========================================
-- 2. ORDERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created' 
    CHECK (status IN ('created','pending_payment','paid','canceled','refunded','shipped','delivered')),
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'User purchase orders';

-- ===========================================
-- 3. ORDER_ITEMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.order_items IS 'Individual items in an order';

-- ===========================================
-- 4. PAYMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','paid','failed','canceled','refunded')),
  method TEXT CHECK (method IN ('pix','card')),
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  checkout_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Payment records from Mercado Pago';

-- ===========================================
-- 5. INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_products_partner ON public.products(partner_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON public.orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_payment_id);

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
SELECT 'Store tables created successfully!' as result;
