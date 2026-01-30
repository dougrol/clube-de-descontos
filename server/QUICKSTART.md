# Quick-Start Examples

Get up and running with the secure admin server in 5 minutes.

## 1. Local Development (HTTP)

### Start Server

```bash
cd server

# Set minimal env vars
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export ADMIN_SECRET="dev-secret-key"

# Start
node admin-server-secure.js
```

**Output:**
```
🚀 Admin server listening on http://localhost:3001
```

### Client Request

```javascript
// Node.js HTTP client
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/create-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => console.log(JSON.parse(data)));
});

req.write(JSON.stringify({
  id: 'user-uuid',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'USER',
  plan: 'basic',
}));

req.end();
```

---

## 2. Request Signing (Signature + Replay Protection)

### Start Server with Signing

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export ADMIN_SECRET="dev-secret-key"
export SIGNING_SECRET="test-secret-key-minimum-32-characters"

node admin-server-secure.js
```

### Client Request with Signature

```javascript
const http = require('http');
const crypto = require('crypto');

function createSignedRequest(body, secret) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return { timestamp, signature };
}

const body = JSON.stringify({
  id: 'user-uuid',
  email: 'user@example.com',
});

const { timestamp, signature } = createSignedRequest(body, 'test-secret-key-minimum-32-characters');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/create-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(res.statusCode === 201 ? '✓ User created' : '✗ Error', JSON.parse(data));
  });
});

req.on('error', console.error);
req.write(body);
req.end();
```

---

## 3. HTTPS + mTLS

### Generate Certificates (One-Time)

```bash
cd server/certs

# Server certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout server-key.pem -out server-cert.pem \
  -days 365 -nodes -subj "/CN=localhost"

# Client certificate (for mTLS)
openssl req -x509 -newkey rsa:4096 \
  -keyout client-key.pem -out client-cert.pem \
  -days 365 -nodes -subj "/CN=admin-client"
```

### Start Server with HTTPS + mTLS

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export ADMIN_SECRET="dev-secret-key"
export SIGNING_SECRET="test-secret-key-minimum-32-characters"
export USE_HTTPS=true
export TLS_CERT_FILE="./certs/server-cert.pem"
export TLS_KEY_FILE="./certs/server-key.pem"
export TLS_CA_FILE="./certs/client-cert.pem"

node admin-server-secure.js
```

**Output:**
```
🚀 Admin server listening on https://localhost:3001
✓ HTTPS: enabled
✓ mTLS (mutual TLS): enabled
```

### Client Request with mTLS

```javascript
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

// Generate signature
const body = JSON.stringify({ id: 'user-uuid', email: 'user@example.com' });
const timestamp = Date.now().toString();
const message = `${timestamp}.${body}`;
const signature = crypto
  .createHmac('sha256', 'test-secret-key-minimum-32-characters')
  .update(message)
  .digest('hex');

// HTTPS request with client certificate
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/create-user',
  method: 'POST',
  key: fs.readFileSync('./certs/client-key.pem'),
  cert: fs.readFileSync('./certs/client-cert.pem'),
  ca: fs.readFileSync('./certs/server-cert.pem'),
  rejectUnauthorized: true,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('✓ Secure response received:', JSON.parse(data));
  });
});

req.on('error', (err) => console.error('✗ mTLS Error:', err.message));
req.write(body);
req.end();
```

### Test with curl

```bash
# Generate signature
TIMESTAMP=$(date +%s%N | cut -b1-13)
BODY='{"id":"user-uuid","email":"user@example.com"}'
SIGNATURE=$(echo -n "$TIMESTAMP.$BODY" | openssl dgst -sha256 -mac HMAC -macopt "key:test-secret-key-minimum-32-characters" -hex | cut -d' ' -f2)

# Send request
curl -k \
  --key ./certs/client-key.pem \
  --cert ./certs/client-cert.pem \
  --cacert ./certs/server-cert.pem \
  -X POST https://localhost:3001/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  --data "$BODY"
```

---

## 4. Admin Operations (via Admin JWT)

### Generate Admin JWT Token

