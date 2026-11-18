# HealthBridge India — ABDM Integration Architecture (Phase 17)

## 1. Executive Summary & Architectural Audit

HealthBridge India implements a standards-aligned **Ayushman Bharat Digital Mission (ABDM) V3 Interoperability Layer** inside `apps/api/src/modules/abdm/` that integrates cleanly with existing JWT authentication, RBAC, MongoDB schemas, internal consent enforcement, medical records, laboratory reports, and Next.js role portals without replacing working core modules.

### Audit Findings & Gap Closure (Phase 17)
- **Existing Foundation Preserved (48 backend files):** ABDM V3 HTTP/auth clients (`abdm-http.client.ts`, `abdm-authentication.service.ts`, `abha-v3.client.ts`, `abdm-consent-v3.client.ts`, `abdm-hie-v3.client.ts`), configuration & production-lock service (`abdm-configuration.service.ts`), correlation tracking (`abdm-correlation.service.ts`), webhook replay/idempotency handler (`abdm-webhook.service.ts`), ABHA identity service (`abha-identity.service.ts`), consent lifecycle & validation services (`abdm-consent-lifecycle.service.ts`, `abdm-consent-validation.service.ts`), and HIP/HIU services (`abdm-hip.service.ts`, `abdm-hiu.service.ts`).
- **Phase 17 Gaps Closed:**
  1. Completed NRCeS FHIR R4 mappers and structural validators for `Appointment`, `Condition`, `AllergyIntolerance`, `Encounter`, `MedicationRequest`, `MedicationStatement`, and `DocumentReference` (`abdm-fhir.mapper.ts`, `fhir-r4.validator.ts`).
  2. Added PII-free Admin Webhook/Callback Telemetry (`abdmWebhookService.getAdminWebhookAnalytics()`) exposed via `GET /api/v1/abdm/status` and rendered on `/admin/integrations/abdm` alongside an interactive synthetic FHIR R4 Structural Validator wired to `POST /api/v1/abdm/fhir/validate`.
  3. Enhanced `/patient/abha` with unified backend-driven interoperability overview cards (**Linked Health Records**, **Consent Overview**, **Data-Sharing History**) and accessible `<ErrorState>` recovery.

---

## 2. Layered System Architecture

```text
Frontend Portals (apps/web)
  ├── Patient Portal (/patient/abha, /patient/abha/link, /patient/abha/verification,
  │                   /patient/abha/history, /patient/abdm/*, /patient/consent/*)
  ├── Doctor Portal  (/doctor/abdm/health-records — read-only imported external records)
  └── Admin Portal   (/admin/integrations/abdm — readiness, webhook telemetry, FHIR validator)
           │
           ▼  (JWT Auth + Strict RBAC + Dedicated Rate Limiters)
Express ABDM Module (apps/api/src/modules/abdm)
  ├── Configuration & Production Lock (abdm-configuration.service.ts)
  ├── Gateway Auth & HTTP Client (abdm-authentication.service.ts, abdm-http.client.ts)
  │     └── REQUEST-ID, TIMESTAMP, X-CM-ID headers, timeouts, safe retry policy
  ├── ABHA V3 Identity Service (abha-identity.service.ts, abha-v3.client.ts)
  ├── Consent Manager V3 Service (abdm-consent-lifecycle.service.ts, abdm-consent-validation.service.ts)
  ├── FHIR R4 Mapper & Validator (abdm-fhir.mapper.ts, fhir-r4.validator.ts)
  ├── HIP & HIU Exchange Services (abdm-hip.service.ts, abdm-hiu.service.ts, abdm-fhir-bundle.service.ts)
  └── Inbound Callback Receiver (abdm-webhook.service.ts — HMAC/secret + ±5m replay + idempotency)
           │
           ▼
External ABDM V3 Gateways (Disabled / Mocked in Dev; Pending Official Sandbox Onboarding)
  ├── ABDM Gateway (dev.abdm.gov.in — HIE-CM / HIP / HIU)
  └── ABHA V3 Gateway (abhasbx.abdm.gov.in/abha/api/v3)
```

---

## 3. Participant Role Boundaries

| ABDM Role | HealthBridge Scope | Current Status |
| --- | --- | --- |
| **ABHA Client (M1)** | Patient-initiated ABHA creation, verification, address check/create, encrypted linking & local unlink | Implemented & unit-tested (mocked); pending live sandbox credentials |
| **HIP (M2)** | Care-context discovery, linking, consent-checked FHIR R4 Document Bundle assembly, encrypted transfer | Implemented & unit-tested (mocked); pending HFR sandbox ID & live Fidelius Curve25519 bridge |
| **HIU (M3)** | Consent request initiation, status tracking, encrypted FHIR bundle receipt, structural validation, read-only import & patient review | Implemented & unit-tested (mocked); pending HIE-CM sandbox registration & live Fidelius decryption |

---

## 4. Security, Privacy & Production Safeguards

- **Zero Hardcoded Secrets:** All credentials are injected exclusively via backend environment variables and never returned to frontend clients.
- **Production Lock (`ABDM_ALLOW_PRODUCTION=false`):** Startup and runtime validation blocks `production` mode until sandbox exit, CERT-In WASA audit, and NHA approval are completed.
- **Callback Hardening:** Inbound `/api/v1/abdm/webhooks/*` endpoints enforce burst rate limiting (`120/min`), HMAC-SHA256 / constant-time shared-secret verification, ±5 minute timestamp replay protection, and compound unique `(requestId, eventType)` idempotency in `AbdmWebhookEventModel`.
- **Log Redaction:** `redactAbdmLogPayload()` scrubs tokens, secrets, Aadhaar, and full ABHA numbers from Pino logs and `AuditLogModel`.
- **No Premature Compliance Claims:** Internal controls align with ABDM/DISHA/DPDP principles, but formal regulatory compliance requires independent WASA audit and NHA certification.
