-- Add actions column to partners table if not exists
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS actions jsonb DEFAULT '[]'::jsonb;

-- Example Partners updates provided by user

-- 1) Chaveiro Pantanal 24 horas (Goiânia)
-- Assuming 'ID_CHAVEIRO' is the UUID for this partner
/*
UPDATE public.partners
SET actions = '[
  { "type": "whatsapp", "label": "WhatsApp", "value": "5562994935965" },
  { "type": "phone", "label": "Ligar", "value": "62994935965" },
  { "type": "maps", "label": "Traçar rota", "value": "Esquina com - Avenida Tóquio, R. Castro Alves, Qd 65 - Lt 11 - Parque Industrial Joao Bras, Goiânia - GO, 74483-550" }
]'::jsonb
WHERE name ILIKE '%Chaveiro Pantanal%';
*/

-- 2) Abs guinchos (Brasília e entorno)
/*
UPDATE public.partners
SET actions = '[
  { "type": "whatsapp", "label": "WhatsApp", "value": "5561983202521" },
  { "type": "phone", "label": "Ligar", "value": "61983202521" },
  { "type": "email", "label": "E-mail", "value": "absguincho49@gmail.com" },
  { "type": "instagram", "label": "Instagram", "value": "https://www.instagram.com/abs_guincho?igsh=Y2VnMWU4OTY4djJk&utm_source=qr" }
]'::jsonb
WHERE name ILIKE '%Abs guinchos%';
*/
