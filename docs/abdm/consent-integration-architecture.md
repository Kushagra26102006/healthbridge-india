# ABDM Consent Integration Architecture — HealthBridge India

## 1. Core Architectural Invariant
An internal HealthBridge India consent record (`ConsentArtifactModel` in `apps/api/src/modules/consent/models/consent-artifact.model.ts`) **MUST NEVER** be treated as an official ABDM HIE-CM Consent Artefact.
- Internal consent governs access between users inside the HealthBridge India platform (e.g., Patient granting a HealthBridge Doctor read access).
- An **ABDM HIE-CM Consent Artefact** is an externally signed, machine-readable contract issued by India's Health Information Exchange & Consent Manager after the citizen approves the request in their PHR/ABHA app.

## 2. Internal-to-ABDM Consent Lifecycle Mapping
| Lifecycle Stage | Internal HealthBridge Module (`modules/consent/`) | Official ABDM HIE-CM Framework | Adapter Boundary (`abdm-consent.adapter.ts`) |
|---|---|---|---|
| **Consent Request** | `ConsentRequestModel` | HIU `POST /consent-requests/init` → async `on-init` | Separate ABDM request correlation via `AbdmCorrelationService` |
| **Patient Authorization** | Patient approves inside HealthBridge portal | Citizen approves inside official PHR / ABHA app | **Never faked internally**; waits for HIE-CM `on-notify` callback |
| **Consent Artefact** | `ConsentArtifactModel` (`origin: INTERNAL_HEALTHBRIDGE`) | Signed HIE-CM artefact (`origin: ABDM_HIE_CM`, `signatureVerified: true`) | `AbdmConsentAdapter.evaluateConsentAccess({ requireAbdmOrigin: true })` rejects internal records (`INTERNAL_CONSENT_NOT_ABDM_ARTEFACT`) |
| **Data Categories & Purpose** | `permittedDataTypes`, `purpose` | `hiTypes` (`DiagnosticReport`, `Prescription`, `OPConsultation`, etc.) + `purposeCode` (`CAREMGT`, `BTG`, `PATRQT`, etc.) | Explicitly checked on every access evaluation |
| **Date Range & Expiry** | `validityPeriod.from` / `.to` | `dateRange.from` / `.to` + `dataEraseAt` | Rejects expired artefacts (`CONSENT_EXPIRED`) and records outside `dateRange` (`DATE_OUT_OF_RANGE`) |
| **Revocation** | `consentStatus = 'REVOKED'` | HIE-CM revocation notification callback | Rejects revoked artefacts immediately (`CONSENT_REVOKED`) |
| **Audit Trail** | `AuditLogModel` | Immutable consent notification + data access log | Every evaluation and callback is logged without leaking clinical PHI |
