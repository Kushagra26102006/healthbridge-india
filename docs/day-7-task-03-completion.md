# Day 7 — Task 03 Completion Report: ABDM Consent Manager Integration — Consent Requests, Consent Artefacts, Patient Approval, Revocation & Access Authorization

> **Accuracy Statement:** This report reflects **only** what was researched, implemented, and verified in Day 7 Task 03. All ABDM Consent Manager tests executed in this task used **synthetic test data and mocked/development adapters** (`isMocked: true` / `MOCKED`). HealthBridge India does **NOT** claim live ABDM HIE-CM sandbox connectivity, live external patient approval, live external revocation confirmation, live Health Information Exchange (Fidelius transfer), official NHA onboarding/certification, official NRCeS FHIR IG conformance, or production readiness.

---

## 1. Official Consent Specifications Verified
Verified on 2026-11-18 from official ABDM / NHA / NRCeS documentation (`abdm.gov.in`, `sandbox.abdm.gov.in`, `developer.abdm.gov.in`, `nrces.in/ndhm/fhir/r4`) and catalogued in `docs/abdm/consent-api-verification-matrix.md`:
- **HIU Consent Request Initiation:** `POST /api/hiecm/consent/v3/request/init` (`202 Accepted` async gateway acknowledgement) & callback `POST /api/v3/hiu/consent/request/on-init`.
- **HIU Consent Request Status Check:** `POST /api/hiecm/consent/v3/request/status` & callback `POST /api/v3/hiu/consent/request/on-status`.
- **HIU Consent Notification & Acknowledgement:** Callback `POST /api/v3/hiu/consent/request/notify` (`GRANTED | DENIED | EXPIRED | REVOKED`) & outbound ack `POST /api/hiecm/consent/v3/request/hiu/on-notify`.
- **HIU Consent Artefact Fetch:** `POST /api/hiecm/consent/v3/fetch` & callback `POST /api/v3/hiu/consent/on-fetch`.
- **HIP Consent Notification & Acknowledgement:** Callback `POST /api/v3/consent/request/hip/notify` (and `/api/v3/hip/consent/request/notify` route alias) & outbound ack `POST /api/hiecm/consent/v3/request/hip/on-notify`.
- **Consent Revocation (PHR-role gated):** `POST /api/hiecm/gateway/v3/consents/revoke` (requires PHR App onboarding + patient `X-AUTH-TOKEN`; HIU/HIP facilities cannot unilaterally force external revocation).
- **Official HI Types & Purpose Codes:** `OPConsultation`, `Prescription`, `DiagnosticReport`, `DischargeSummary`, `ImmunizationRecord`, `HealthDocumentRecord`, `WellnessRecord`; purpose codes `CAREMGT`, `BTG`, `PUBHLTH`, `HPAYMT`, `DSRCH`, `PATRQT`.
- **FHIR R4 Consent Alignment Reference:** NRCeS ABDM FHIR R4 IG `Consent` profile reference (`https://nrces.in/ndhm/fhir/r4/StructureDefinition/Consent` — structural foundation only; official IG conformance is **NOT** claimed).

## 2. API Versions and Workflows Implemented
- **ABDM HIE-CM Consent APIs:** `V3` (`https://dev.abdm.gov.in/api/hiecm/consent/v3/*` & `/api/hiecm/gateway/v3/consents/revoke`).
- **Gateway Session Auth:** `V3` (`POST /api/hiecm/gateway/v3/sessions`, reused from Day 7 Task 02 `AbdmAuthenticationService`).
- **Deprecated V0.5 / V1 / V2 Consent Paths:** Explicitly unsupported; never invoked.
- **HealthBridge REST Endpoints Added (`/api/v1/abdm/consent/*` & `/api/v1/abdm/webhooks/consent/:callbackType`):**
  - `POST /api/v1/abdm/consent/requests` — Initiate HIU consent request (authorized requester roles + verified active ABHA link required).
  - `GET /api/v1/abdm/consent/requests` — List consent requests (scoped to authenticated patient or requester/admin).
  - `GET /api/v1/abdm/consent/requests/:id` — Consent request detail + recent lifecycle events.
  - `POST /api/v1/abdm/consent/requests/:id/sync` — Request status sync against ABDM V3 adapter (`status` / `fetch`).
  - `GET /api/v1/abdm/consent/artefacts` — List stored ABDM consent artefacts.
  - `GET /api/v1/abdm/consent/artefacts/:id` — Artefact detail (integrity hash, validation state, append-only status history).
  - `GET /api/v1/abdm/consent/artefacts/:id/fhir` — HL7 FHIR R4 `Consent` projection with `unmappedFields` and `officialIgConformanceClaimed: false`.
  - `POST /api/v1/abdm/consent/artefacts/:id/revoke` — Patient-authenticated revocation initiation (`PENDING_CONFIRMATION` until external confirmation).
  - `POST /api/v1/abdm/consent/validate` — Centralized fail-closed ABDM consent access authorization evaluation.
  - `GET /api/v1/abdm/consent/history` — Patient/Admin ABDM consent lifecycle & callback audit event ledger.
  - `POST /api/v1/abdm/consent/sync/run` — Admin-triggered scheduler-safe expiry & status synchronization sweep.
  - `GET /api/v1/abdm/consent/analytics` — Admin zero-PII aggregate consent telemetry (also surfaced on `GET /api/v1/abdm/status`).
  - `POST /api/v1/abdm/webhooks/consent/:callbackType` — Authenticated webhook ingress for `hiu-on-init`, `hiu-on-status`, `hiu-notify`, `hiu-on-fetch`, `hip-notify`.

