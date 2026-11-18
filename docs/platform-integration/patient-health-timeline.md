# Unified Patient Health Record Timeline (Day 8 Task 01)

> **Backend Service:** `apps/api/src/modules/platform/services/patient-timeline.service.ts`  
> **Endpoint:** `GET /api/v1/platform/patient/timeline`  
> **Frontend Page:** `/patient/health-timeline` (`apps/web/src/app/(dashboard)/patient/health-timeline/page.tsx`)

## 1. Chronological Aggregation & Strict Clinical Publishing Rules
Aggregates real database records across 9 source modules (`PATIENT`, `APPOINTMENTS`, `ENCOUNTERS`, `PRESCRIPTIONS`, `PHARMACY`, `LABORATORY`, `RECORDS`, `CONSENT`, `ABDM`) into 16 typed timeline event types sorted chronologically (`UTC` ISO-8601, newest first).

- **Draft / Unpublished Data Strictly Excluded:**
  - `EncounterModel`: Only `isDraft: false` and `status ∈ ['COMPLETED', 'FINALIZED']`.
  - `PrescriptionModel`: Only `isDraft: false` and `status !== 'DRAFT'`.
  - `LaboratoryReportModel`: Only `status ∈ ['PUBLISHED', 'AMENDED']`.
  - `AbdmImportedRecordModel`: Only `reviewStatus ∈ ['IMPORTED_VERIFIED', 'APPROVED_AFTER_REVIEW']`.
- **Capabilities:** Server-side pagination (`page`, `limit`), `eventType` filter, `sourceModule` filter, `fromDate`/`toDate` range filter, text `search`, strict JWT patient ownership (`req.user.userId`), and provenance badges (`INTERNAL_HEALTHBRIDGE` vs `ABDM_EXTERNAL_IMPORT`, `isMocked`, `isAmended`).
