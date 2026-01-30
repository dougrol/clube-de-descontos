# Quick TLS Certificate Setup & Testing

## Generate Self-Signed Certificates (Development)

### 1. Server Certificate

```bash
mkdir -p certs
cd certs

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout server-key.pem \
  -out server-cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=localhost/O=Tavares/C=BR"
```

**Output:**
- `server-key.pem` — Server private key
- `server-cert.pem` — Server certificate

### 2. Client Certificate (for mTLS)

```bash
# Generate client private key and certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout client-key.pem \
  -out client-cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=admin-client/O=Tavares/C=BR"
```

**Output:**
- `client-key.pem` — Client private key
- `client-cert.pem` — Client certificate (sent to server as CA trust)

### 3. Verify Certificates

```bash
# Check certificate details
openssl x509 -in server-cert.pem -text -noout | grep -E "CN=|Not Before|Not After"

# Check expiration
openssl x509 -in server-cert.pem -noout -dates
```

---

## Start Server with HTTPS + mTLS

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export SIGNING_SECRET="test-secret-key-minimum-32-characters"
export USE_HTTPS=true
export TLS_CERT_FILE="./certs/server-cert.pem"
export TLS_KEY_FILE="./certs/server-key.pem"
export TLS_CA_FILE="./certs/client-cert.pem"
export ADMIN_SECRET="admin-secret-key"
export LOG_SERVICE="sentry"
export LOG_SERVICE_KEY="https://xxxxx@sentry.io/yyyyy"

node admin-server-secure.js
```

**Expected output:**
```
🚀 Admin server listening on https://localhost:3001
[INFO] 2024-01-15T10:30:45.123Z - Server started: https | port=3001 | rate-limit=10/60s
✓ JWT admin authentication: enabled
✓ Request signing (HMAC): enabled
✓ HTTPS: enabled
✓ mTLS (mutual TLS): enabled
```

---

## Test with curl (mTLS + Request Signing)

### 1. Generate Signature

```bash
#!/bin/bash
SIGNING_SECRET="test-secret-key-minimum-32-characters"
BODY='{"id":"user-123","email":"test@example.com"}'
TIMESTAMP=$(date +%s%N | cut -b1-13)  # milliseconds

# Create message: timestamp.body
MESSAGE="$TIMESTAMP.$BODY"

# Generate HMAC-SHA256 signature (hex format)
SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -mac HMAC -macopt "key:$SIGNING_SECRET" -hex | cut -d' ' -f2)

echo "Timestamp: $TIMESTAMP"
echo "Signature: $SIGNATURE"
echo "Body: $BODY"
```

### 2. Send Request

```bash
# After generating signature above:
curl -v \
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

**Success response (201 or 200):**
```json
[{
  "id": "user-123",
  "email": "test@example.com",
  "name": null,
  "role": "USER",
  "plan": null
}]
```

---

## Test with Node.js (Complete Example)

**test-admin-server.js:**
```javascript
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

// Configuration
const USER_TOKEN = process.env.USER_TOKEN || 'test-token';
const SIGNING_SECRET = 'test-secret-key-minimum-32-characters';
const SERVER_URL = 'https://localhost:3001/create-user';

// Generate signature
function generateSignature(body) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(message)
    .digest('hex');
  
  console.log(`\n📝 Signature Generation:`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Message: ${message}`);
  console.log(`   Signature: ${signature}`);
  
  return { timestamp, signature };
}

// Send request with mTLS + signature
async function sendRequest() {
  const body = JSON.stringify({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    plan: 'basic',
  });

  const { timestamp, signature } = generateSignature(body);

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
      'Content-Length': body.length,
      'Authorization': `Bearer ${USER_TOKEN}`,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    },
  };

  console.log(`\n🔐 HTTPS Request Details:`);
  console.log(`   URL: https://localhost:3001/create-user`);
  console.log(`   Method: POST`);
  console.log(`   Headers: ${JSON.stringify(options.headers, null, 2)}`);
  console.log(`   Body: ${body}`);

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n✅ Response (${res.statusCode}):`);
        console.log(JSON.stringify(JSON.parse(data), null, 2));
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`\n❌ Error: ${err.message}`);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

// Run test
(async () => {
  try {
    await sendRequest();
  } catch (err) {
    process.exit(1);
  }
})();
```

**Run test:**
```bash
# Set user token (get from Supabase auth)
export USER_TOKEN="eyJ..."

node test-admin-server.js
```

---

## Production Certificate Generation (Let's Encrypt)

### 1. Install Certbot

```bash
# macOS
brew install certbot

# Ubuntu/Debian
sudo apt-get install certbot

# Windows (via Chocolatey)
choco install certbot
```

### 2. Generate Certificate

```bash
# For domain example.com
sudo certbot certonly --standalone -d example.com

# Certificates location:
# /etc/letsencrypt/live/example.com/fullchain.pem  (TLS_CERT_FILE)
# /etc/letsencrypt/live/example.com/privkey.pem   (TLS_KEY_FILE)
```

### 3. Auto-Renewal

```bash
# Install renewal hook
sudo certbot renew --dry-run

# Add to crontab (automatic renewal)
0 0 1 * * sudo certbot renew --quiet
```

### 4. Update Environment

```bash
export TLS_CERT_FILE="/etc/letsencrypt/live/example.com/fullchain.pem"
export TLS_KEY_FILE="/etc/letsencrypt/live/example.com/privkey.pem"
```

---

## Troubleshooting

### Certificate Verification Failed
```
Error: certificate verify failed
```

**Solution:**
- Ensure `TLS_CA_FILE` points to the server certificate (for client mTLS)
- Check `--cacert` in curl matches server certificate
- Verify certificate is not expired: `openssl x509 -in cert.pem -noout -dates`

### Signature Mismatch
```
Invalid signature from IP: 127.0.0.1
```

**Solution:**
- Check `SIGNING_SECRET` matches on client & server (exact string)
- Verify timestamp is **milliseconds** (13 digits), not seconds
- Ensure request body is identical: `JSON.stringify(obj)` should produce same string
- Check for encoding issues (UTF-8)

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solution:**
- Verify server is running: `lsof -i :3001`
- Check `USE_HTTPS=true` and ports match
- On Windows, try different port: `export PORT=8443`

### OpenSSL: "Error while loading CA cert"
```bash
# Use absolute paths in environment
export TLS_CERT_FILE="$(pwd)/certs/server-cert.pem"
export TLS_KEY_FILE="$(pwd)/certs/server-key.pem"
```

---

## Next Steps

1. ✅ Test locally with development certificates
2. ✅ Verify signature validation works
3. ✅ Confirm mTLS client certificate validation
4. 🔄 Generate production certificates (Let's Encrypt)
5. 🔄 Configure centralized logging (Sentry/DataDog)
6. 🔄 Set up monitoring and alerts
7. 🔄 Document certificate renewal process
