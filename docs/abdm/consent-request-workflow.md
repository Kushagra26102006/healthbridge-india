# ABDM Consent Request Workflow (Day 7 Task 03)

## 1. End-to-End Request Initiation Lifecycle

Implemented in `AbdmConsentLifecycleService.initiateConsentRequest` (`apps/api/src/modules/abdm/services/abdm-consent-lifecycle.service.ts`) and `AbdmConsentV3Client.initConsentRequest` (`apps/api/src/modules/abdm/clients/abdm-consent-v3.client.ts`):

1. **Participant Authorization:** Only authorized roles (`DOCTOR`, `LABORATORY`, `PHARMACY`, `ADMIN`) may initiate an HIU consent request. `PATIENT` requests to this endpoint are rejected with HTTP `403`.
2. **Patient Identity Verification:** Queries `AbhaLinkModel` for an active, verified ABHA identity (`linkStatus: 'LINKED'`, `verificationStatus: 'VERIFIED'`). Unlinked patients or mismatched ABHA addresses are rejected (`400 Bad Request`).
3. **Request Payload Validation (`createAbdmConsentRequestSchema`):**
   - Official purpose code (`CAREMGT | BTG | PUBHLTH | HPAYMT | DSRCH | PATRQT`).
   - Official HI-types (`DiagnosticReport | Prescription | OPConsultation | DischargeSummary | ImmunizationRecord | HealthDocumentRecord | WellnessRecord`).
   - Valid ISO-8601 `dateRange` (`from <= to`).
   - Future `dataEraseAt` and optional `expiresAt`.
   - Access mode (`VIEW | STORE | QUERY | STREAM`) and frequency (`unit`, `value`, `repeats`).
4. **Persistence Before Outbound Call:** Creates `AbdmConsentRequest` with `internalStatus: 'PENDING_SUBMISSION'` and `externalStatus: 'UNKNOWN'`, paired with an RFC 4122 UUID `correlationId`.
5. **External Submission (`POST /api/hiecm/consent/v3/request/init`):**
   - In `development` mode: Synthetic mock adapter returns `accepted: true`, synthetic `externalRequestId`, `externalStatus: 'REQUESTED'`, `isMocked: true`. **Never fabricates an `APPROVED`/`GRANTED` consent.**
   - In `sandbox` mode: Invokes official ABDM Gateway endpoint over HTTPS with `Authorization: Bearer <token>`, `REQUEST-ID`, `TIMESTAMP`, `X-CM-ID`, and `X-HIU-ID`.
   - In `disabled` or locked `production` mode: Fails closed (`ABDM_DISABLED` / `ABDM_PRODUCTION_LOCKED`).
6. **Status Transition & Notifications:**
   - Transitions `internalStatus` to `AWAITING_PATIENT_ACTION` (or `SUBMITTED` pending `on-init` callback) and `externalStatus` to `REQUESTED`.
   - Emits privacy-safe in-app notifications (`ABDM_CONSENT_REQUEST_CREATED` to patient; `ABDM_CONSENT_REQUEST_SUBMITTED` to requester) containing zero medical details.
   - Records immutable `AbdmConsentEvent` and `AuditLog`.

## 2. Patient Review & Official Approval Guidance

- Patients inspect pending requests at `/patient/consent/requests` and `/patient/consent/requests/[id]`.
- The UI explains the requesting organization, purpose, HI-types, date range, frequency, expiry/erasure deadlines, and consequences of granting access.
- **No Local Approval Simulation:** HealthBridge does NOT provide a button to flip an ABDM consent request to `APPROVED` locally. Patients are directed to their official ABDM PHR application (`phr.abdm.gov.in` / ABHA App), and HealthBridge synchronizes the authentic outcome via verified HIE-CM callbacks.
