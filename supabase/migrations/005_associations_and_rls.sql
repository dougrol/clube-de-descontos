-- ==========================================
-- 1. Create tables
-- ==========================================

-- Associations table
CREATE TABLE IF NOT EXISTS public.associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    phone TEXT,
    association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'overdue')),
    valid_until DATE,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Association Partners join table
CREATE TABLE IF NOT EXISTS public.association_partners (
    association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    custom_benefit TEXT,
    PRIMARY KEY (association_id, partner_id)
);

-- ==========================================
-- 2. Add RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_partners ENABLE ROW LEVEL SECURITY;
-- Ensurance that partners also have RLS enabled
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RLS Policies
-- ==========================================

-- Admin policy (Service Role usually bypasses RLS, but just to be safe if a custom admin role is added)
-- For simplicity, full access for authenticated users is disabled. We create strict read policies.

-- Policy: Members can only read their own profile
CREATE POLICY "Members can view own profile"
    ON public.members
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Policy: Anyone logged in can read active associations (for listing or general lookups, if needed)
CREATE POLICY "Users can read active associations"
    ON public.associations
    FOR SELECT
    USING (active = true);

-- Policy: Members can view association_partners ONLY for their own association
-- We use a subquery to find the current user's association_id
CREATE POLICY "Members can view their association partners"
    ON public.association_partners
    FOR SELECT
    USING (
        association_id IN (
            SELECT association_id FROM public.members WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Members can view actual partners IF there is an active link in association_partners 
-- AND the partner itself is active. AND the association is active.
CREATE POLICY "Members can view allowed partners"
    ON public.partners
    FOR SELECT
    USING (
        active = true 
        AND id IN (
            SELECT ap.partner_id 
            FROM public.association_partners ap
            JOIN public.associations a ON a.id = ap.association_id
            WHERE ap.association_id IN (
                SELECT association_id FROM public.members WHERE auth_user_id = auth.uid()
            )
            AND ap.active = true
            AND a.active = true
        )
    );

-- Restrict Insert/Update/Delete - Only service_role can do this via Edge Function
-- (Supabase service_role bypasses RLS by default, so we don't need explicit policies for it)
