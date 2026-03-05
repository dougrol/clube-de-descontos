-- Add placa and birth_date columns to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS placa TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Update status check to include 'inadimplente'
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE public.members ADD CONSTRAINT members_status_check 
  CHECK (status IN ('active', 'inactive', 'overdue', 'inadimplente'));
