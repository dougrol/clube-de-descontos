# Secure Admin Server - Request Signing, mTLS & Centralized Logging

This guide covers the advanced security features: **request signing with HMAC**, **mutual TLS (mTLS)**, and **centralized logging integration**.

## 1. Request Signing (HMAC-SHA256)

Prevents MITM attacks and request tampering by cryptographically signing requests.

### How It Works

1. Client generates a **timestamp** (milliseconds since epoch)
2. Client creates **HMAC-SHA256** signature: `HMAC_SHA256(SIGNING_SECRET, timestamp.body)`
3. Client sends headers:
   - `X-Signature`: hex-encoded signature
   - `X-Timestamp`: milliseconds
4. Server verifies signature and checks timestamp is within ±5 minutes

### Setup

**Set environment variable:**
```bash
export SIGNING_SECRET="your-secret-key-min-32-chars"
```

### Client Example (JavaScript)

```javascript
const crypto = require('crypto');

function signRequest(body, secret) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  return {
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };
}

// Usage
const body = JSON.stringify({ id: 'user-123', email: 'test@example.com' });
const headers = signRequest(body, 'your-secret-key-min-32-chars');

const response = await fetch('http://localhost:3001/create-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken,
    ...headers,
  },
  body,
});
```

### Client Example (Python)

```python
import hashlib
import hmac
import time
import json
import requests

def sign_request(body, secret):
    timestamp = str(int(time.time() * 1000))
    message = f"{timestamp}.{body}"
    signature = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return {
        'X-Signature': signature,
        'X-Timestamp': timestamp,
    }

# Usage
body = json.dumps({'id': 'user-123', 'email': 'test@example.com'})
headers = sign_request(body, 'your-secret-key-min-32-chars')
headers['Content-Type'] = 'application/json'
headers['Authorization'] = 'Bearer ' + user_token

response = requests.post(
    'http://localhost:3001/create-user',
    headers=headers,
    data=body,
)
```

### Error Responses

- `401 Invalid Signature` if signature doesn't match
- `401 Timestamp outside acceptable window` if timestamp > 5 minutes old

---

## 2. Mutual TLS (mTLS)

Ensures **both** client and server authenticate each other using certificates.

### Generate Self-Signed Certificates

**Server certificate:**
```bash
openssl req -x509 -newkey rsa:4096 -keyout server-key.pem -out server-cert.pem -days 365 -nodes \
  -subj "/CN=localhost"
```

**Client certificate (for mTLS validation):**
```bash
openssl req -x509 -newkey rsa:4096 -keyout client-key.pem -out client-cert.pem -days 365 -nodes \
  -subj "/CN=admin-client"
```

### Setup Environment Variables

```bash
export USE_HTTPS=true
export TLS_CERT_FILE="/path/to/server-cert.pem"
export TLS_KEY_FILE="/path/to/server-key.pem"
export TLS_CA_FILE="/path/to/client-cert.pem"  # Optional: for mTLS client validation
```

### Node.js Client with mTLS

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/create-user',
  method: 'POST',
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  ca: fs.readFileSync('server-cert.pem'),  // Trust server cert
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
  res.on('end', () => console.log(JSON.parse(data)));
});

req.write(JSON.stringify({ id: 'user-123', email: 'test@example.com' }));
req.end();
```

### curl with mTLS

```bash
curl --key client-key.pem \
     --cert client-cert.pem \
     --cacert server-cert.pem \
     -X POST https://localhost:3001/create-user \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $USER_TOKEN" \
     -H "X-Signature: $SIGNATURE" \
     -H "X-Timestamp: $TIMESTAMP" \
     -d '{"id": "user-123", "email": "test@example.com"}'
```

---

## 3. Centralized Logging

Integrate with **Sentry**, **DataDog**, **CloudWatch**, or a custom logging service.

### Setup Environment Variables

```bash
export LOG_SERVICE="sentry"  # or "datadog", "cloudwatch"
export LOG_SERVICE_KEY="your-service-key"
```

### Supported Services

#### Sentry Integration
```javascript
// In logger setup (admin-server-secure.js)
const Sentry = require('@sentry/node');
Sentry.init({ dsn: LOG_SERVICE_KEY });

// In sendCentralizedLog function:
if (LOG_SERVICE === 'sentry') {
  Sentry.captureMessage(message, level);
}
```

#### DataDog Integration
```javascript
const StatsD = require('node-dogstatsd').StatsD;
const dogstatsd = new StatsD({ api_key: LOG_SERVICE_KEY });

if (LOG_SERVICE === 'datadog') {
  dogstatsd.event(`admin-server: ${level}`, message);
}
```

#### CloudWatch Integration
```javascript
const AWS = require('aws-sdk');
const logs = new AWS.CloudWatchLogs();

