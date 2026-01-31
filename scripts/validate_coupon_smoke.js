/*
  Smoke test for /partner/validate endpoint.
  Usage (local):
    ADMIN_SERVER_URL=http://localhost:3001 ADMIN_API_KEY=foo node scripts/validate_coupon_smoke.js
  Or (partner):
    ADMIN_SERVER_URL=http://localhost:3001 PARTNER_TOKEN=<token> COUPON_CODE=TRV-XXXX node scripts/validate_coupon_smoke.js
*/

const ADMIN_SERVER_URL = process.env.ADMIN_SERVER_URL || 'http://localhost:3001';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const PARTNER_TOKEN = process.env.PARTNER_TOKEN || '';
const COUPON_CODE = process.env.COUPON_CODE || 'TRV-TEST0001';

async function run() {
  const body = { code: COUPON_CODE };
  const headers = { 'Content-Type': 'application/json' };
  if (ADMIN_API_KEY) headers['x-admin-api-key'] = ADMIN_API_KEY;
  if (PARTNER_TOKEN) headers['authorization'] = `Bearer ${PARTNER_TOKEN}`;

  console.log('Calling', `${ADMIN_SERVER_URL}/partner/validate`, 'with', body);
  try {
    const resp = await fetch(`${ADMIN_SERVER_URL}/partner/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    console.log('status=', resp.status);
    console.log('response=', text);
    process.exit(resp.status === 200 ? 0 : 2);
  } catch (err) {
    console.error('smoke test error', err);
    process.exit(3);
  }
}

run();