## 3. Consent Request Implementation Status
- **Status:** `IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER` (verified with mocked/development adapter; live sandbox submission `PENDING_SANDBOX_VERIFICATION`).
- **Implementation:** `AbdmConsentRequestModel` + `AbdmConsentLifecycleService.initiateConsentRequest(...)` + `AbdmConsentV3Client.initConsentRequest(...)`.
- **Guarantees:**
  - Enforces strict separation between internal HealthBridge consent (`ConsentModel`) and external ABDM HIE-CM consent (`AbdmConsentRequestModel`).
  - Enforces verified active `AbhaLinkModel` before creating an ABDM consent request (`400 ABDM_PATIENT_ABHA_NOT_VERIFIED`).
  - Separates internal statuses (`DRAFT | PENDING_SUBMISSION | SUBMITTED | AWAITING_PATIENT_ACTION | APPROVED | REJECTED | EXPIRED | REVOKED | FAILED | CANCELLED`) from official ABDM external statuses (`REQUESTED | GRANTED | DENIED | EXPIRED | REVOKED | UNKNOWN`).
  - In `development` mock mode, returns `REQUESTED` / `AWAITING_PATIENT_ACTION` only — **never** fabricates `APPROVED` or fake artefacts.
  - In `disabled` or locked `production` (`ABDM_ALLOW_PRODUCTION=false`) mode, fails closed without outbound traffic.
  - Patient UI (`/patient/consent/requests` & `/patient/consent/requests/[id]`) explicitly directs patients to official ABDM Consent Manager / PHR portals and provides **zero** local approval button.

## 4. Artefact Handling Status
- **Status:** `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS` (live sandbox artefact fetch `PENDING_SANDBOX_VERIFICATION`).
- **Implementation:** `AbdmConsentArtefactModel` + `AbdmConsentLifecycleService.ingestExternalArtefact(...)`.
- **Guarantees:**
  - Immutable preservation (`immutable: true`) of `origin`, `originalExternalPayload`, and SHA-256 `payloadSha256` integrity digest.
  - Sensitive external artefact payload encrypted at rest using AES-256-GCM (`encryptedSensitivePayload`, `select: false`).
  - Append-only `statusHistory[]` recording every state change with source, reason, and timestamp.
  - Schema-validated via `externalAbdmArtefactPayloadSchema` (`Zod`); rejects malformed, expired, date-inverted, or unauthorized artefacts (`VALIDATION_FAILED`).
  - Internal HealthBridge consents (`ConsentModel`) are never accepted as ABDM artefacts (`origin` must be `ABDM_HIE_CM`).

## 5. Approval Synchronization Status
- **Status:** `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS` (live gateway callbacks `NOT_EXECUTED_PENDING_SANDBOX_ONBOARDING`).
- **Implementation:** `AbdmWebhookService` -> `AbdmConsentLifecycleService.processConsentCallback(...)` + `AbdmConsentEventModel`.
- **Guarantees:**
  - Webhook authentication, ±5-minute replay timestamp guard, and persistent deduplication (`AbdmCallbackEventModel` + compound unique `{ eventId, eventType }` on `AbdmConsentEventModel`).
  - Unknown `consentRequestId` callbacks are rejected (`404 ABDM_UNKNOWN_CONSENT_REQUEST` / forged callback defense).
  - Monotonic terminal-state protection prevents `REVOKED` or `EXPIRED` states from being reverted to `APPROVED` / `GRANTED`.
  - Out-of-order / stale timestamps (`eventTimestamp < lastExternalEventAt`) are recorded as ignored without overwriting newer state.
  - Automatic outbound `hiu/on-notify` / `hip/on-notify` acknowledgements invoked via `AbdmConsentV3Client`.

