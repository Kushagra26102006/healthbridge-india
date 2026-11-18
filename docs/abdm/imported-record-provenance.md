# ABDM Imported Record Provenance, Clinical Integrity & Quarantine Review

> **Model:** `AbdmImportedRecordModel` (`abdm_imported_records`)  
> **Service:** `apps/api/src/modules/abdm/services/abdm-hiu.service.ts`

## 1. Immutable Provenance Guarantee
Every external clinical record imported via HIU stores immutable provenance (`immutable: true`):
- `sourceParticipantId` & `sourceOrganizationName`
- `consentArtefactId` & `externalConsentId`
- `externalTransactionId`
- `originalIssuedAt` & `importedAt`
- `bundleSha256` integrity digest
- `encryptedFhirBundle` (AES-256-GCM at rest, `select: false`)
- `isAmended` flag distinguishing amended reports from originals
- `readOnly: true` enforced across API & UI (clinicians have zero edit/delete endpoints for external records)

## 2. Deduplication & Clinical Integrity
- Unique compound index `{ patientId, sourceParticipantId, careContextReference, bundleSha256 }` prevents duplicate imports of identical documents.
- Clinical values, units, and reference ranges are extracted verbatim into display summaries without generating synthetic diagnoses or automated interpretations.
- Invalid or incomplete FHIR bundles are **rejected** (`rejectedEntries[]`) and never silently imported.

## 3. Quarantined Review Workflow (`QUARANTINED_REVIEW`)
When an incoming FHIR `Patient` identifier does not unambiguously match the patient's verified ABHA Address or HealthBridge MRN:
- The record is quarantined (`reviewStatus: 'QUARANTINED_REVIEW'`, `patientMatchConfidence: 'DEMOGRAPHIC_REVIEW_REQUIRED'`).
- **Hidden from Doctors:** Doctors NEVER see quarantined or rejected records.
- **Manual Resolution:** Only the owning `PATIENT` or an `ADMIN` can resolve the quarantine (`POST /api/v1/abdm/hie/imported-records/:id/review`) to `APPROVED_AFTER_REVIEW` or `REJECTED` with auditable `reviewNotes`.
