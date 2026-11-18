# ABDM Consent Manager Integration Architecture (Day 7 Task 03)

## 1. Architectural Separation of Four Distinct Concepts

HealthBridge India strictly separates four distinct consent and authorization concepts that are **never** collapsed into one status field:

1. **Internal HealthBridge Platform Consent** (`ConsentRequestModel`, `ConsentArtifactModel` in `apps/api/src/modules/consent/`)
   - Governs intra-platform access between HealthBridge patients and HealthBridge doctors/facilities.
   - Tagged `origin: 'INTERNAL_HEALTHBRIDGE'` whenever adapted.
   - **Invariant:** Can NEVER be misrepresented as an ABDM HIE-CM Consent Artefact.
2. **ABDM Consent Request** (`AbdmConsentRequestModel` in `apps/api/src/modules/abdm/models/abdm-consent-request.model.ts`)
   - Tracks outbound HIU consent requests submitted to ABDM HIE-CM V3.
   - Maintains **separate** `internalStatus` (`DRAFT | PENDING_SUBMISSION | SUBMITTED | AWAITING_PATIENT_ACTION | APPROVED | REJECTED | EXPIRED | REVOKED | FAILED | CANCELLED`) and `externalStatus` (`REQUESTED | GRANTED | DENIED | EXPIRED | REVOKED | UNKNOWN`).
3. **ABDM Signed Consent Artefact** (`AbdmConsentArtefactModel` in `apps/api/src/modules/abdm/models/abdm-consent-artefact.model.ts`)
   - Immutable storage of externally issued HIE-CM artefacts (`originalExternalPayload` + canonical `payloadSha256` + AES-256-GCM encrypted sensitive snapshot + append-only `statusHistory`).
   - Independently tracks `externalStatus`, `validationStatus`, `revocationStatus`, `signatureVerified`, and `externalConfirmationReceived`.
4. **Health Information Access Authorization** (`AbdmConsentValidationService.validateAbdmConsentAccess`)
   - Centralized runtime policy engine returning `ALLOWED | DENIED | REQUIRES_REVALIDATION | PENDING_EXTERNAL_CONFIRMATION` with machine-readable reason codes and fail-closed defaults.
   - Explicitly preserves legitimate patient self-access to own HealthBridge records even when zero ABDM consent artefacts exist.

## 2. Database Models & Indexing

All 4 new models live in `apps/api/src/modules/abdm/models/` and are registered in `apps/api/src/database/models.ts`:

- **`AbdmConsentRequest`** (`abdmConsentRequests`): Unique `internalReference`, unique sparse `externalRequestId`, indexed on `patientId`, `internalStatus`, `externalStatus`, `expiresAt`, `dataEraseAt`, `correlationId`, `externalTransactionRef`, `environment`.
- **`AbdmConsentArtefact`** (`abdmConsentArtefacts`): Unique `internalReference`, unique `externalConsentId`, immutable `origin` / `originalExternalPayload` / `payloadSha256`, `select: false` AES-256-GCM `encryptedSensitivePayload`, indexed on `patientId`, `hiuId`, `externalStatus`, `validationStatus`, `revocationStatus`, `expiresAt`, `dataEraseAt`, `environment`.
- **`AbdmConsentEvent`** (`abdmConsentEvents`): Append-only lifecycle & callback ledger with unique compound `{ eventId, eventType }` idempotency index, plus indexes on `consentRequestId`, `externalRequestId`, `externalConsentId`, `patientId`, `correlationId`, `eventTimestamp`.
- **`AbdmConsentSyncLog`** (`abdmConsentSyncLogs`): Operational synchronization telemetry indexed on `syncType`, `status`, `environment`, `startedAt`, `completedAt`.

## 3. Component Flow

```
Authorized HIU Actor (Doctor/Lab/Pharmacy/Admin)
  └─ POST /api/v1/abdm/consent/requests
       └─ AbdmConsentLifecycleService.initiateConsentRequest()
            ├─ Verify Actor RBAC & Patient's Active Verified AbhaLink
            ├─ Persist AbdmConsentRequest (PENDING_SUBMISSION -> AWAITING_PATIENT_ACTION)
            └─ AbdmConsentV3Client.initConsentRequest() [POST /api/hiecm/consent/v3/request/init]
                 └─ Patient approves/rejects in official ABDM PHR App
                      └─ ABDM Gateway Callback -> POST /api/v1/abdm/webhooks/consent/:callbackType
                           └─ AbdmWebhookService (Auth + ±5m Replay + Idempotency)
                                └─ AbdmConsentLifecycleService.processConsentCallback()
                                     ├─ Monotonic + Event-Timestamp Guard (anti-stale-overwrite)
                                     ├─ Immutable AbdmConsentArtefact validation & storage
                                     ├─ Authorization Cache Invalidation (on REVOKED / EXPIRED)
                                     └─ Privacy-Safe Notification + Immutable AuditLog
```
