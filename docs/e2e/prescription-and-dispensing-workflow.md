# HealthBridge India — Prescription Issuance & Pharmacy Dispensing E2E Flow (Day 8 Task 05)

## Workflow Diagram

```mermaid
flowchart LR
    A[Doctor Drafts Prescription<br/>POST /doctors/prescriptions] --> B{Issued?}
    B -- Draft Only --> C[Dispensing Blocked<br/>Never Visible to Pharmacy]
    B -- POST /:id/issue --> D[Status ACTIVE + Outbox PRESCRIPTION_ISSUED]
    D --> E[Patient Views Rx<br/>+ Authorized Pharmacy Verifies]
    E --> F[Pharmacy Selects Matching Batch<br/>Expiry & Stock Check]
    F --> G[POST /pharmacy/dispensing<br/>Atomic Stock Deduction + IdempotencyKey]
    G --> H[Immutable DispensingRecord<br/>+ Outbox DISPENSING_COMPLETED]
    H --> I[Idempotent Rx Status Sync<br/>+ Privacy-Safe Patient Alert]
```

## Verified Integrity Controls
- Pharmacy accounts CANNOT modify clinical prescriptions issued by doctors.
- Draft and cancelled prescriptions cannot be dispensed (`400 Bad Request`).
- Unauthorized medicine substitution is blocked; batch expiry and stock availability are validated before deduction.
- Stock deduction occurs atomically once inside `PharmacyService.dispensePrescription()` with `idempotencyKey` protection; duplicate `DISPENSING_COMPLETED` events NEVER re-deduct stock.
- Partial dispensing accurately tracks remaining outstanding quantities.
