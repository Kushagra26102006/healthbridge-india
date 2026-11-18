# ABDM Consent Artefact Management (Day 7 Task 03)

## 1. Immutable External Artefact Storage

Implemented in `AbdmConsentArtefactModel` (`apps/api/src/modules/abdm/models/abdm-consent-artefact.model.ts`) and `AbdmConsentLifecycleService.validateAndStoreExternalArtefact`:

- **Original Payload Preservation:** The exact JSON object delivered by ABDM HIE-CM is frozen and stored in `originalExternalPayload` (`immutable: true` in Mongoose schema) alongside a deterministic SHA-256 hash (`payloadSha256`, `immutable: true`). Subsequent status syncs update only operational status fields and append to `statusHistory` — the original external artefact is **never silently altered**.
- **Encryption at Rest:** Sensitive artefact metadata (`patientAbha`, `signature`, `careContexts`) is additionally stored in `encryptedSensitivePayload` (`select: false`) using AES-256-GCM (`encryptSensitivePayloadForStorage` in `apps/api/src/modules/abdm/utils/abha-crypto.util.ts`).
- **History Preservation:** Every status transition appends an immutable entry to `statusHistory` (`fromExternalStatus`, `toExternalStatus`, `validationStatus`, `revocationStatus`, `reason`, `changedAt`, `correlationId`). Artefact history is never deleted upon revocation or expiry.

## 2. Artefact Validation Checks

Every incoming artefact (from `consent/on-fetch`, `consent/hip/notify`, or `consent/hiu/notify`) undergoes strict validation:

1. **Schema Validation:** Validated against `externalAbdmArtefactPayloadSchema` (Zod) verifying `consentId`, `createdAt`, `status`, `consentDetail.purpose`, `consentDetail.patient.id`, `consentDetail.hiu.id`, `hiTypes`, `permission.accessMode`, `permission.dateRange`, and `permission.dataEraseAt`.
2. **Patient Identity Match:** Resolves `consentDetail.patient.id` against `AbhaLinkModel` (`linkStatus: 'LINKED'`, `verificationStatus: 'VERIFIED'`). Unknown or unlinked patient references are rejected (`ABDM_CONSENT_INVALID`).
3. **Expiry & Revocation Evaluation:** Checks `status === 'REVOKED'`, `status === 'EXPIRED'`, and `dataEraseAt <= now`.
4. **Signature Verification Honesty:**
   - In `development` mock mode: verifies synthetic mock signature prefix (`MOCK-CM-SIG-`) and explicitly tags `isMocked: true`.
   - In `sandbox` / `production`: marks `signatureVerified: false` and `validationStatus: 'SIGNATURE_UNVERIFIED'` until official HIE-CM public key / JWKS verification is provisioned during live sandbox onboarding — ensuring external authorization fails closed.

## 3. Patient Artefact Access Controls

- `GET /api/v1/abdm/consent/artefacts` and `GET /api/v1/abdm/consent/artefacts/:id` derive the acting patient strictly from the verified JWT session (`req.user.userId`) and reject cross-patient access with HTTP `403`.
