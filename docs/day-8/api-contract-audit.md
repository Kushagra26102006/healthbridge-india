# HealthBridge India — API Contract Audit (Day 8 Task 06)

**Audit Date:** 2026-11-18  
**API Base Prefix:** `/api/v1` (defined centrally in `@healthbridge/config` -> `APP_CONFIG.apiPrefix`)  
**OpenAPI Discovery:** `GET /api/v1/docs` and `GET /api/v1/docs/openapi.json`

---

## 1. Mounted Route Inventory (`apps/api/src/routes/v1.routes.ts`)

| Mount Path | Rate Limiter | Primary Responsibility | Auth Posture |
|---|---|---|---|
| `/api/v1/health` | None | Liveness & readiness diagnostics | Public |
| `/api/v1/docs` | None | OpenAPI specification & docs UI | Public |
| `/api/v1/auth` | `authLimiter` | Register, login, refresh, logout, password flows | Public + Authenticated |
| `/api/v1/users` | `apiLimiter` | Current user & admin user administration | JWT + RBAC |
| `/api/v1/patients` | `apiLimiter` | Patient dashboard, profile, unified timeline | JWT + RBAC |
| `/api/v1/doctors` | `apiLimiter` | Doctor workspace, schedule, encounters, assigned patients | JWT + RBAC |
| `/api/v1/appointments` | `apiLimiter` | Cross-role appointment booking & status transitions | JWT + RBAC |
| `/api/v1/records` | `apiLimiter` | Clinical health records | JWT + RBAC |
| `/api/v1/prescriptions` | `apiLimiter` | Prescription creation, listing, verification | JWT + RBAC |
| `/api/v1/medication-catalog` | `apiLimiter` | Standardized medication catalog lookup | JWT |
| `/api/v1/consent` & `/api/v1/consents` | `apiLimiter` | Consent requests, patient grant/deny, synchronous revocation | JWT + RBAC |
| `/api/v1/abdm` | `apiLimiter` | ABHA verification/linking, HIP/HIU FHIR exchange, callbacks | JWT / Signed ABDM Callback |
| `/api/v1/pharmacy` | `apiLimiter` | Pharmacy dashboard, inventory, orders, procurement, dispensing | JWT + `PHARMACY` RBAC |
| `/api/v1/laboratory` | `apiLimiter` | Lab dashboard, tests, samples, QC, workforce, collection centers | JWT + `LABORATORY` RBAC |
| `/api/v1/lab-orders` | `apiLimiter` | Cross-role diagnostic lab order lifecycle | JWT + RBAC |
| `/api/v1/lab-reports` | `apiLimiter` | Diagnostic report retrieval & approval | JWT + RBAC |
| `/api/v1/notifications` | `apiLimiter` | Unified inbox, read state, preferences, SSE stream (`/stream`), admin operational events | JWT (no `?token=` on SSE) + RBAC |
| `/api/v1/search` | `apiLimiter` + `searchRateLimiter` (90/min/user) | Global role-scoped search, autocomplete suggestions, session-only recent history | Strict JWT + Permission Matrix |
| `/api/v1/events` | `apiLimiter` | Admin-only outbox/event/dead-letter inspection & replay (no public publish endpoint) | Strict JWT + `ADMIN` |
| `/api/v1/platform` | `apiLimiter` | Platform overview & cross-module admin telemetry | Strict JWT + `ADMIN` |
| `/api/v1/audit` | `apiLimiter` | Security & compliance audit log query | Strict JWT + `ADMIN` |

---

## 2. Standard Response & Error Envelope Consistency

- **Success Envelope (`sendSuccess`):**
  ```json
  {
    "success": true,
    "message": "...",
    "data": { ... }
  }
  ```
- **Error Envelope (`errorHandler` + `AppError`):**
  - Maps `AppError`, Zod `ZodError` (`422`), Mongoose validation/cast/duplicate-key errors (`400`/`409`/`422`), and JWT expiration/invalid errors (`401`) into consistent structured JSON with `X-Request-Id` correlation headers.
  - Production mode omits stack traces and internal database messages.
- **CORS Contract (`apps/api/src/app.ts`):**
  - Explicit `origin: env.CORS_ORIGIN`, `credentials: true`.
  - Allowed headers include `Content-Type`, `Authorization`, `X-Requested-With`, `X-Request-Id`, `X-ABDM-Auth`, and **`Last-Event-ID`** (added during Day 8 Task 06 audit so cross-origin SSE reconnection catch-up succeeds).
  - Exposed headers include `X-Request-Id`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`.

---

## 3. Shared Frontend-Backend Type & Endpoint Alignment

- **Shared Contracts (`@healthbridge/shared-types` & `@healthbridge/validation`):** Both `apps/api` and `apps/web` import identical DTO types (`GlobalSearchResponseDto`, `NotificationItemDto`, `NotificationPreferencesDto`, `UnifiedTimelineItem`, etc.) and Zod validators.
- **Frontend Endpoint Registry (`apps/web/src/lib/api/endpoints.ts`):** Audited against `v1.routes.ts`. Updated during Day 8 Task 06 to include `SEARCH.ROOT`, `SEARCH.SUGGESTIONS`, and `SEARCH.RECENT`, eliminating hardcoded ad-hoc paths.
- **Dual Alias Consistency:** Both `/api/v1/consent` and `/api/v1/consents` mount `consentRoutes` cleanly so legacy and pluralized clients work consistently without divergence.
