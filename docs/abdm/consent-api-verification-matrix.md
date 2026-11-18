# ABDM Consent Manager API Verification Matrix (Day 7 Task 03)

> **Source of Truth:** Official Ayushman Bharat Digital Mission (ABDM) V3 Milestone 3 (M3) HIE-CM & Gateway specifications (`sandbox.abdm.gov.in` / `abdm.gov.in`) and HL7 FHIR R4 / NRCeS specifications (`nrces.in`).
>
> **Honesty & Status Policy:** Only endpoints, headers, and payload contracts verified against official ABDM V3 documentation are implemented in the client adapter. Unverified or onboarding-gated requirements are explicitly marked `PENDING_SANDBOX_VERIFICATION` or `PENDING_RESEARCH`.

## Official ABDM V3 Consent Specification Matrix

| Workflow | Official specification | Verified API version | Status | Implementation notes |
|---|---|---|---|---|
| Gateway Session Auth | `POST /api/hiecm/gateway/v3/sessions` (`clientId`, `clientSecret`, `grantType: client_credentials`, `REQUEST-ID`, `TIMESTAMP`, `X-CM-ID`) | ABDM Gateway V3 | VERIFIED_FROM_DOCS | Implemented in `AbdmAuthenticationService`; sandbox credentials pending onboarding. |
| HIU Consent Request Initiation | `POST /api/hiecm/consent/v3/request/init` (`Authorization`, `REQUEST-ID`, `TIMESTAMP`, `X-CM-ID`, `X-HIU-ID`; `202 Accepted`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Implemented in `AbdmConsentV3Client.initConsentRequest`; mock returns `REQUESTED` only (never fake `APPROVED`). |
| HIU Consent `on-init` Callback | `POST /api/v3/hiu/consent/request/on-init` (returns `consentRequest.id` mapped via `resp.requestId`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Handled via `POST /api/v1/abdm/webhooks/consent/on-init` and unified `/webhooks/callback`. |
| HIU Consent Status Polling | `POST /api/hiecm/consent/v3/request/status` (`consentRequestId`; `202 Accepted`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Implemented in `AbdmConsentV3Client.fetchConsentRequestStatus` and expiry/status sync service. |
| HIU Consent `on-status` Callback | `POST /api/v3/hiu/consent/request/on-status` (`REQUESTED`, `GRANTED`, `DENIED`, `EXPIRED`, `REVOKED`, `consentArtefacts`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Handled via `POST /api/v1/abdm/webhooks/consent/on-status` with anti-stale-overwrite ordering guard. |
| HIU Consent Notification | `POST /api/v3/hiu/consent/request/notify` (`consentRequestId`, `status`, `consentArtefacts`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Handled via `POST /api/v1/abdm/webhooks/consent/hiu-notify`; rejects unknown `consentRequestId`. |
| HIU Notification Acknowledgement | `POST /api/hiecm/consent/v3/request/hiu/on-notify` (`acknowledgement[]`, `resp.requestId`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Implemented in `AbdmConsentV3Client.acknowledgeConsentNotification(role: 'HIU')`. |
| HIU Consent Artefact Fetch | `POST /api/hiecm/consent/v3/fetch` (`consentId`; `202 Accepted`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Implemented in `AbdmConsentV3Client.fetchConsentArtefact`. |
| HIU Consent `on-fetch` Callback | `POST /api/v3/hiu/consent/on-fetch` (full signed Consent Artefact payload) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Handled via `POST /api/v1/abdm/webhooks/consent/on-fetch`; preserves immutable payload + SHA-256 hash. |
| HIP Consent Notification | `POST /api/v3/consent/request/hip/notify` (and `/api/v3/hip/consent/request/notify`) | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Handled via `POST /api/v1/abdm/webhooks/consent/hip-notify`; validates artefact or updates `REVOKED`/`EXPIRED`. |
| HIP Notification Acknowledgement | `POST /api/hiecm/consent/v3/request/hip/on-notify` | ABDM HIE-CM V3 | VERIFIED_FROM_DOCS | Implemented in `AbdmConsentV3Client.acknowledgeConsentNotification(role: 'HIP')`. |
| Patient Consent Revocation (PHR) | `POST /api/hiecm/gateway/v3/consents/revoke` (`X-AUTH-TOKEN` patient PHR token + `consents[]`) | ABDM HIE-CM V3 (PHR) | VERIFIED_FROM_DOCS / ROLE_GATED | Requires PHR-app role + patient `X-AUTH-TOKEN`. In HIU/HIP mode, HealthBridge marks `PENDING_CONFIRMATION`, blocks local access immediately, and directs patient to official ABDM PHR app. |
| HIE-CM Artefact Digital Signature Verification | Consent Manager asymmetric public key / JWKS verification over `consentDetail` + `signature` | ABDM HIE-CM V3 | PENDING_SANDBOX_VERIFICATION | Live sandbox CM JWKS/certificate endpoint & canonical signing format require sandbox onboarding; sandbox/prod fails closed (`SIGNATURE_UNVERIFIED`) until configured. |
| Gateway Inbound Callback Asymmetric JWT Auth | ABDM Gateway-signed Bearer JWT validation on inbound bridge callbacks | ABDM Gateway V3 | PENDING_SANDBOX_VERIFICATION | Currently protected by HMAC-SHA256 signature / constant-time webhook secret + ±5m replay guard; Gateway JWKS verifier plugs into `AbdmWebhookService.verifyCallbackAuthentication` upon bridge onboarding. |
| Live Health Information Exchange (Fidelius ECDH) | `/api/hiecm/data-flow/v3/health-information/request` + Curve25519/AES-GCM | ABDM M3 Data Flow V3 | OUT_OF_SCOPE_TASK_03 | Explicitly deferred from Day 7 Task 03 (`liveExchangeEnabled: false`). |

## Verified Official Vocabularies

- **Purpose Codes (`purpose.code`):** `CAREMGT`, `BTG`, `PUBHLTH`, `HPAYMT`, `DSRCH`, `PATRQT`
- **Health Information Types (`hiTypes`):** `DiagnosticReport`, `Prescription`, `OPConsultation`, `DischargeSummary`, `ImmunizationRecord`, `HealthDocumentRecord`, `WellnessRecord`
- **Permission Access Modes (`permission.accessMode`):** `VIEW`, `STORE`, `QUERY`, `STREAM`
- **Frequency Units (`permission.frequency.unit`):** `HOUR`, `DAY`, `WEEK`, `MONTH`, `YEAR`
- **External Consent Statuses:** `REQUESTED`, `GRANTED`, `DENIED`, `EXPIRED`, `REVOKED`
