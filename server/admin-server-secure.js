const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ===== Environment Variables =====
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PORT = process.env.PORT || 3001;
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const ADMIN_IP_ALLOWLIST = (process.env.ADMIN_IP_ALLOWLIST || '').split(',').filter(Boolean);
const JWT_ISSUER = process.env.JWT_ISSUER || 'admin-server';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'tavares-app';
const SIGNING_SECRET = process.env.SIGNING_SECRET || '';
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const TLS_CERT_FILE = process.env.TLS_CERT_FILE || '';
const TLS_KEY_FILE = process.env.TLS_KEY_FILE || '';
const TLS_CA_FILE = process.env.TLS_CA_FILE || '';
const LOG_SERVICE = process.env.LOG_SERVICE || '';
const LOG_SERVICE_KEY = process.env.LOG_SERVICE_KEY || '';

// ===== Rate Limiting =====
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  const record = rateLimitMap.get(ip);
  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  record.count++;
  return record.count <= RATE_LIMIT_MAX;
}

// ===== Centralized Logging =====
const logger = {
  info: (msg) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
    sendCentralizedLog('info', msg);
  },
  warn: (msg) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
    sendCentralizedLog('warn', msg);
  },
  error: (msg) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
    sendCentralizedLog('error', msg);
  },
};

function sendCentralizedLog(level, message) {
  if (!LOG_SERVICE || !LOG_SERVICE_KEY) return;

  const payload = {
    level,
    message,
    service: 'admin-server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Placeholder integrations for common logging services
  if (LOG_SERVICE === 'sentry') {
    // Example: const Sentry = require('@sentry/node');
    // Sentry.captureMessage(message, level);
  } else if (LOG_SERVICE === 'datadog') {
    // Example: StatsD or HTTP endpoint to Datadog
  } else if (LOG_SERVICE === 'cloudwatch') {
    // Example: AWS CloudWatch SDK
  }
  // Could also be a custom HTTP endpoint for JSON logs
}

// ===== JWT Verification (Admin Tokens) =====
function verifyAdminJWT(token) {
  if (!ADMIN_SECRET) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

    // Verify expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      logger.warn('Admin token expired');
      return null;
    }

    // Optional: Verify issuer and audience
    if (JWT_ISSUER && payload.iss !== JWT_ISSUER) {
      logger.warn('Invalid token issuer');
      return null;
    }
    if (JWT_AUDIENCE && payload.aud !== JWT_AUDIENCE) {
      logger.warn('Invalid token audience');
      return null;
    }

    // Verify signature
    const message = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(message).digest('base64url');

    if (signatureB64 !== expectedSig) {
      logger.warn('Admin token signature mismatch');
      return null;
    }

    return payload;
  } catch (err) {
    logger.error(`JWT verification error: ${err.message}`);
  }
  return null;
}

const supabaseHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
};

function isIpAllowed(ip) {
  if (ADMIN_IP_ALLOWLIST.length === 0) return true; // no allowlist = allow all
  const allowed = ADMIN_IP_ALLOWLIST.includes(ip);
  if (!allowed) {
    logger.warn(`IP allowlist blocked: ${ip}`);
  }
  return allowed;
}

// ===== Request Signing Verification =====
function verifyRequestSignature(req, bodyStr) {
  if (!SIGNING_SECRET) return true; // signing not required

  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];

  if (!signature || !timestamp) {
    logger.warn('Missing signature or timestamp header');
    return false;
  }

  const requestTime = Number(timestamp);
  const now = Date.now();
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
    logger.warn('Timestamp outside acceptable window');
    return false;
  }

  const message = `${timestamp}.${bodyStr}`;
  const expectedSignature = crypto.createHmac('sha256', SIGNING_SECRET).update(message).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    logger.warn('Signature mismatch');
    return false;
  }

  return true;
}

// ===== TLS Configuration =====
function loadTlsConfig() {
  if (!USE_HTTPS) return null;

  if (!TLS_CERT_FILE || !TLS_KEY_FILE) {
    logger.error('USE_HTTPS=true but TLS_CERT_FILE or TLS_KEY_FILE not set');
    process.exit(1);
  }

  const tlsOptions = {
    cert: fs.readFileSync(TLS_CERT_FILE),
    key: fs.readFileSync(TLS_KEY_FILE),
  };

  if (TLS_CA_FILE) {
    tlsOptions.ca = fs.readFileSync(TLS_CA_FILE);
    tlsOptions.requestCert = true;
    tlsOptions.rejectUnauthorized = true;
    logger.info('mTLS enabled: client certificates required');
  }

  return tlsOptions;
}

