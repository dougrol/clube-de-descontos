-- Store Module Migration: RLS Policies
-- Run this in Supabase SQL Editor AFTER creating tables

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PRODUCTS POLICIES
-- ===========================================

-- Anyone logged in can read active products
CREATE POLICY "products_select_active" ON public.products
  FOR SELECT TO authenticated
  USING (active = true);

-- Admins can do everything with products
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Partners can view their own products (including inactive)
CREATE POLICY "products_partner_select_own" ON public.products
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'PARTNER'
      AND u.partner_id = products.partner_id
    )
  );

-- Partners can insert products for their store (defaults to active=false)
CREATE POLICY "products_partner_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'PARTNER'
      AND u.partner_id = partner_id
    )
    AND active = false  -- New products must be inactive (pending approval)
  );

-- Partners can update their own products (except 'active' field)
CREATE POLICY "products_partner_update" ON public.products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'PARTNER'
      AND u.partner_id = products.partner_id
    )
  )
  WITH CHECK (
    active = (SELECT active FROM public.products WHERE id = products.id)  -- Cannot change active status
  );

-- ===========================================
-- ORDERS POLICIES
-- ===========================================

-- Users can view their own orders
CREATE POLICY "orders_user_select" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create orders for themselves
CREATE POLICY "orders_user_insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can see and manage all orders
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Partners can view orders for their products
CREATE POLICY "orders_partner_select" ON public.orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'PARTNER'
      AND u.partner_id = orders.partner_id
    )
  );

-- ===========================================
-- ORDER_ITEMS POLICIES
-- ===========================================

-- Users can view their own order items
CREATE POLICY "order_items_user_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Users can insert items into their own orders
CREATE POLICY "order_items_user_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Admins can manage all order items
CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ===========================================
-- PAYMENTS POLICIES
-- ===========================================

-- Users can view payments for their orders
CREATE POLICY "payments_user_select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Admins can manage all payments
CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Service role can insert/update payments (for Edge Functions)
-- Note: Edge Functions use service_role key which bypasses RLS

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
SELECT 'RLS policies created successfully!' as result;
