PR Title: feat(server): partner server-side coupon validation + migrations & smoke-tests

Summary
-------
Implements server-side, atomic coupon validation and consumption for partners (`POST /partner/validate`). Moves trust away from the client, adds DB RPC/migrations and RLS guidance, integrates the frontend to call the server, and provides smoke-tests + dev-only tooling for local development.

Why
---
Client-side validation allowed fraud (replay / forged coupons). This change enforces server-side atomic validation + DB-level controls to prevent double-spend and privilege escalation.

Key changes (for reviewers)
---------------------------
- server/admin-server-secure.js — new `/partner/validate` handler, dev-only localhost bypass, HMAC signature checks, rate limiting
- services/couponService.ts — calls server endpoint, DEV-only header for local dev, increased coupon entropy
- screens/PartnerDashboard.tsx — calls server validation endpoint (replaced client-only flow)
- server/migrations/001_consume_coupon_rpc.sql — atomic RPC to consume coupon
- server/migrations/002_rls_coupons.sql — RLS + index recommendations
- scripts/validate_coupon_smoke.js — smoke tests for both protected and dev flows
- docs/VALIDATE-COUPON.md — endpoint docs and rollout checklist

Security impact
---------------
- High: fixes client-side authoritative validation → now server-authoritative with atomic consume.
- No production relaxations: DEV bypass is strictly loopback/private-IP + header + disabled in production.

Testing & verification (what CI does)
-------------------------------------
- Type-check & build
- Apply migrations against `STAGING_DATABASE_URL` (if provided)
- Start the admin server and run `npm run test:smoke` (unauth + dev/local happy path)
- Optional: Playwright E2E (if configured)

How to test locally (maintainer)
--------------------------------
1. Start admin server locally:
   - PORT=3001 node server/admin-server-secure.js
2. Run app:
   - npm run dev
3. Smoke-test (local):
   - npm run test:smoke
   - Expect: first call 401, second call 200 (dev happy-path)
4. Full staging test (with secrets):
   - STAGING_DATABASE_URL="postgres://..." STAGING_SUPABASE_URL="..." STAGING_SUPABASE_SERVICE_ROLE_KEY="..." STAGING_ADMIN_API_KEY="..." npm run test:smoke

Rollout checklist (must complete before merge)
----------------------------------------------
- [ ] Apply migrations to *staging* and run smoke + E2E
- [ ] Add CI job that runs migrations + smoke (this PR includes it)
- [ ] Confirm RLS policies on staging and sample queries
- [ ] Monitor logs and failed validations for 48h after enabling in prod
- [ ] Create a short post‑deploy rollback plan (SQL to revert RPC if needed)

Rollback plan
-------------
- Revert PR; run the reverse migration (provided in migrations folder) on staging; monitor.

Required reviewers
------------------
- @backend-owner (DB / Supabase)
- @security (security review)
- @frontend-owner (UX/flows)

Labels
------
- security
- migration
- semver:major

Notes for maintainers
---------------------
- Do NOT enable UNIQUE index on `coupons(code)` until you confirm no duplicates exist in prod; add the index in a separate migration with a background check.
- The PR adds a safe, local-only dev bypass to speed developer testing — validate nothing of that bypass goes to prod.


---
Paste the checklist above into the GitHub PR body and attach the `server/VALIDATE-COUPON.md` doc for integrators.