# ABDM Consent Security, Privacy & Threat Mitigation (Day 7 Task 03)

## 1. Implemented Security Controls

| Control | Implementation Location | Behavior & Guarantee |
|---|---|---|
| **Patient Ownership** | `AbdmConsentLifecycleService` + `AbdmConsentController` | Acting patient derived strictly from verified JWT (`req.user.userId`). Cross-patient request, artefact, FHIR projection, history, and revocation access returns `403 Forbidden`. |
| **Participant Authorization** | `AbdmConsentLifecycleService` + `AbdmConsentValidationService` | Only authorized clinical/admin roles can initiate HIU requests; `validateAbdmConsentAccess` rejects unauthorized `participantId` (`PARTICIPANT_UNAUTHORIZED`). |
| **Fail-Closed External Authorization** | `AbdmConsentValidationService.validateAbdmConsentAccess` | Denies or withholds access (`DENIED` / `PENDING_EXTERNAL_CONFIRMATION` / `REQUIRES_REVALIDATION`) whenever external confirmation, signature, expiry, revocation, scope, purpose, or date range cannot be verified. |
| **Patient Self-Access Preservation** | `AbdmConsentValidationService` + `ConsentEnforcementService` | Patients accessing their own HealthBridge records are NEVER blocked due to missing external ABDM consent artefacts (`PATIENT_SELF_ACCESS_ALLOWED`). |
| **Internal vs ABDM Boundary** | `AbdmConsentValidationService` + `AbdmConsentAdapter` | Internal HealthBridge consents (`origin: 'INTERNAL_HEALTHBRIDGE'`) are rejected on ABDM exchange checks (`INTERNAL_CONSENT_NOT_ABDM_ARTEFACT`). |
| **Anti-Forgery Approval Protection** | `AbdmConsentLifecycleService` + Frontend UI | Zero local "Approve ABDM Consent" endpoint or UI button; callbacks referencing unknown `externalRequestId` are rejected and audited as `BLOCKED`. |
| **Callback Auth, Replay & Ordering** | `AbdmWebhookService` + `AbdmConsentLifecycleService` | HMAC-SHA256 / timing-safe secret auth, ±5m replay window, unique `{ eventId, eventType }` idempotency, monotonic terminal states, and `lastExternalEventAt` anti-stale-overwrite guard. |
| **Cache Invalidation** | `AbdmConsentValidationService.invalidateByArtefact` | Immediate cache purge on revocation initiation, confirmed `REVOKED` callback, and `EXPIRED` sync transition. |
| **At-Rest Encryption & Redaction** | `abha-crypto.util.ts` + `redaction.ts` | Sensitive artefact metadata encrypted with AES-256-GCM; tokens, secrets, Aadhaar, and full ABHA numbers redacted from logs and audit metadata. |
| **Zero-PII Admin Telemetry** | `getAdminConsentAnalytics` | Admin dashboard (`/admin/integrations/abdm`) returns aggregate counts only and separates `mockedDevelopment`, `sandbox`, and `production` counts. |

## 2. Privacy-Safe Notifications

All 9 consent notification event types (`ABDM_CONSENT_REQUEST_CREATED`, `ABDM_CONSENT_REQUEST_SUBMITTED`, `ABDM_CONSENT_APPROVED`, `ABDM_CONSENT_REJECTED`, `ABDM_CONSENT_NEARING_EXPIRY`, `ABDM_CONSENT_EXPIRED`, `ABDM_CONSENT_REVOCATION_INITIATED`, `ABDM_CONSENT_REVOCATION_CONFIRMED`, `ABDM_CONSENT_SYNC_FAILED`) emit in-app notifications (`channels: ['IN_APP']`) containing zero clinical findings or sensitive medical payloads, and make no false claims of external SMS/email delivery.
