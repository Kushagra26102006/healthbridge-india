# Patient Identity Linking Architecture

## 1. Identity Separation Invariant

- **Internal Patient Primary Key:** `User._id` / `PatientProfile.userId` (MongoDB ObjectId).
- **External ABDM Identity Association:** Persisted in `AbhaLinkModel` (`apps/api/src/modules/abdm/models/abha-link.model.ts`).
- An ABHA Number or ABHA Address **never replaces** the internal HealthBridge patient primary key.
- `PatientProfileModel` retains only the lightweight `abhaLinkageStatus` summary flag (`NOT_LINKED` / `LINKED`) and avoids duplicating plaintext sensitive ABHA numbers.

## 2. Database Schema & Partial Unique Indexes (`AbhaLinkModel`)

| Index Name | Fields | Partial Filter | Purpose |
|---|---|---|---|
| `uniq_active_abha_link_per_patient` | `{ patientId: 1 }` | `{ linkStatus: 'ACTIVE' }` | At most one active ABHA identity per patient while allowing preserved historical links |
| `uniq_active_abha_number_hash` | `{ abhaNumberHash: 1 }` | `{ linkStatus: 'ACTIVE', abhaNumberHash: { $exists: true, $type: 'string' } }` | Prevents linking the same 14-digit ABHA number to multiple patients simultaneously |
| `uniq_active_abha_address` | `{ abhaAddress: 1 }` | `{ linkStatus: 'ACTIVE', abhaAddress: { $exists: true, $type: 'string' } }` | Prevents linking the same ABHA address to multiple patients simultaneously |

## 3. Anti-Auto-Linking & Duplicate Safeguards

- **No Demographic Auto-Linking:** HealthBridge never matches or merges two patient accounts based on name, gender, or date of birth alone.
- **Demographic Discrepancy Review:** When external verified ABHA demographics differ from `PatientProfile`, `AbhaIdentityService` flags `demographicReviewRequired: true` with specific `demographicMismatchReasons` so the patient or authorized reviewer can inspect before confirming.
- **Anti-Enumeration Duplicate Blocking:** If an ABHA Number or ABHA Address is already linked to another active patient, linking fails with `409 ABDM_DUPLICATE_IDENTITY` without revealing any details about the other account.

## 4. Explicit Consent Boundary & Local Unlinking

- Every `AbhaLink` record is tagged `consentScope: 'IDENTITY_LINKING_ONLY'`.
- Linking requires `patientConsentConfirmed: true` and `purposeAcknowledged: true`.
- Linking does **not** grant medical-record exchange permission; all clinical exchanges must pass `AbdmConsentAdapter` with a signed HIE-CM Consent Artefact.
- **Local Unlinking (`POST /api/v1/abdm/abha/unlink`):** Strictly restricted to the authenticated owning patient (`actorId === patientId`), requires a reason and explicit confirmation, marks the link `linkStatus: 'UNLINKED'` and `verificationStatus: 'REVOKED_OR_UNLINKED'`, preserves link history with `unlinkMetadata`, clears server-side `X-Token`, and does **not** deactivate the citizen's national ABHA account at NHA.