if (LOG_SERVICE === 'cloudwatch') {
  logs.putLogEvents({
    logGroupName: '/admin-server',
    logStreamName: 'default',
    logEvents: [{ timestamp: Date.now(), message }],
  }, (err) => {});
}
```

### Custom HTTP Endpoint

```bash
export LOG_SERVICE="custom"
export LOG_SERVICE_KEY="https://your-logging-service.com/logs"
```

All logs are sent as JSON:
```json
{
  "level": "info|warn|error",
  "message": "User creation: user_jwt | status=201 | id=uuid | ip=127.0.0.1",
  "service": "admin-server",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "environment": "production"
}
```

---

## 4. Combined Example: All Security Features

### Server Startup
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export ADMIN_SECRET="your-admin-secret"
export ADMIN_IP_ALLOWLIST="192.168.1.1,10.0.0.5"
export SIGNING_SECRET="your-signing-secret-32-chars-min"
export USE_HTTPS=true
export TLS_CERT_FILE="./certs/server-cert.pem"
export TLS_KEY_FILE="./certs/server-key.pem"
export TLS_CA_FILE="./certs/client-cert.pem"
export LOG_SERVICE="sentry"
export LOG_SERVICE_KEY="https://xxxxx@sentry.io/yyyyy"
export PORT=3001

node admin-server-secure.js
```

### Client Request (All Security Layers)
```javascript
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

// 1. Sign the request
const body = JSON.stringify({ id: 'user-123', email: 'test@example.com' });
const timestamp = Date.now().toString();
const message = `${timestamp}.${body}`;
const signature = crypto
  .createHmac('sha256', 'your-signing-secret-32-chars-min')
  .update(message)
  .digest('hex');

// 2. Send with mTLS
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/create-user',
  method: 'POST',
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  ca: fs.readFileSync('server-cert.pem'),
  rejectUnauthorized: true,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken,
    'X-Admin-Token': adminJWT,  // Optional: use admin JWT instead
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('User created:', JSON.parse(data));
    } else {
      console.error('Error:', JSON.parse(data));
    }
  });
});

req.on('error', (err) => console.error('Request error:', err));
req.write(body);
req.end();
```

### Server Logs (with Centralized Logging)

**Console output:**
```
🚀 Admin server listening on https://localhost:3001
[INFO] 2024-01-15T10:30:45.123Z - Server started: https | port=3001 | rate-limit=10/60s
✓ JWT admin authentication: enabled
✓ Request signing (HMAC): enabled
✓ IP allowlist: enabled (2 IPs)
✓ HTTPS: enabled
✓ mTLS (mutual TLS): enabled

[INFO] 2024-01-15T10:30:50.456Z - User creation: user_jwt | status=201 | id=abc-123 | ip=127.0.0.1
```

**Sentry/CloudWatch/DataDog:**
```json
{
  "level": "info",
  "message": "User creation: user_jwt | status=201 | id=abc-123 | ip=127.0.0.1",
  "service": "admin-server",
  "timestamp": "2024-01-15T10:30:50.456Z",
  "environment": "production"
}
```

---

## 5. Security Best Practices

### Key Rotation
1. Generate new `SIGNING_SECRET` periodically
2. Clients must handle signature verification errors gracefully
3. Use certificate renewal with Let's Encrypt in production

### Certificate Management
- Use **valid certificates** in production (not self-signed)
- Implement certificate expiration monitoring
- Automate renewal with cert manager or Let's Encrypt

### Environment Secrets
```bash
# ❌ DON'T hardcode secrets
export SIGNING_SECRET="hardcoded-secret"

# ✅ DO use secure secret management
export SIGNING_SECRET=$(aws secretsmanager get-secret-value --secret-id admin-signing-secret --query SecretString --output text)
```

### Monitoring
- Monitor `/health` endpoint for uptime
- Track failed signature validations in logs
- Alert on repeated rate limit hits per IP
- Review mTLS certificate validation failures

---

## 6. Troubleshooting

### "Signature mismatch" Error
- Check `SIGNING_SECRET` matches on client & server
- Verify timestamp is in milliseconds, not seconds
- Ensure request body is **exactly** the same (no extra whitespace)

### "Certificate verify failed"
- Check server cert matches `TLS_CERT_FILE`
- Verify client has trust for server cert (in mTLS, point `ca` to server cert)
- Ensure cert is not expired: `openssl x509 -in cert.pem -noout -dates`

### "Forbidden IP"
- Check IP is in `ADMIN_IP_ALLOWLIST` (comma-separated)
- Verify client IP is correctly detected (check `x-forwarded-for` header if behind proxy)

### Logs Not Appearing
- Verify `LOG_SERVICE` and `LOG_SERVICE_KEY` are set
- Check service credentials have correct permissions
- Ensure network can reach centralized logging service

---

## 7. Production Deployment Checklist

- [ ] Use valid TLS certificates (Let's Encrypt or CA-signed)
- [ ] Set `NODE_ENV=production`
- [ ] Enable centralized logging (`LOG_SERVICE` set)
- [ ] Configure IP allowlist for admin operations
- [ ] Set strong `SIGNING_SECRET` (>32 characters)
- [ ] Rotate secrets every 90 days
- [ ] Monitor server health and error rates
- [ ] Implement certificate expiration alerts
- [ ] Test mTLS with production clients
- [ ] Document certificate renewal process
