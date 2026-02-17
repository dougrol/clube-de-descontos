-- 1. Create affiliate_products table
CREATE TABLE IF NOT EXISTS public.affiliate_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  price numeric NOT NULL,
  affiliate_url text NOT NULL,
  category text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create affiliate_clicks table
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.affiliate_products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS products_active_created_idx ON public.affiliate_products (active, created_at DESC);
CREATE INDEX IF NOT EXISTS clicks_product_created_idx ON public.affiliate_clicks (product_id, created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- affiliate_products Policies
-- Allow Read Access for everyone (Anon and Authenticated)
CREATE POLICY "Allow public read access" ON public.affiliate_products
  FOR SELECT
  USING (true);

-- Allow Insert/Update/Delete only for Service Role (Admin) - Usually handled by dashboard, but explicitly denying public write is good practice
-- Note: By default, if no policy exists for an operation, it is denied. So we only needed the SELECT policy above.

-- affiliate_clicks Policies
-- Allow anyone to insert a click (tracking)
CREATE POLICY "Allow public insert tracking" ON public.affiliate_clicks
  FOR INSERT
  WITH CHECK (true);

-- Deny SELECT/UPDATE/DELETE public access (Implicit by not creating policies)

-- 6. (Optional) Grant usage to anon and authenticated roles if needed (depending on strict Supabase config)
GRANT SELECT ON public.affiliate_products TO anon, authenticated;
GRANT INSERT ON public.affiliate_clicks TO anon, authenticated;
