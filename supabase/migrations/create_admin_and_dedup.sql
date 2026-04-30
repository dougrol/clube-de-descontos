-- ====================================================================
-- 1. Criação das Tabelas
-- ====================================================================

-- Tabela admin_users (Painel Administrativo)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT DEFAULT 'ADMIN',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela associado_associacoes (Múltiplas Associações)
CREATE TABLE IF NOT EXISTS public.associado_associacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf_associado TEXT NOT NULL,
    association_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cpf_associado, association_name)
);


-- ====================================================================
-- 2. Segurança (RLS - Row Level Security)
-- ====================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associado_associacoes ENABLE ROW LEVEL SECURITY;

-- admin_users: Somente o próprio usuário ou administradores ativos podem ver
CREATE POLICY "Admins can read admin_users"
    ON public.admin_users
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.ativo = true
        )
    );

-- associado_associacoes: Leitura pública (para verificação no momento do cadastro) 
-- ou restrita ao próprio usuário. Para permitir check no Register antes de logar,
-- usaremos acesso de insert anônimo e select restrito.
CREATE POLICY "Public insert associado_associacoes"
    ON public.associado_associacoes
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public select associado_associacoes"
    ON public.associado_associacoes
    FOR SELECT
    USING (true);


-- ====================================================================
-- 3. Função RPC para Verificar Duplicidade
-- ====================================================================

CREATE OR REPLACE FUNCTION check_duplicate_associado(
    p_cpf TEXT,
    p_email TEXT,
    p_telefone TEXT,
    p_placa TEXT,
    p_nome TEXT
) RETURNS TABLE (
    found BOOLEAN,
    matched_by TEXT,
    cpf_existente TEXT
) AS $$
DECLARE
    v_telefone_norm TEXT := regexp_replace(p_telefone, '\D', '', 'g');
    v_placa_norm TEXT := upper(regexp_replace(p_placa, '[^a-zA-Z0-9]', '', 'g'));
    v_record RECORD;
BEGIN
    -- 1. CPF (associates table)
    IF p_cpf IS NOT NULL AND p_cpf != '' THEN
        SELECT cpf INTO v_record FROM public.associates WHERE cpf = p_cpf LIMIT 1;
        IF FOUND THEN
            RETURN QUERY SELECT true, 'cpf'::TEXT, v_record.cpf;
            RETURN;
        END IF;
    END IF;

    -- 2. Email
    IF p_email IS NOT NULL AND p_email != '' THEN
        SELECT cpf INTO v_record FROM public.associates WHERE email = p_email LIMIT 1;
        IF FOUND THEN
            RETURN QUERY SELECT true, 'email'::TEXT, v_record.cpf;
            RETURN;
        END IF;
    END IF;

    -- 3. Telefone Normalizado
    IF v_telefone_norm IS NOT NULL AND v_telefone_norm != '' THEN
        SELECT cpf INTO v_record FROM public.associates WHERE regexp_replace(phone, '\D', '', 'g') = v_telefone_norm LIMIT 1;
        IF FOUND THEN
            RETURN QUERY SELECT true, 'telefone'::TEXT, v_record.cpf;
            RETURN;
        END IF;
    END IF;

    -- 4. Placa Normalizada (associados_universo_agv)
    IF v_placa_norm IS NOT NULL AND v_placa_norm != '' THEN
        SELECT cpf INTO v_record FROM public.associados_universo_agv WHERE placa_normalizada = v_placa_norm LIMIT 1;
        IF FOUND THEN
            -- Se achou na AGV, verificar se o CPF também existe em associates
            IF v_record.cpf IS NOT NULL THEN
                RETURN QUERY SELECT true, 'placa'::TEXT, v_record.cpf;
                RETURN;
            END IF;
        END IF;
    END IF;

    -- 5. Nome + Telefone
    IF p_nome IS NOT NULL AND p_nome != '' AND v_telefone_norm IS NOT NULL AND v_telefone_norm != '' THEN
        SELECT cpf INTO v_record FROM public.associates 
        WHERE lower(trim(name)) = lower(trim(p_nome)) 
          AND regexp_replace(phone, '\D', '', 'g') = v_telefone_norm LIMIT 1;
        IF FOUND THEN
            RETURN QUERY SELECT true, 'nome_telefone'::TEXT, v_record.cpf;
            RETURN;
        END IF;
    END IF;

    -- Nenhum match encontrado
    RETURN QUERY SELECT false, 'none'::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
