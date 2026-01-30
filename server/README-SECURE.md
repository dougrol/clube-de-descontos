# Admin Server — Supabase User Persistence

Secure backend server to create/upsert `public.users` using Supabase `service_role` key with JWT-based authentication, rate limiting, request signing, mTLS, and centralized logging.

## Features

- **User JWT validation**: End-user sends `Authorization: Bearer <access_token>` (Supabase auth token)
- **Admin JWT validation**: Internal services send `x-admin-token: <admin_jwt>` (signed with ADMIN_SECRET)
- **Rate limiting**: 10 requests per minute per IP address
- **Request signing**: HMAC-SHA256 signature verification for tamper detection
- **Mutual TLS (mTLS)**: Optional HTTPS with client certificate validation
- **Centralized logging**: Integration with Sentry, DataDog, CloudWatch, or custom HTTP endpoints
- **Legacy support**: `x-admin-api-key` header still works if ADMIN_API_KEY is set
- **IP allowlist**: Optional IP-based access control for admin operations

## Advanced Features

📖 See [SECURITY-ADVANCED.md](./SECURITY-ADVANCED.md) for detailed guides on:
- **Request Signing** with HMAC-SHA256
- **Mutual TLS (mTLS)** setup and examples
- **Centralized Logging** integration (Sentry, DataDog, CloudWatch)
- Production deployment checklist

## Setup

### 1. Set environment variables

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
export ADMIN_SECRET=your-secret-key-for-admin-tokens
export PORT=8787  # optional, defaults to 8787
export ADMIN_IP_ALLOWLIST=192.168.1.1,10.0.0.5  # optional: comma-separated IPs
export JWT_ISSUER=my-app  # optional: validate JWT iss claim
export JWT_AUDIENCE=tavares-admin  # optional: validate JWT aud claim

# Advanced: Request Signing
export SIGNING_SECRET=your-32-char-minimum-secret-key

# Advanced: HTTPS & mTLS
export USE_HTTPS=true
export TLS_CERT_FILE=/path/to/server-cert.pem
export TLS_KEY_FILE=/path/to/server-key.pem
export TLS_CA_FILE=/path/to/client-cert.pem  # Optional: for client cert validation

# Advanced: Centralized Logging
export LOG_SERVICE=sentry  # or "datadog", "cloudwatch"
export LOG_SERVICE_KEY=your-service-key
```

Windows PowerShell:
```powershell
$env:SUPABASE_URL='https://your-project.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='eyJ...service_role...'
$env:ADMIN_SECRET='your-secret-key-for-admin-tokens'
$env:PORT='8787'
```

### 2. Generate admin JWT tokens (optional, for internal services)
    sub: 'admin-service'  // subject (optional, for debugging)
  },
  'your-secret-key-for-admin-tokens',
  { expiresIn: '24h' }
);
console.log(token);
```

Or use an online JWT tool (jwt.io):
- **Header**: `{ "alg": "HS256", "typ": "JWT" }`
- **Payload**: `{ "role": "admin", "iss": "my-app", "aud": "tavares-admin", "exp": <unix-timestamp-24h-from-now> }`
- **Secret**: Your ADMIN_SECRET value

### 3. Run the server

```bash
node server/admin-server-secure.js
```

Output:
```
Admin server listening on http://localhost:8787
✓ JWT admin authentication: enabled
✓ Rate limit: 10 requests per 60s per IP
```

## Usage examples

### User creates their own record (after signUp)

```bash
curl -X POST http://localhost:8787/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ...user_access_token..." \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "plan": "Basic"
  }'
```

### Admin creates/updates any user record

```bash
curl -X POST http://localhost:8787/create-user \
  -H "Content-Type: application/json" \
  -H "x-admin-token: eyJ...admin_jwt_token..." \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PARTNER",
    "plan": "Premium"
  }'
```

### Legacy: with API key

```bash
curl -X POST http://localhost:8787/create-user \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-legacy-api-key" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }'
```

## Request payload

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // optional if user JWT
  "email": "user@example.com",                    // optional
  "name": "John Doe",                             // optional
  "role": "USER",                                 // optional, defaults to "USER"
  "plan": "Basic"                                 // optional
}
```

## Response

**Success (201/200)**:
```json
[{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "plan": "Basic",
  "created_at": "2026-01-28T10:00:00Z"
}]
```

**Error responses**:
- `400` — Missing id or invalid request
- `401` — Invalid token, expired token, or invalid claims (iss/aud mismatch)
- `403` — Forbidden (user token trying to create another user's record, or IP not in allowlist)
- `429` — Rate limited (>10 requests per minute)
- `500` — Server error

## Security notes

- **Never expose ADMIN_SECRET publicly** — keep it on backend only
- **Never expose SUPABASE_SERVICE_ROLE_KEY** — keep it on backend only
- User JWTs can **only create/update their own record** (id is taken from token)
- Admin JWTs can create/update **any user record**
- **IP allowlist**: if `ADMIN_IP_ALLOWLIST` is set, only those IPs can use admin authentication (API key or JWT)
- **JWT claims validation**: if `JWT_ISSUER` or `JWT_AUDIENCE` is set, admin JWTs **must** include matching `iss` and `aud` claims
- Rate limiting (10 req/60s per IP) prevents abuse
- Use HTTPS in production
- Consider adding additional authentication (request signing, mutual TLS) for highly sensitive environments

## Integrating with React frontend

In `screens/Register.tsx`, after `supabase.auth.signUp`:

```typescript
const accessToken = session?.access_token;
const adminUrl = import.meta.env.VITE_ADMIN_URL; // e.g., http://localhost:8787

const resp = await fetch(`${adminUrl}/create-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    email: formData.email,
    name: formData.name,
    role: 'USER',
    plan: 'Basic'
  })
});
```

This is already implemented in the codebase.

---

## Advanced: IP allowlist + JWT claims validation

### Example production setup

```bash
# Backend server (only these IPs can authenticate)
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
export ADMIN_SECRET=super-secret-key-change-regularly
export ADMIN_IP_ALLOWLIST=203.0.113.50,203.0.113.51
export JWT_ISSUER=tavares-car-app
export JWT_AUDIENCE=tavares-admin-server
node server/admin-server-secure.js
```

### Generate JWT with claims for your backend service

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    role: 'admin',
    iss: 'tavares-car-app',
    aud: 'tavares-admin-server',
    sub: 'backend-service-1',
    iat: Math.floor(Date.now() / 1000)
  },
  'super-secret-key-change-regularly',
  { expiresIn: '24h' }
);
console.log('Admin Token:', token);
// Store securely (env var, secrets manager)
```

### Call from allowlisted IP with valid claims

```bash
# From 203.0.113.50 with correct claims → SUCCESS
curl -X POST http://admin-server:8787/create-user \
  -H "x-admin-token: eyJ...valid-token-with-iss-aud-role..." \
  -H "Content-Type: application/json" \
  -d '{"id":"<uuid>","email":"user@ex.com","role":"PARTNER"}'
# Returns 200/201 with user record

# From 203.0.114.1 with correct token → BLOCKED (IP not allowlisted)
# Returns 403 forbidden_ip

# From allowlisted IP with wrong iss/aud → BLOCKED (claims mismatch)
# Returns 401 invalid_admin_token
```
