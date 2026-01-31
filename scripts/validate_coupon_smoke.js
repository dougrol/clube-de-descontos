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

  // 1) First: call without creds (should be protected in non-dev servers)
  const baseHeaders = { 'Content-Type': 'application/json' };
  console.log('Calling (unauth) ->', `${ADMIN_SERVER_URL}/partner/validate`, 'with', body);
  try {
    const unauthResp = await fetch(`${ADMIN_SERVER_URL}/partner/validate`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(body),
    });
    console.log('[unauth] status=', unauthResp.status);
  } catch (err) {
    console.error('[unauth] network error', err);
  }

  // 2) If running against localhost, allow dev happy-path via x-dev-allow OR use provided creds
  const devish = /localhost|127\.0\.0\.1/.test(ADMIN_SERVER_URL);
  const authHeaders = { ...baseHeaders };
  if (ADMIN_API_KEY) authHeaders['x-admin-api-key'] = ADMIN_API_KEY;
  if (PARTNER_TOKEN) authHeaders['authorization'] = `Bearer ${PARTNER_TOKEN}`;
  if (!ADMIN_API_KEY && !PARTNER_TOKEN && devish) authHeaders['x-dev-allow'] = '1';

  console.log('Calling (auth/dev) ->', `${ADMIN_SERVER_URL}/partner/validate`, 'with', authHeaders);
  try {
    const resp = await fetch(`${ADMIN_SERVER_URL}/partner/validate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    console.log('[auth/dev] status=', resp.status);
    console.log('[auth/dev] response=', text);

    // Consider the smoke successful if we get a 200 in an authenticated or local-dev run
    if (resp.status === 200) process.exit(0);
    // If we're on localhost and didn't get 200, surface non-zero to indicate failure
    process.exit(devish ? 2 : 1);
  } catch (err) {
    console.error('[auth/dev] smoke test error', err);
    process.exit(3);
  }
}

run();
