-- 1. Primeiro, crie um usuário comum pelo aplicativo (Tela de Registro /register)
-- 2. Depois, rode este comando no SQL Editor do Supabase para torná-lo Admin

-- Substitua 'seu_email@email.com' pelo email do usuário que você criou
UPDATE public.users
SET role = 'ADMIN'
WHERE email = 'seu_email@email.com';

-- Verifique se a atualização funcionou
SELECT * FROM public.users WHERE role = 'ADMIN';
