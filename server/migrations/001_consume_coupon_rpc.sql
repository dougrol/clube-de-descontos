-- Migration: atomic coupon consumption + index + RLS examples
-- 1) Create index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code_lower ON public.coupons (lower(code));

-- 2) Atomic RPC to consume a coupon for a partner
-- Returns the updated row when the coupon was active and belonged to the partner
CREATE OR REPLACE FUNCTION public.consume_coupon(p_code text, p_partner_id uuid)
RETURNS SETOF public.coupons
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.coupons
  SET status = 'used', used_at = now(), validated_by = p_partner_id
  WHERE lower(code) = lower(p_code)
    AND partner_id = p_partner_id
    AND status = 'active'
  RETURNING *;
END;
$$;

-- 3) Example RLS policies (adjust role names to your tenant setup)
-- Allow SELECT for authenticated users on their own coupons
-- CREATE POLICY "users_select_own_coupons" ON public.coupons
--   FOR SELECT
--   USING (user_id = current_setting('jwt.claims.user_id', true)::uuid);

-- Prevent direct UPDATE by partners; require calling the RPC (server enforces)
-- CREATE POLICY "no_direct_update_partners" ON public.coupons
--   FOR UPDATE
--   USING (current_setting('jwt.claims.role', true) = 'service_role');

-- Notes:
-- • Deploy this migration using your normal DB migration tooling (pg_migrate, supabase migrations, flyway, etc.).
-- • Ensure the RPC is granted to the partner role or expose it via a secure RPC-only endpoint.
-- • Rotate service-role keys and verify audit logs after migration.
