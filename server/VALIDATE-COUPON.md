Endpoint: POST /partner/validate
Purpose: validar e consumir (atomicamente) um cupom — apenas parceiros autorizados ou scripts administrativos podem marcar um cupom como `used`.

Authentication options
- Partner JWT: Authorization: Bearer <access_token> (o token Supabase do parceiro). Server valida role=PARTNER e `partner_id` no registro de usuário.
- Admin API key: X-Admin-Api-Key: <ADMIN_API_KEY> (script/admin). Quando usado, enviar `partner_id` no body.
- (Opcional) HMAC signature headers: X-Timestamp + X-Signature quando SIGNING_SECRET está habilitado.

Request
POST /partner/validate
Headers:
  Content-Type: application/json
  Authorization: Bearer <partner_jwt>
Body:
  { "code": "TRV-ABC123" }

Responses
- 200 { valid: true, coupon: { ... } }  --> cupom validado e marcado como `used` (atomic)
- 404 { valid: false, error: "not_found" } --> código não existe
- 409 { valid: false, error: "not_valid_for_partner_or_already_used" } --> pertence a outro parceiro, já usado ou inválido
- 401 / 403 authorization errors
- 500 internal_error

Curl examples
# Partner (recommended)
curl -X POST http://localhost:3001/partner/validate \
  -H "Authorization: Bearer <PARTNER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code":"TRV-XXXXXX"}'

# Admin script (management) — requires partner_id in body
curl -X POST http://localhost:3001/partner/validate \
  -H "X-Admin-Api-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"code":"TRV-XXXXXX","partner_id":"p_demo_1"}'

Notes / migration
- Client (PartnerDashboard) must call this endpoint to accept/consume coupons — do not rely on client-only validation.
- Keep localStorage fallback only for dev/offline scenarios; disable in production.
- Consider rotating SIGNING_SECRET and enforcing request signing from POS devices.

Migration (recommended immediate steps):
1. Apply SQL migration that creates an atomic RPC `consume_coupon(code, partner_id)` and an index on `lower(code)`. Use SECURITY DEFINER and a dedicated migration role.
2. Add RLS policies: only the server role / RPC may UPDATE `coupons.status`; partners may only call the RPC to consume coupons for their `partner_id`.
3. Reconfigure frontend: set `VITE_ADMIN_SERVER_URL` and disable local fallbacks in production (already enforced by the client).
4. Run smoke-test (see `scripts/validate_coupon_smoke.js`) against a staging database before promoting to production.

Quick deploy (example)

# From a developer machine with psql available
# 1) Set DB connection string (staging)
export SUPABASE_DB_URL="postgres://<user>:<pass>@<host>:5432/<db>"

# 2) Preview migrations
ls server/migrations/*.sql

# 3) Run migrations (PowerShell)
#    pwsh .\scripts\apply_migrations.ps1

# 4) Or (macOS / Linux)
#    SUPABASE_DB_URL="$SUPABASE_DB_URL" bash scripts/apply_migrations.sh

# 5) Run smoke test against staging admin-server
#    ADMIN_SERVER_URL="https://staging-admin.example" ADMIN_API_KEY="<key>" COUPON_CODE="TRV-..." npm run test:smoke

# Rollout checklist
- Apply migrations in staging and run smoke-tests
- Verify no duplicate coupon codes before creating UNIQUE index
- Deploy admin-server with SIGNING_SECRET and SERVICE_ROLE_KEY configured
- Enable monitoring/alerts for 409 rates and unexpected failures


See `server/migrations/001_consume_coupon_rpc.sql` for SQL and `scripts/validate_coupon_smoke.js` for a smoke-test example.
