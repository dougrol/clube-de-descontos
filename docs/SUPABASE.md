# Supabase — Configuração e Integração (Tavares Car)

Este documento descreve como configurar o Supabase para este projeto, políticas RLS recomendadas e um exemplo de trigger para popular a tabela `users` quando um Auth user é criado.

## Variáveis de ambiente (frontend)
- `VITE_SUPABASE_URL` — URL do seu projeto Supabase (ex: `https://xyzcompany.supabase.co`).
- `VITE_SUPABASE_ANON_KEY` — Chave anônima do Supabase (apenas para operações permitidas por RLS).
- `VITE_ADMIN_URL` — (opcional) URL do backend seguro que insere/upsert em `public.users` (ex: `http://localhost:8787`).

Coloque-as em um arquivo `.env` na raiz (não commitá-lo):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...
VITE_ADMIN_URL=http://localhost:8787
```

Reinicie o Vite após alterar as variáveis.

## Recomendações de segurança
- Nunca colocar a `service_role` key no frontend.
- Configure Row Level Security (RLS) nas tabelas sensíveis (ex: `users`, `partners`) e defina policies mínimas necessárias.
- Para operações administrativas (ex.: escrever em `users` automaticamente), use uma função server-side (Edge Function, serverless) que possua a `service_role` key e exponha apenas endpoints autenticados.

## Problema comum: `users.role` não existe
O app tenta ler `role` da tabela `users` em `contexts/AuthContext.tsx`. O Supabase Auth cria apenas o registro de autenticação (no schema `auth.users`) e não popula automaticamente sua tabela de aplicação (`public.users`). Por isso é comum que a query `.from('users').select('role')` retorne vazia.

### Duas soluções comuns
1. Trigger SQL que insere/atualiza a tabela `public.users` quando um usuário Auth é criado.
2. Um backend (Edge Function) chamado pelo client após `signUp` que insere a linha usando a `service_role` key.

A opção mais simples e segura é usar uma trigger no lado do banco:

## Trigger SQL de exemplo (rodar no SQL Editor do Supabase)

```sql
-- Cria tabela de aplicação (se ainda não existir)
create table if not exists public.users (
  id uuid primary key,
  email text,
  name text,
  role text default 'USER',
  plan text,
  created_at timestamptz default now()
);

-- Função para inserir/atualizar registro quando auth.user é criado
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
as $$
begin
  -- Upsert em public.users usando os dados do payload
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta->>'name', coalesce(new.raw_user_meta->>'role', 'USER'))
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role;

  return new;
end;
$$;

-- Criar trigger no schema auth (evento quando um usuário é criado)
create trigger auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_auth_user_created();
```

Observações:
- Em alguns projetos a tabela `auth.users` não é diretamente acessível devido a permissões; se necessário, crie uma função que seja executada com privilégios adequados (ou use Supabase Functions).
- Ajuste os campos do `raw_user_meta` conforme o que você envia no `signUp` (por exemplo `options.data`).

## Políticas RLS de exemplo para leitura do role (permitir leitura do próprio usuário)

```sql
-- Habilitar RLS
alter table public.users enable row level security;

-- Policy para permitir que um usuário leia sua própria linha
create policy "users_can_select_own" on public.users
  for select
  using (auth.uid() = id);

-- Policy para permitir que o frontend leia o role de qualquer usuário (se você optar por isso)
-- Atenção: abrir leitura geral pode expor roles ao público.
create policy "public_read_roles" on public.users
  for select
  using (true);
```

Recomendações: prefira políticas restritivas e, se precisar expor a role a partir do frontend, avalie adicionar um endpoint que retorne somente os dados necessários.

## Integração no projeto
- `services/supabaseClient.ts` deve referenciar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- `contexts/AuthContext.tsx` chama `supabase.from('users').select('role')` — para que isso funcione sem falhas, garanta que a tabela `public.users` exista e que as policies permitam a operação.
- `screens/Register.tsx` pode tentar inserir a linha em `public.users` após `signUp`; isso funciona apenas se as policies permitirem inserts pelo anon key.

## Resolução de erros comuns
- Erro: `Missing Supabase environment variables` — verifique seu `.env` e reinicie o dev server.
- Erro: `permission denied for relation users` — ajuste RLS/policies ou use um backend com `service_role` para executar a escrita.

---
Se quiser, eu posso:
- adicionar um endpoint de Edge Function que cria o registro `users` de forma segura com `service_role`;
- colocar um script SQL pronto em `scripts/create_supabase_triggers.sql` no repositório;
- ou atualizar o `README.md` principal com um resumo desta documentação.

Qual opção prefere que eu adicione ao repo em seguida?

---

## Exemplo seguro (endpoint backend com JWT e Rate Limit)

Uma opção segura é expor um endpoint backend que recebe os dados do usuário (após `signUp`) e insere/upsert na tabela `public.users` usando a `service_role` key. O servidor implementa:

1. **User JWT validation**: Usuários enviam seu `access_token` após `signUp`
2. **Admin JWT validation**: Serviços internos enviam um token admin (assinado com `ADMIN_SECRET`)
3. **Rate limiting**: máx. 10 requisições por minuto por IP

### Setup backend

Defina no servidor:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
ADMIN_SECRET=your-secret-key-for-jwt-tokens
PORT=8787
node server/admin-server-secure.js
```

### Uso do cliente (após signUp)

```bash
curl -X POST http://localhost:8787/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
  -d '{
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "plan": "Basic"
  }'
```

Respostas:
- `200/201` — sucesso
- `401` — token inválido/expirado
- `403` — acesso negado (user JWT tentando criar outro usuário)
- `429` — rate limited

### Uso do admin (serviços internos)

Gere um token admin:
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, 'your-secret-key-for-jwt-tokens', { expiresIn: '24h' });
console.log(token);
```

Envie-o:
```bash
curl -X POST http://localhost:8787/create-user \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <ADMIN_JWT>" \
  -d '{
    "id": "<uuid>",
    "email": "user@example.com",
    "name": "User Name",
    "role": "PARTNER"
  }'
```

Veja `server/README-SECURE.md` para mais detalhes.