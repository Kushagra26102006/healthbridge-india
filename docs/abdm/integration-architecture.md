# ABDM Integration Module Architecture — HealthBridge India

## 1. Module Structure (`apps/api/src/modules/abdm/`)
The ABDM integration layer is isolated inside a dedicated domain module so external ABDM protocol details never leak into core Patient, Doctor, Pharmacy, or Laboratory services:

```
apps/api/src/modules/abdm/
├── adapters/
│   ├── abdm-consent.adapter.ts              # Internal vs ABDM HIE-CM Consent Artefact separation
│   └── abdm-health-information.adapter.ts   # HIP & HIU readiness & live-transfer guard
├── clients/
│   └── abdm-http.client.ts                  # Timeout, UUID correlation, idempotent retries, log redaction
├── controllers/
│   └── abdm.controller.ts                   # Admin status, FHIR validate, webhook receiver
├── errors/
│   └── abdm-error.ts                        # Structured AbdmIntegrationError taxonomy
├── mappers/
│   └── abdm-fhir.mapper.ts                  # Internal -> FHIR R4 / NRCeS Document Bundle mapper
├── models/
│   └── abdm-webhook-event.model.ts          # Idempotent callback event persistence
├── routes/
│   └── abdm.routes.ts                       # /api/v1/abdm/* routes
├── services/
│   ├── abdm-authentication.service.ts       # Server-only token cache & V3 sessions abstraction
│   ├── abdm-configuration.service.ts        # Environment validation, production lock, redacted status
│   └── abdm-correlation.service.ts          # REQUEST-ID UUID & async on-* correlation tracker
├── utils/
│   └── redaction.ts                         # Deep log redaction (secrets, tokens, ABHA, PHI)
├── validators/
│   └── fhir-r4.validator.ts                 # FHIR R4 + NRCeS Document Bundle structural validator
└── webhooks/
    └── abdm-webhook.service.ts              # Auth, ±5m replay guard, idempotency, audit logging
```

## 2. Environment Modes & Safety Guarantees
- **`disabled` (`ABDM_ENABLED=false`, default):** Application runs cleanly with zero ABDM credentials; outbound calls fail closed with `ABDM_DISABLED`.
- **`development`:** Enables local mocked token & unit testing without contacting external endpoints; dashboard reports `MOCKED`.
- **`sandbox`:** Requires valid `ABDM_BASE_URL`, `ABDM_X_CM_ID`, non-placeholder `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`. Live V3 session exchange remains explicitly gated (`ABDM_NOT_IMPLEMENTED_LIVE`) in Task 01 until sandbox onboarding completes.
- **`production`:** Hard-locked by `ABDM_ALLOW_PRODUCTION=false` (`ABDM_PRODUCTION_LOCKED` / `PRODUCTION_NOT_ENABLED`).

## 3. HTTP Client Reliability & Error Taxonomy
- **Timeouts:** Enforced via `AbortController` (`ABDM_REQUEST_TIMEOUT_MS`, clamped `1000–60000ms`, default `15000ms`).
- **Retry Policy:** Bounded retries (max 3 attempts) for transient HTTP (`408`, `429`, `502`, `503`, `504`) and network errors **strictly restricted to idempotent requests** (`GET`, `HEAD`, `OPTIONS`, or explicitly marked `idempotent: true`). Non-idempotent `POST` mutations never blindly retry.
- **Auth Failure Handling:** HTTP `401` immediately clears the cached token (`abdmAuthenticationService.clearToken()`) and throws `ABDM_AUTH_ERROR`.
- **Correlation Tracking:** Every outbound request stamps a fresh RFC 4122 UUID in `REQUEST-ID` and UTC ISO-8601 in `TIMESTAMP`, tracked by `AbdmCorrelationService` for asynchronous `on-*` matching.