## 6. Revocation Implementation Status
- **Status:** `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS` (external PHR gateway confirmation `PENDING_SANDBOX_VERIFICATION`).
- **Implementation:** `AbdmConsentLifecycleService.initiateRevocation(...)` + Patient UI (`/patient/consent/artefacts`).
- **Guarantees:**
  - Strict patient-ownership enforcement (`403` for non-owning patients or unauthorized roles).
  - When external ABDM confirmation is not synchronously confirmed (e.g., HIU/HIP role without PHR `X-AUTH-TOKEN` or mock/sandbox async flow), marks `revocationStatus = 'PENDING_CONFIRMATION'` honestly rather than falsely claiming external confirmation, while immediately disabling local access (`externalStatus = 'REVOKED'` / `accessAllowed = false`) and purging the validation decision cache (`abdmConsentValidationService.invalidateByArtefact(...)`).
  - Preserves complete historical artefact and audit records (never deletes revoked consents).

## 7. Expiry Handling Status
- **Status:** `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS`.
- **Implementation:** `AbdmConsentLifecycleService.runExpiryAndStatusSync(...)` + `AbdmConsentSyncLogModel` + `AbdmConsentValidationService`.
- **Guarantees:**
  - Real-time clock check (`now >= dataEraseAt` or `now >= expiresAt`) immediately denies access even before a background sweep runs.
  - Scheduler-safe idempotent sweep marks expired requests (`EXPIRED`) and artefacts (`EXPIRED`), emits `ABDM_CONSENT_NEARING_EXPIRY` / `ABDM_CONSENT_EXPIRED` privacy-safe notifications, invalidates validation caches, and records telemetry in `AbdmConsentSyncLogModel`.

## 8. Consent Validation Status
- **Status:** `IMPLEMENTED_AND_VERIFIED_IN_MOCKED_TESTS`.
- **Implementation:** `AbdmConsentValidationService.validateAbdmConsentAccess(...)` + `ConsentEnforcementService.validateExternalAbdmAccess(...)` bridge.
- **11-Rule Centralized Fail-Closed Decision Engine:**
  1. Preserves legitimate patient self-access (`PATIENT_SELF_ACCESS_ALLOWED`) without breaking internal patient record access.
  2. Requires explicit ABDM consent artefact reference (`NO_ARTEFACT_PROVIDED`).
  3. Rejects missing or unknown artefacts (`ARTEFACT_NOT_FOUND`).
  4. Rejects non-ABDM origins / internal consents (`NON_ABDM_ARTEFACT_ORIGIN`).
  5. Enforces strict `VALIDATION_PASSED` integrity & schema state (`ARTEFACT_VALIDATION_FAILED`).
  6. Enforces `externalStatus === 'GRANTED'` and `revocationStatus === 'NONE'` (`CONSENT_NOT_GRANTED`, `CONSENT_REVOKED`, `CONSENT_REVOCATION_PENDING`).
  7. Enforces real-time `dataEraseAt` / `expiresAt` expiry (`CONSENT_EXPIRED`).
  8. Enforces strict patient ownership match (`PATIENT_MISMATCH`).
  9. Enforces HIU/requester scope binding (`REQUESTER_SCOPE_MISMATCH`).
  10. Enforces requested `hiType` inclusion (`HI_TYPE_OUT_OF_SCOPE`), `purposeCode` match (`PURPOSE_MISMATCH`), and `recordDate` within `[dateRangeFrom, dateRangeTo]` (`DATE_RANGE_OUT_OF_SCOPE`).
  11. Enforces `environment` boundary (`ENVIRONMENT_MISMATCH`) so mock/dev artefacts can never authorize sandbox/production access.
- **Caching:** 60-second TTL decision cache keyed by canonical decision tuple, with instant invalidation on revocation, expiry, or callback updates.

## 9. FHIR Consent Mapping Status
- **Status:** `STRUCTURAL_ADAPTER_IMPLEMENTED_UNVALIDATED_BY_HAPI_CLI`.
- **Implementation:** `AbdmConsentFhirMapper` (`apps/api/src/modules/abdm/mappers/abdm-consent-fhir.mapper.ts`) + extended `FhirR4Validator.validateConsent(...)`.
- **Guarantees:**
  - Maps ABDM Consent Artefacts into HL7 FHIR R4 `Consent` resources (`status`, `scope`, `category`, `patient`, `dateTime`, `organization`, `policyRule`, `provision.period`, `provision.purpose`, `provision.class` for HI types).
  - Preserves `originalExternalConsentId` and `originalPayloadSha256` alongside mapped output.
  - Explicitly surfaces `unmappedFields[]` (e.g., `permission.frequency`, `dataEraseAt` extension nuance, `accessMode`, ABDM gateway signature metadata) and sets `officialIgConformanceClaimed: false`.

