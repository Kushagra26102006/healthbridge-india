# ABDM Consent Validation & Access Enforcement (Day 7 Task 03)

## 1. Centralized Validation Interface

Implemented in `apps/api/src/modules/abdm/services/abdm-consent-validation.service.ts`:

```ts
validateAbdmConsentAccess(input: AbdmConsentAccessValidationInput): Promise<AbdmConsentValidationResultDto>
```

Returns a structured decision:
- **`ALLOWED`** — All authorization checks passed (or legitimate patient self-access).
- **`DENIED`** — Hard policy/scope/ownership/expiry/revocation/signature violation.
- **`REQUIRES_REVALIDATION`** — Synchronization age exceeds policy staleness threshold (`maxSyncStalenessMs`).
- **`PENDING_EXTERNAL_CONFIRMATION`** — Official external ABDM HIE-CM confirmation has not yet been received (`requireExternalConfirmation: true`).

Every result includes a machine-readable `reasonCode` (`AUTHORIZED`, `PATIENT_SELF_ACCESS_ALLOWED`, `CONSENT_NOT_FOUND`, `PATIENT_OWNERSHIP_MISMATCH`, `INTERNAL_CONSENT_NOT_ABDM_ARTEFACT`, `EXTERNAL_CONFIRMATION_REQUIRED`, `SIGNATURE_UNVERIFIED`, `ARTEFACT_SCHEMA_INVALID`, `CONSENT_EXPIRED`, `DATA_ERASE_DEADLINE_PASSED`, `CONSENT_REVOKED`, `REVOCATION_PENDING_CONFIRMATION`, `CONSENT_NOT_GRANTED`, `PARTICIPANT_UNAUTHORIZED`, `PURPOSE_MISMATCH`, `HI_TYPE_OUT_OF_SCOPE`, `DATE_RANGE_OUT_OF_SCOPE`, `STALE_SYNC_REQUIRES_REVALIDATION`).

## 2. Eleven Mandatory Validation Checks

1. Consent artefact exists.
2. Origin equals `ABDM_HIE_CM` (internal HealthBridge consents are rejected for ABDM exchange).
3. Patient ownership matches (`artefact.patientId === input.patientId`).
4. Consent is not revoked (`externalStatus !== 'REVOKED'`, `revocationStatus !== 'CONFIRMED_REVOKED'`, and safe fail-closed denial on `revocationStatus === 'PENDING_CONFIRMATION'`).
5. External confirmation received and signature verified where required (`requireExternalConfirmation !== false`).
6. Artefact schema validation passed (`validationStatus !== 'INVALID_SCHEMA'`).
7. Consent is not expired (`expiresAt > now` and `dataEraseAt > now`).
8. External status is `GRANTED`.
9. Sync staleness within configured policy threshold (otherwise `REQUIRES_REVALIDATION`).
10. Requesting participant ID matches authorized `hiuId` / `hipId`.
11. Purpose code, HI-type category, and clinical record date range all fall within approved scope.

## 3. Preserving Legitimate Patient Self-Access

- **Critical Privacy & Usability Invariant:** A patient accessing their own records in HealthBridge (`actorId === patientId`, `actorRole === 'PATIENT'`) is NEVER blocked merely because no external ABDM consent artefact exists.
- `validateAbdmConsentAccess` returns `ALLOWED` (`PATIENT_SELF_ACCESS_ALLOWED`, `origin: 'INTERNAL_HEALTHBRIDGE'`) for patient self-access when `allowPatientSelfAccess !== false`.
- `ConsentEnforcementService` (`apps/api/src/modules/consent/services/consent-enforcement.service.ts`) preserves 100% of existing internal platform consent rules while exposing `validateExternalAbdmAccess(...)` for external ABDM HIE-CM access paths and future FHIR exchange workflows.

## 4. Authorization Cache & Immediate Invalidation

- Positive (`ALLOWED`) DB-backed decisions are cached for 60 seconds in memory.
- Any revocation initiation, confirmed `REVOKED` callback, or `EXPIRED` transition immediately calls `abdmConsentValidationService.invalidateByArtefact(...)`, guaranteeing zero stale positive decisions after revocation or expiry.
