-- Migration: RLS policies, RPC wrapper for partners and grants
-- IMPORTANT: review and run in staging first. These policies assume JWT claims:
--   - jwt.claims.user_id -> user's UUID
--   - jwt.claims.role -> 'user' | 'partner' | 'admin' | 'service_role'
--   - jwt.claims.partner_id -> partner UUID for partner users

-- 0) Add additional column if missing
ALTER TABLE IF EXISTS public.coupons
  ADD COLUMN IF NOT EXISTS validated_by uuid;

-- 1) Ensure index for case-insensitive lookups (unique if safe)
-- If you have existing duplicate codes, create a non-unique index first and resolve duplicates before adding UNIQUE.
CREATE INDEX IF NOT EXISTS idx_coupons_code_lower ON public.coupons (lower(code));

-- Optional: create unique index (run only after verifying no duplicates)
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_coupons_code_lower ON public.coupons (lower(code));

-- 2) RPC wrapper for partners — uses caller's jwt.claims.partner_id
CREATE OR REPLACE FUNCTION public.consume_coupon_for_caller(p_code text)
RETURNS SETOF public.coupons
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_partner_id uuid;
BEGIN
  BEGIN
    p_partner_id := current_setting('jwt.claims.partner_id', true)::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'missing_partner_claim';
  END;

  IF p_partner_id IS NULL THEN
    RAISE EXCEPTION 'missing_partner_claim';
  END IF;

  RETURN QUERY
  UPDATE public.coupons
  SET status = 'used', used_at = now(), validated_by = p_partner_id
  WHERE lower(code) = lower(p_code)
    AND partner_id = p_partner_id
    AND status = 'active'
  RETURNING *;
END;
$$;

-- 3) Enable RLS and set conservative policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- SELECT: users can select their own coupons
CREATE POLICY if_not_exists_select_user_coupons ON public.coupons
  FOR SELECT
  USING (user_id = current_setting('jwt.claims.user_id', true)::uuid);

-- SELECT: partners can select coupons for their partner (limited view)
CREATE POLICY if_not_exists_select_partner_coupons ON public.coupons
  FOR SELECT
  USING (
    current_setting('jwt.claims.role', true) = 'partner'
    AND partner_id = current_setting('jwt.claims.partner_id', true)::uuid
  );

-- SELECT: admins can select all
CREATE POLICY if_not_exists_select_admin_coupons ON public.coupons
  FOR SELECT
  USING (current_setting('jwt.claims.role', true) = 'admin');

-- INSERT: authenticated users may insert coupons only for themselves; service_role may insert for migration/scripts
CREATE POLICY if_not_exists_insert_user_coupons ON public.coupons
  FOR INSERT
  WITH CHECK (
    (user_id = current_setting('jwt.claims.user_id', true)::uuid)
    OR (current_setting('jwt.claims.role', true) = 'service_role')
  );

-- UPDATE: disallow direct updates by partners/users; only service_role (or SECURITY DEFINER functions) may update
CREATE POLICY if_not_exists_update_service_only ON public.coupons
  FOR UPDATE
  USING (current_setting('jwt.claims.role', true) = 'service_role');

-- DELETE: disallow for authenticated roles (admin/service can delete via service-role)
CREATE POLICY if_not_exists_delete_none ON public.coupons
  FOR DELETE
  USING (current_setting('jwt.claims.role', true) = 'service_role');

-- 4) Grant execute on RPCs
GRANT EXECUTE ON FUNCTION public.consume_coupon(text, uuid) TO postgres; -- management (service role)
GRANT EXECUTE ON FUNCTION public.consume_coupon_for_caller(text) TO authenticated;

-- 5) Safety notes (manual steps)
-- • After applying this migration, test the RPC in staging:
--   SELECT * FROM public.consume_coupon_for_caller('TRV-XXXX');
-- • Ensure your JWT includes `partner_id` claim for partner users (Supabase: add a custom claim in JWT or sync via meta).
-- • Run data cleanup to remove any local/test coupons before enabling UNIQUE index.