## 10. HIP/HIU Architecture Status
- **Status:** `FOUNDATION_IMPLEMENTED_LIVE_EXCHANGE_DISABLED`.
- **Documented in:** `docs/abdm/hip-hiu-consent-workflows.md`.
- **HIU Role Implemented:** Request initiation, status sync, `hiu/notify` & `hiu/on-fetch` callback processing, `hiu/on-notify` ack, immutable artefact storage, validation engine.
- **HIP Role Implemented:** `hip/notify` callback ingestion, artefact storage with `roleContext: 'HIP'`, `hip/on-notify` ack, pre-transfer consent authorization validation.
- **Strict Scope Boundary Enforced:** Live Health Information Exchange (Fidelius Curve25519 ECDH key exchange, `/health-information/cm/request`, `/health-information/transfer`) is **NOT** implemented in Task 03 (`liveExchangeEnabled: false`).

## 11. Sandbox Connectivity Status
- **Status:** `NOT_EXECUTED_PENDING_SANDBOX_ONBOARDING`.
- No live HTTP calls were made to `dev.abdm.gov.in` or ABDM HIE-CM Sandbox because official sandbox credentials (`ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, registered HIP/HIU Facility IDs, and whitelisted callback webhook URL) have not been provisioned.

## 12. Mocked Tests Executed
- **Unit Tests (`apps/api/tests/unit/abdm-consent-manager.test.ts`):** `14` tests executed:
  1. Valid HIU consent request creation in `development` mock mode (verifies `REQUESTED` / `AWAITING_PATIENT_ACTION`, never fake `APPROVED`).
  2. Rejection when patient has no verified ABHA link (`ABDM_PATIENT_ABHA_NOT_VERIFIED`).
  3. Denial of unauthorized roles initiating HIU consent requests.
  4. Verified `hiu/notify` (`GRANTED`) + `hiu/on-fetch` immutable artefact persistence + SHA-256 integrity hash + AES-256-GCM encryption.
  5. Duplicate callback idempotency (second delivery recorded as duplicate without mutating state).
  6. Forged / unknown `consentRequestId` callback rejection (`404 ABDM_UNKNOWN_CONSENT_REQUEST`).
  7. Out-of-order / stale callback timestamp protection & terminal state monotonicity (`REVOKED` cannot revert to `GRANTED`).
  8. 11-rule validation engine: valid access allowed (`ALLOWED`), expired artefact denied (`CONSENT_EXPIRED`), out-of-scope HI type denied (`HI_TYPE_OUT_OF_SCOPE`), out-of-range date denied (`DATE_RANGE_OUT_OF_SCOPE`), wrong patient denied (`PATIENT_MISMATCH`), environment mismatch denied (`ENVIRONMENT_MISMATCH`), internal non-ABDM consent rejected (`NON_ABDM_ARTEFACT_ORIGIN`), and legitimate patient self-access preserved (`PATIENT_SELF_ACCESS_ALLOWED`).
  9. Patient revocation sets `PENDING_CONFIRMATION`, immediately invalidates validation cache, blocks access, and preserves audit history.
  10. Non-owning patient / unauthorized revocation rejected (`403`).
  11. Scheduler-safe expiry & status sync sweep transitions expired requests/artefacts and logs `AbdmConsentSyncLogModel`.
  12. HIP `hip/notify` callback ingestion & validation under `roleContext: 'HIP'`.
  13. FHIR R4 `Consent` mapper produces structurally valid FHIR R4 `Consent`, preserves `originalPayloadSha256`, lists `unmappedFields`, and sets `officialIgConformanceClaimed: false`.
  14. Disabled / production-locked mode fails closed without outbound network calls.
- **Integration Tests (`apps/api/tests/integration/abdm-consent-integration.test.ts`):** `5` HTTP integration test suites executed via Supertest against Express app (with mocked Mongoose persistence):
  1. End-to-end HIU consent request -> webhook `hiu-notify` & `hiu-on-fetch` -> artefact listing -> FHIR R4 projection -> access validation (`ALLOWED`).
  2. Patient revocation via HTTP -> immediate validation denial (`DENIED`) -> audit history inspection.
  3. Cross-patient isolation (`403`) & unauthorized role blocking (`403`).
  4. Webhook replay / authentication enforcement & forged callback rejection.
  5. Admin `/api/v1/abdm/consent/analytics` & `/api/v1/abdm/status` zero-PII aggregate telemetry + `POST /api/v1/abdm/consent/sync/run`.
- **Full Monorepo Regression Suite (`pnpm test`):** `45` test files / `670` tests executed.

## 13. Actual Sandbox Tests Executed
- **`0` actual live ABDM HIE-CM sandbox tests executed** (blocked pending official ABDM Sandbox credentials, HIP/HIU registration, and HTTPS webhook callback whitelisting).

## 14. Tests Passed
- **Day 7 Task 03 Unit & Integration Tests:** `19 / 19` passed (`14` unit + `5` integration).
- **Full Platform Suite (`pnpm test`):** `45 / 45` test files, **`670 / 670` tests passed** (4.43s).
- **`pnpm typecheck`:** `5 / 5` workspace packages passed (`config`, `shared-types`, `validation`, `api`, `web`, 0 errors).
- **`pnpm lint`:** `5 / 5` workspace packages passed (0 errors; 0 warnings in Day 7 code).
- **`pnpm build`:** Passed cleanly (`apps/api` `tsc` 5.2s; `apps/web` `next build` 15.7s, compiling all new `/patient/consent/requests/[id]`, `/patient/consent/artefacts`, and `/admin/integrations/abdm` routes).

## 15. Tests Failed
- **`0` tests failed.**

## 16. Tests Not Executed
- **Live ABDM HIE-CM Sandbox End-to-End Flow:** Not executed (`NOT_EXECUTED_PENDING_SANDBOX_ONBOARDING`).
- **Live ABDM PHR App External Revocation Confirmation:** Not executed (requires PHR App onboarding + live patient `X-AUTH-TOKEN`).
- **External HAPI FHIR CLI Validation against NRCeS `ndhm.in` `package.tgz`:** Not executed (requires Java HAPI FHIR CLI and official NRCeS package).
- **Automated Frontend Component / Browser E2E Tests (Playwright/Cypress):** Not configured in `apps/web/package.json`; frontend verified via `next lint`, `tsc --noEmit`, and `next build`.

## 17. Security Findings
- **Verified Mitigations:**
  - Strict separation of internal HealthBridge consent (`ConsentModel`) and ABDM HIE-CM consent artefacts (`AbdmConsentArtefactModel`); internal records cannot satisfy ABDM validation (`NON_ABDM_ARTEFACT_ORIGIN`).
  - Zero local approval bypass: neither backend endpoints nor patient UI allow locally fabricating external ABDM `APPROVED` / `GRANTED` states.
  - Immutable raw external payloads (`immutable: true`) with SHA-256 digest and AES-256-GCM at-rest encryption (`select: false`).
  - Webhook authentication, ±5-minute replay guard, persistent idempotency, unknown-request anti-forgery check, and monotonic terminal-state protection.
  - Real-time expiry enforcement + immediate cache invalidation on revocation or callback update.
  - Zero patient PII, ABHA numbers, raw payloads, or secrets exposed in Admin analytics, logs, or in-app notifications.
- **Residual Risks (Documented in `docs/abdm/consent-security-and-privacy.md`):**
  - Validation decision cache is currently single-instance in-memory (60s TTL); multi-replica deployments require Redis pub/sub cache invalidation.
  - Upstream ABDM JWS/digital signature cryptographic verification of consent artefact payloads depends on official ABDM Sandbox Gateway public keys / JWK endpoint verification during M2 onboarding.

## 18. Remaining External Dependencies
1. **ABDM Sandbox Onboarding (`sandbox.abdm.gov.in`):** Official `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, and `X-CM-ID=sbx`.
2. **HIP & HIU Bridge Registration:** Registered Facility/Bridge IDs and publicly reachable HTTPS webhook endpoints registered in ABDM Bridge config for `hiu/on-init`, `hiu/on-status`, `hiu/notify`, `hiu/on-fetch`, and `hip/notify`.
3. **ABDM Sandbox PHR Account / App:** Needed to test real patient approval, denial, and external revocation via the official ABDM PHR Sandbox portal.
4. **HAPI FHIR CLI + NRCeS IG Package:** Needed to formally validate generated FHIR R4 `Consent` resources against NRCeS `ndhm.in` profiles.
5. **Day 7 Task 04 (Future Scope):** Live Health Information Exchange (Fidelius Curve25519 ECDH encryption, `/health-information/cm/request`, `/health-information/transfer`, and encrypted bundle decryption).
