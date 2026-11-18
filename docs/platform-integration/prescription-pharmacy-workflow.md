# Encounter-to-Prescription & Prescription-to-Pharmacy Workflow (Day 8 Task 01)

> **Services:** `DoctorPrescriptionService`, `PharmacyService`, `OrderFulfillmentService`, `DoctorWorkspaceService`  
> **Models:** `EncounterModel`, `PrescriptionModel`, `DispensingRecordModel`, `PharmacyInventoryModel`, `PharmacyOrderModel`

## 1. End-to-End Integrity Controls
- **Encounter Linkage:** Issued prescriptions reference `encounterId`, `doctorId`, and `patientId`, and link back into `Encounter.linkedPrescriptionIds`.
- **Draft Isolation:** Draft (`isDraft: true`, `status: 'DRAFT'`) and cancelled prescriptions are strictly excluded from patient dashboards (`/patients/dashboard-summary`), patient timelines (`/platform/patient/timeline`), doctor unified overviews, and pharmacy dispensing eligibility checks.
- **Pharmacy Fulfillment:** Existing `PharmacyService` & `OrderFulfillmentService` enforce prescription authenticity, medicine matching (no unauthorized automatic substitution), FEFO batch/expiry checks, atomic inventory deduction, partial & full dispensing, duplicate dispensing prevention (`idempotencyKey`), and immutable `DispensingRecordModel` history.
- **Cross-Module Visibility:** Doctors view read-only pharmacy dispensing status (`NOT_DISPENSED | PARTIALLY_DISPENSED | FULLY_DISPENSED`, dispensing pharmacy name, timestamp) in `/doctor/patients/[patientId]/overview`, and patients view live dispensing updates on `/patient/dashboard` and `/patient/health-timeline`.
