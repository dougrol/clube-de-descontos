-- ============================================================
-- Tabela: associados_universo_agv
-- Importação de planilhas da Associação Universo AGV
-- Campos: nome, telefone, placa (com normalização)
-- ============================================================

CREATE TABLE IF NOT EXISTS associados_universo_agv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  placa text NOT NULL,
  telefone_normalizado text,
  placa_normalizada text,
  origem text DEFAULT 'Universo AGV',
  status_cadastro text DEFAULT 'pendente',
  arquivo_origem text,
  data_importacao timestamptz DEFAULT now(),
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice UNIQUE para deduplicação por placa normalizada
CREATE UNIQUE INDEX IF NOT EXISTS idx_associados_universo_agv_placa_normalizada
  ON associados_universo_agv (placa_normalizada);

-- ============================================================
-- RLS: Restrito SOMENTE a usuários com role = 'ADMIN'
-- ============================================================
ALTER TABLE associados_universo_agv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on associados_universo_agv"
  ON associados_universo_agv
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND upper(users.role) = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND upper(users.role) = 'ADMIN'
    )
  );