```javascript
const crypto = require('crypto');

function generateAdminJWT(secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    role: 'admin',
    iss: 'my-app',
    aud: 'tavares-admin',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const message = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64url');

  return `${message}.${signature}`;
}

const adminToken = generateAdminJWT('dev-secret-key');
console.log('Admin JWT:', adminToken);
```

### Use Admin JWT

```javascript
const https = require('https');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/create-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Token': adminToken,  // Send admin JWT
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  },
};

// ... rest of request
```

---

## 5. IP Allowlist + Rate Limiting

### Start Server with IP Allowlist

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export ADMIN_SECRET="dev-secret-key"
export ADMIN_IP_ALLOWLIST="127.0.0.1,192.168.1.100"

node admin-server-secure.js
```

### Rate Limit Test

```bash
# Try 11 requests quickly (limit is 10 per 60s per IP)
for i in {1..11}; do
  curl -s -X GET http://localhost:3001/health | jq .
done

# 11th request returns:
# { "error": "rate_limited" }
```

---

## 6. Centralized Logging (Sentry)

### Start Server with Sentry Logging

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export ADMIN_SECRET="dev-secret-key"
export LOG_SERVICE="sentry"
export LOG_SERVICE_KEY="https://xxxxx@sentry.io/yyyyy"

node admin-server-secure.js
```

### View Logs

All events will appear in Sentry dashboard:
- User creation events (info level)
- Invalid signatures (warn level)
- Token validation errors (error level)
- IP allowlist blocks (warn level)

---

## 7. Full Production Setup

### Environment File (.env.production)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Server
PORT=3001
NODE_ENV=production

# Authentication
ADMIN_SECRET=your-super-secret-admin-key
ADMIN_IP_ALLOWLIST=203.0.113.1,203.0.113.2

# JWT Claims Validation
JWT_ISSUER=tavares-app
JWT_AUDIENCE=tavares-api

# Security: Request Signing
SIGNING_SECRET=your-32-char-minimum-signing-secret-key

# Security: HTTPS + mTLS
USE_HTTPS=true
TLS_CERT_FILE=/etc/letsencrypt/live/api.example.com/fullchain.pem
TLS_KEY_FILE=/etc/letsencrypt/live/api.example.com/privkey.pem
TLS_CA_FILE=/etc/ssl/certs/client-trusted.pem

# Logging
LOG_SERVICE=sentry
LOG_SERVICE_KEY=https://xxxxx@sentry.io/yyyyy
```

### Start Production Server

```bash
# Load env file
source .env.production

# Start with pm2 (process manager)
pm2 start admin-server-secure.js --name "admin-server" --instances 1 --autorestart

# Or systemd
systemctl start admin-server
```

### Verify Health

```bash
curl https://api.example.com/health -k --cert client-cert.pem --key client-key.pem --cacert server-cert.pem
# Response: {"ok":true}
```

---

## Troubleshooting

### "Invalid Signature"
```javascript
// ✗ Wrong: using seconds instead of milliseconds
const timestamp = Math.floor(Date.now() / 1000);

// ✓ Correct: milliseconds
const timestamp = Date.now().toString();
```

### "Certificate verify failed"
```bash
# ✗ Wrong: not passing CA certificate
curl https://localhost:3001/health

# ✓ Correct: trust server certificate
curl -k https://localhost:3001/health
# or
curl --cacert server-cert.pem https://localhost:3001/health
```

### "Forbidden IP"
```bash
# ✗ Client IP 203.0.113.100 not in allowlist
export ADMIN_IP_ALLOWLIST="192.168.1.1"

# ✓ Add client IP to allowlist
export ADMIN_IP_ALLOWLIST="192.168.1.1,203.0.113.100"
```

---

## Performance

**Typical response time with all security features:**
- HTTP (no security): ~50-80ms
- HTTP + signature: ~52-82ms
- HTTPS + mTLS: ~60-90ms
- HTTPS + mTLS + signature: ~65-95ms

**Rate limit:** 10 requests per 60 seconds per IP

---

## Next Steps

1. ✅ Local testing (HTTP)
2. ✅ Enable request signing
3. ✅ Setup HTTPS + mTLS certificates
4. ✅ Configure centralized logging
5. ✅ Deploy to production

📖 See [SECURITY-ADVANCED.md](./SECURITY-ADVANCED.md) for comprehensive guides
