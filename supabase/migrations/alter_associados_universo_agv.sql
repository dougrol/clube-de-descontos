-- ============================================================
-- Alteração: associados_universo_agv
-- Adiciona campos para controle de primeiro acesso
-- ============================================================

ALTER TABLE public.associados_universo_agv
ADD COLUMN IF NOT EXISTS primeiro_acesso_realizado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_primeiro_acesso timestamptz,
ADD COLUMN IF NOT EXISTS cadastro_completo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS email text;

-- ============================================================
-- Policy extra: Permitir que o RLS deixe a nova função ler/atualizar
-- Como a tabela era restrita apenas a ADMINS, precisamos liberar
-- leitura para qualquer um (para validar a placa)
-- e update para autenticados?
-- Não! A validação de placa ocorre ANTES do login (anon).
-- Então precisamos liberar SELECT para anon/authenticated.
-- E UPDATE será feito após o login (authenticated), mas apenas
-- se o usuário for o dono ou na transição.
-- Mas a política atual é: "Admin full access on associados_universo_agv" (ALL para ADMINS).
-- ============================================================

-- Permite consultar placa publicamente (apenas para ver se existe)
CREATE POLICY "Public read access on associados_universo_agv"
ON public.associados_universo_agv
FOR SELECT
USING (true);

-- Permite que usuários autenticados atualizem seu próprio registro (após vinculação) ou registros pendentes (na hora de vincular)
CREATE POLICY "Users can update their own AGV record"
ON public.associados_universo_agv
FOR UPDATE
USING (
  user_id = auth.uid() OR
  (user_id IS NULL AND primeiro_acesso_realizado = false)
)
WITH CHECK (
  user_id = auth.uid() OR
  (user_id IS NULL AND primeiro_acesso_realizado = false)
);
