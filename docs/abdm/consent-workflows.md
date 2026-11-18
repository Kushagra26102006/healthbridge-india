# HealthBridge India — ABDM Consent Manager Workflows (Phase 17)

## 1. Strict Separation of Internal & ABDM Consents

HealthBridge India maintains a strict architectural boundary between:
1. **Internal Platform Consent (`apps/api/src/modules/consent/`):** Governs direct HealthBridge Doctor ↔ Patient access inside the application (`consentEnforcementService`).
2. **ABDM HIE-CM Consent Artefacts (`apps/api/src/modules/abdm/services/abdm-consent-*.ts`):** Governs external cross-facility Health Information Exchange (HIP/HIU).

**Critical Rule:** An internal HealthBridge consent or frontend toggle is **never** treated as a valid ABDM HIE-CM signed Consent Artefact (`INTERNAL_CONSENT_NOT_ABDM_ARTEFACT` denial code).

---

## 2. Consent Lifecycle Capabilities

Implemented in `abdm-consent-lifecycle.service.ts`, `abdm-consent-validation.service.ts`, and `abdm-consent.controller.ts`:

| Stage | Endpoint / Mechanism | Security & Validation Rules |
| --- | --- | --- |
| **Consent Request Creation** | `POST /api/v1/abdm/consent/requests` (`DOCTOR`, `LABORATORY`, `PHARMACY`, `ADMIN`) | Validates purpose code (`CAREMGT`, `BTG`, `PUBHLTH`, `HPAYMT`, `DSRCH`, `PATRQT`), `hiTypes`, `dateRange` (`from <= to`), and future `dataEraseAt`. |
| **Request Status & Refresh** | `GET /api/v1/abdm/consent/requests`, `POST /api/v1/abdm/consent/requests/:id/refresh` (`PATIENT`) | Tracks `internalStatus` and `externalStatus` (`REQUESTED`, `GRANTED`, `DENIED`, `EXPIRED`, `REVOKED`) with correlation IDs. |
| **External Approval / Denial Callbacks** | `POST /api/v1/abdm/webhooks/consent/:callbackType` | Official ABDM consent approval originates externally from the patient's PHR app; callbacks require HMAC/secret verification, ±5m replay check, and idempotency. |
| **Artefact Inspection & FHIR Projection** | `GET /api/v1/abdm/consent/artefacts`, `/:id`, `/:id/fhir` (`PATIENT`) | Preserves original external payload SHA-256 hash and projects to FHIR R4 `Consent`. |
| **Consent Withdrawal / Revocation** | `POST /api/v1/abdm/consent/artefacts/:id/revoke` (`PATIENT`) | Records mandatory revocation reason, updates artefact status to `REVOKED`, and immediately blocks subsequent data exchange. |
| **Expiry Enforcement & Sync Sweep** | `POST /api/v1/abdm/consent/sync` (`ADMIN`) + runtime checks | Marks expired requests/artefacts (`dataEraseAt < now`) and blocks access automatically even before a sweep runs. |
| **Pre-Exchange Access Validation** | `POST /api/v1/abdm/consent/validate-access` | Verifies active `GRANTED` status, verified signature, purpose match, permitted `hiType`, requested record date within `[dateRange.from, dateRange.to]`, and non-revoked / non-expired state. |
| **Immutable Audit History** | `GET /api/v1/abdm/consent/history` (`PATIENT`) | Persists lifecycle events in `AbdmConsentEventModel` and `AuditLogModel`. |

---

## 3. Verified vs. Pending External Sandbox Steps

- **Implemented & Unit-Tested:** `14 / 14` unit tests in `apps/api/tests/unit/abdm-consent-manager.test.ts` pass (request validation, callback handling, revocation enforcement, expiry enforcement, purpose/HI-type/date-window checks, separation from internal consents).
- **Awaiting Official Sandbox Onboarding:** Live HIE-CM webhook callbacks (`on-init`, `hiu/notify`, `hip/notify`, `on-fetch`) require registered public HTTPS callback endpoints and official sandbox credentials.
