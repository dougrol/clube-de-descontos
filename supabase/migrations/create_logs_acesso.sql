-- ====================================================================
-- Tabela de Logs de Acesso
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.logs_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    tipo_usuario TEXT, -- 'ADMIN', 'PARTNER', 'USER'
    status TEXT, -- 'SUCESSO', 'FALHA'
    mensagem TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- Segurança (RLS - Row Level Security)
-- ====================================================================

ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all logs"
    ON public.logs_acesso
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.ativo = true
        )
    );

-- Insert público autenticado ou anônimo (pois logs de falha não têm UID)
CREATE POLICY "Anyone can insert logs"
    ON public.logs_acesso
    FOR INSERT
    WITH CHECK (true);
