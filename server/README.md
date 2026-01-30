Admin server to create/upsert `public.users` using Supabase service_role key.

Quickstart

1. Set environment variables (do NOT commit these):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
PORT=8787 # optional
```

2. Run:

```bash
node server/admin-server-secure.js
```

3. Call the endpoint (example):

```bash
curl -X POST http://localhost:8787/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \\
  -d '{"id":"<user-uuid>","email":"user@example.com","name":"User Name","role":"USER"}'
```

Notes
- Keep this server in a trusted environment (backend). Never expose `SUPABASE_SERVICE_ROLE_KEY` to clients.
- You can wire this endpoint to a webhook after `signUp` (client calls your backend), or call it from an Edge Function with restricted access.