// ===== Request Handler =====
const requestHandler = async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'rate_limited' }));
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-admin-api-key, x-signature, x-timestamp');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/create-user') {
    try {
      // Read request body first for signature verification
      let body = '';
      for await (const chunk of req) body += chunk;

      // Verify request signature (if SIGNING_SECRET is set)
      if (!verifyRequestSignature(req, body)) {
        logger.warn(`Invalid signature from IP: ${clientIp}`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid_signature' }));
        return;
      }

      const authHeader = req.headers['authorization'];
      const adminTokenHeader = req.headers['x-admin-token'];
      const adminApiKeyHeader = req.headers['x-admin-api-key'];

      let validatedUserId = null;
      let authMethod = null;

      if (ADMIN_API_KEY && adminApiKeyHeader === ADMIN_API_KEY) {
        // Admin API key: check IP allowlist
        if (!isIpAllowed(clientIp)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'forbidden_ip' }));
          return;
        }
        authMethod = 'admin_api_key';
      } else if (adminTokenHeader) {
        // Admin JWT: check IP allowlist and validate JWT claims
        if (!isIpAllowed(clientIp)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'forbidden_ip' }));
          return;
        }
        const adminPayload = verifyAdminJWT(adminTokenHeader);
        if (adminPayload && adminPayload.role === 'admin') {
          authMethod = 'admin_jwt';
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid_admin_token' }));
          return;
        }
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const userResp = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/user`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: SERVICE_ROLE_KEY,
            },
          });

          if (!userResp.ok) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid_token' }));
            return;
          }

          const userJson = await userResp.json();
          validatedUserId = userJson?.id || null;
          authMethod = 'user_jwt';
        } catch (vErr) {
          logger.error(`Token validation error: ${vErr.message}`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid_token' }));
          return;
        }
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }

      const payload = JSON.parse(body || '{}');

      const targetId = validatedUserId || payload.id;
      if (!targetId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing id in body or invalid token' }));
        return;
      }

      if (authMethod === 'user_jwt' && validatedUserId && payload.id && validatedUserId !== payload.id) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'forbidden' }));
        return;
      }

      // Build insert object
      const insertObj = {
        id: targetId,
        email: payload.email || null,
        name: payload.name || null,
        role: payload.role || 'USER',
        plan: payload.plan || null,
      };

      const resp = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/users?on_conflict=id`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'return=representation,resolution=merge-duplicates'
        },
        body: JSON.stringify(insertObj),
      });

      const data = await resp.text();
      const status = resp.status;

      logger.info(`User creation: ${authMethod} | status=${status} | id=${targetId} | ip=${clientIp}`);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      logger.error(`/create-user error: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal_error' }));
    }
    return;
  }

  // Health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
};

// ===== Server Creation =====
let server;
if (USE_HTTPS) {
  const tlsConfig = loadTlsConfig();
  server = https.createServer(tlsConfig, requestHandler);
  logger.info('HTTPS server with mTLS support initialized');
} else {
  server = http.createServer(requestHandler);
}

server.listen(PORT, () => {
  const protocol = USE_HTTPS ? 'https' : 'http';
  console.log(`\n🚀 Admin server listening on ${protocol}://localhost:${PORT}`);
  logger.info(`Server started: ${protocol} | port=${PORT} | rate-limit=${RATE_LIMIT_MAX}/${RATE_LIMIT_WINDOW / 1000}s`);

  if (ADMIN_SECRET) {
    console.log('✓ JWT admin authentication: enabled');
  }
  if (SIGNING_SECRET) {
    console.log('✓ Request signing (HMAC): enabled');
  }
  if (ADMIN_IP_ALLOWLIST.length > 0) {
    console.log(`✓ IP allowlist: enabled (${ADMIN_IP_ALLOWLIST.length} IPs)`);
  }
  if (USE_HTTPS) {
    console.log('✓ HTTPS: enabled');
    if (TLS_CA_FILE) {
      console.log('✓ mTLS (mutual TLS): enabled');
    }
  }
  console.log('');
});
