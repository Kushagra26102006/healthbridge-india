# Unified Patient Identity Architecture (Day 8 Task 01)

> **Primary Service:** `apps/api/src/modules/platform/services/platform-identity.service.ts`  
> **Endpoint:** `GET /api/v1/platform/patient/identity`

## 1. Authoritative Identity Invariants
1. **Single Internal Primary Key:** `User._id` (where `role: 'PATIENT'`) is the single authoritative internal patient identifier referenced across `PatientProfile.userId`, `Appointment.patientId`, `Encounter.patientId`, `Prescription.patientId`, `DispensingRecord.patientId`, `LaboratoryOrder.patientId`, `LabSample.patientId`, `LaboratoryReport.patientId`, `MedicalRecord.patientId`, `ConsentArtifact.patientId`, `AbhaLink.patientId`, `AbdmConsentArtefact.patientId`, and `AbdmImportedRecord.patientId`.
2. **ABHA Strictly External:** ABHA Number (AES-256-GCM encrypted + HMAC blind-indexed) and ABHA Address live exclusively as external identity associations in `AbhaLinkModel` — ABHA is NEVER used as a MongoDB primary key.
3. **Zero Automatic Demographic Merging:** `PlatformIdentityService.resolveUnifiedPatientIdentity()` checks for matching `name + dateOfBirth` across other `PatientProfile` records and flags `duplicateAccountReview: { flaggedForReview: true, autoMergeAllowed: false }` for authorized human review without ever merging accounts automatically.
4. **Link History Preserved:** `externalAbha.linkHistoryCount` preserves full historical ABHA link/unlink visibility.
