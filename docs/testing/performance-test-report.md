# HealthBridge India — Performance & Bundle Verification Report

## 1. Production Build Bundle Metrics (`next build`)

- **Next.js Version:** `14.2.35` (React `18.3.1`)
- **Shared First Load JS (All Routes):** **`87.5 kB`** (`chunks/2749-*.js`: `31.9 kB`, `chunks/5b8f0dd8-*.js`: `53.7 kB`, other shared chunks: `1.95 kB`).
- **Key Route First Load JS Sizes:**
  - `/privacy-policy`: `127 kB` (route chunk `2.47 kB`)
  - `/patient/settings/*`: `155–156 kB`
  - `/pharmacy/dispensing`: `160 kB`
  - `/register` / `/reset-password`: `231–234 kB`
  - `/pharmacy/dashboard`: `318 kB` (includes Recharts analytics & multi-tab inventory widgets)

---

## 2. Live Headless Chrome CDP Navigation & Paint Timings (`next start`)

Measured locally against production `next start` (`http://127.0.0.1:3019`, Headless Chrome `1440×900`, `2026-11-18T15:15:54Z`):

| Route | TTFB (ms) | FCP (ms) | DOMContentLoaded (ms) | Load Event (ms) | Resources | Transfer (kB) |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 6 | 60 | 47 | 75 | 32 | 307 |
| `/login` | 4 | 44 | 7 | 30 | 39 | 25 |
| `/register` | 1 | 20 | 5 | 18 | 37 | 6 |
| `/forgot-password` | 2 | 24 | 5 | 17 | 37 | 6 |
| `/privacy-policy` | 4 | 20 | 7 | 14 | 43 | 66 |
| `/patient/dashboard` (auth redirect/shell) | 4 | 24 | 8 | 18 | 52 | 30 |
| `/doctor/dashboard` (auth redirect/shell) | 8 | 16 | 12 | 21 | 58 | 112 |
| `/pharmacy/dashboard` (auth redirect/shell) | 7 | 28 | 11 | 21 | 54 | 100 |
| `/laboratory/dashboard` (auth redirect/shell) | 4 | 24 | 8 | 16 | 52 | 30 |
| `/admin/audit-logs` (auth redirect/shell) | 4 | 20 | 8 | 16 | 50 | 21 |
| `/dashboard/search` (auth redirect/shell) | 7 | 28 | 12 | 18 | 42 | 16 |

---

## 3. Backend API Execution Speed (Measured Under Supertest Integration Load)

- **49 integration & E2E suites (646 HTTP/workflow assertions):** Completed in **`4.71 s`** total (`0–6 ms` typical per-request Express handler latency in mocked-DB integration logs).
- **22 backend unit suites (188 tests):** Completed in **`1.66 s`**.
- **4 frontend unit suites (32 tests):** Completed in **`190 ms`**.

---

## 4. Limitations & Recommended Next Performance Benchmarks

- **Lighthouse CLI & Network-Throttled Mobile Profiles (Slow 4G / 4x CPU slowdown):** Lighthouse is not installed in the offline environment; local loopback measurements reflect optimal server/network conditions and should be supplemented with throttled Lighthouse CI runs on a staging URL.
- **Database Query Profiling (`explain('executionStats')`):** Real MongoDB query execution plans under 10k+ synthetic clinical records require a seeded MongoDB instance and should be run as part of staging load testing.
- **Bundle Optimization Opportunity:** Pharmacy/Laboratory dashboards currently ship ~`307–318 kB` First Load JS; lazy-loading heavy Recharts modules via `next/dynamic` (`ssr: false`) is recommended in a future optimization pass.
