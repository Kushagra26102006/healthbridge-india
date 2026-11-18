#!/usr/bin/env node
/**
 * HealthBridge India — Production / Staging Post-Deployment Smoke Test Suite
 *
 * Non-destructive, zero-PHI verification of API health, readiness, security headers,
 * server-side authentication enforcement, and frontend route availability.
 *
 * Usage:
 *   API_BASE_URL=https://api.example.com WEB_BASE_URL=https://app.example.com node scripts/production-smoke-test.mjs
 */

const API_BASE = (process.env.API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');
const WEB_BASE = (process.env.WEB_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');

const results = [];

async function check(name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ name, status: 'PASS', durationMs: Date.now() - start, detail });
  } catch (err) {
    results.push({
      name,
      status: 'FAIL',
      durationMs: Date.now() - start,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

async function main() {
  // 1. API Liveness, Readiness, Health & Security Headers
  await check('API Liveness (/api/v1/health/live)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/health/live`);
    if (res.status !== 200) throw new Error(`Expected 200, received ${res.status}`);
    if (res.headers.get('x-powered-by')) throw new Error('X-Powered-By header leaked');
    if (res.headers.get('x-content-type-options') !== 'nosniff') {
      throw new Error('Missing X-Content-Type-Options: nosniff');
    }
    return '200 OK + hardened headers';
  });

  await check('API Readiness (/api/v1/health/ready)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/health/ready`);
    const body = await res.json();
    if (res.status !== 200 || !body?.data?.ready) {
      throw new Error(`API not ready (status=${res.status}, db=${body?.data?.database?.status})`);
    }
    return `DB connected (${body.data.database?.latencyMs ?? '?'}ms)`;
  });

  await check('API Auth Enforcement (GET /api/v1/audit/logs -> 401)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/audit/logs`);
    if (res.status !== 401) throw new Error(`Expected 401, received ${res.status}`);
    return '401 UNAUTHORIZED enforced';
  });

  await check('API Auth Enforcement (GET /api/v1/records -> 401)', async () => {
    const res = await fetch(`${API_BASE}/api/v1/records`);
    if (res.status !== 401) throw new Error(`Expected 401, received ${res.status}`);
    return '401 UNAUTHORIZED enforced';
  });

  // 2. Frontend Public, Auth & Portal Shell Routes
  const webRoutes = [
    '/',
    '/login',
    '/register',
    '/privacy-policy',
    '/patient/dashboard',
    '/doctor/dashboard',
    '/pharmacy/dashboard',
    '/laboratory/dashboard',
    '/admin/audit-logs',
    '/dashboard/search',
  ];

  for (const route of webRoutes) {
    await check(`Web Route (${route})`, async () => {
      const res = await fetch(`${WEB_BASE}${route}`, { redirect: 'follow' });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      if (res.headers.get('x-frame-options') !== 'DENY') {
        throw new Error('Missing X-Frame-Options: DENY');
      }
      return `HTTP ${res.status} + X-Frame-Options: DENY`;
    });
  }

  const failed = results.filter((r) => r.status === 'FAIL');
  console.log(
    JSON.stringify(
      {
        executedAt: new Date().toISOString(),
        apiBase: API_BASE,
        webBase: WEB_BASE,
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        results,
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
