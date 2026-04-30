-- 1. Cria uma função SECURITY DEFINER para checar se o usuário é admin
-- Isso roda com privilégios de bypass RLS na tabela admin_users e evita o loop infinito.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true
  );
$$;

-- 2. Remove a política antiga da tabela admin_users
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;

-- 3. Cria a nova política usando a função
CREATE POLICY "Admins can read admin_users"
    ON public.admin_users
    FOR SELECT
    USING (
        auth.uid() = user_id OR public.is_admin()
    );

-- 4. Remove a política antiga da tabela logs_acesso
DROP POLICY IF EXISTS "Admins can view all logs" ON public.logs_acesso;

-- 5. Cria a nova política usando a função
CREATE POLICY "Admins can view all logs"
    ON public.logs_acesso
    FOR SELECT
    USING (
        public.is_admin()
    );
