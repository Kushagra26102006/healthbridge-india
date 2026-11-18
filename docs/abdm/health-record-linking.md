# ABDM Patient Health Record (Care Context) Linking

> **Primary Service:** `apps/api/src/modules/abdm/services/abdm-health-record-linking.service.ts`  
> **Model:** `AbdmLinkedHealthRecordModel` (`abdm_linked_health_records`)

## 1. Strict Conceptual Separation
HealthBridge India enforces four distinct database and authorization boundaries:
1. **ABHA Identity Linking (`AbhaLinkModel`):** Proves ownership of an ABHA Number / ABHA Address. Does **not** link hospital records.
2. **Health-Record Care-Context Linking (`AbdmLinkedHealthRecordModel`):** Associates a specific facility care context (`careContextReference`) with the verified ABHA profile. Does **not** grant consent to read clinical bundles.
3. **Consent Authorization (`AbdmConsentArtefactModel`):** Explicit patient-approved ABDM HIE-CM permission with purpose, HI types, date range, and `dataEraseAt`.
4. **Health Information Retrieval (`AbdmHealthInformationTransferModel`):** Encrypted transfer executed strictly after consent validation.

## 2. Supported ABDM V3 Modes
- **`USER_INITIATED`:** Mirrors `/api/v3/hip/link/care-context/init` -> OTP verification (`OTP_VERIFICATION_PENDING`) -> `/api/v3/hip/link/care-context/confirm` (`LINKED`).
- **`HIP_INITIATED`:** Mirrors `/api/hiecm/v3/token/generate-token` + `/api/hiecm/v3/link/carecontext` (`LINKING_PENDING` -> `LINKED`).

## 3. Duplicate Prevention & Local Unlinking
- A unique partial index on `{ patientId, participantId, careContextReference }` across active statuses (`LINKING_PENDING | OTP_VERIFICATION_PENDING | LINKED`) prevents duplicate active links (`409 ABDM_DUPLICATE_RESOURCE`).
- Because ABDM V3 does not expose a universal HIU-side remote unlinking API, `POST /api/v1/abdm/hie/linking/:id/unlink` explicitly records `status: 'UNLINKED_LOCALLY'` and `unlinkScope: 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY'` while preserving full audit history.
