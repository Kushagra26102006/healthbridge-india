# Laboratory State Machines & Transaction Integrity — HealthBridge India (Day 6)

## 1. Overview
This document formally specifies the validated state machines, immutability guarantees, concurrency safeguards, and idempotency rules audited across all 15 laboratory workflow entities.

---

## 2. State Machine Specifications

### 1. `LabOrder`
- **States:** `ORDERED` → `ACCEPTED` | `REJECTED` | `CLARIFICATION_REQUESTED` → `SAMPLE_COLLECTION_PENDING` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED`
- **Guards:** Terminal states (`COMPLETED`, `CANCELLED`, `REJECTED`) cannot be accepted; cross-laboratory acceptance is forbidden (`403`); unrequested test codes cannot be assigned (`400`).

### 2. `LabSample`
- **States:** `COLLECTION_PENDING` → `COLLECTED` → `IN_TRANSIT` → `ACCESSIONED` → `IN_PROCESSING` → `PROCESSED` → `STORED` / `DISPOSED`; or `REJECTED` → `RECOLLECTION_REQUIRED`
- **Guards:** Unique lab-scoped barcode generation; rejected samples block downstream report draft compilation; timeline transitions are append-only (`statusHistory`).

### 3. `TestResult`
- **States:** `DRAFT` → `COMPLETED` → `VERIFIED` → `AMENDED`
- **Guards:** Compound unique index `{ laboratoryId, orderId, testCode }` prevents duplicate active result records per order/test; `enteredById` is preserved for Segregation-of-Duties verification.

### 4. `LabReport` & 5. `LabReportVersion`
- **States:** `DRAFT` → `PENDING_REVIEW` / `UNDER_REVIEW` → `APPROVED` → `PUBLISHED` → (Amendment) → `DRAFT (v+1)` → `APPROVED` → `AMENDED`
- **Guards:**
  - Cannot compile draft without completed `TestResult` or with a `REJECTED` sample.
  - Rejection/correction requires mandatory justification comment (≥5 chars) and reverts to `DRAFT`.
  - Cannot publish unless `APPROVED` (or `AMENDED`) AND QC Release Gate passes (or authorized override is recorded).
  - Duplicate publication on already-`PUBLISHED` version is **idempotent** (returns existing sealed document without duplicating versions).
  - Amendments archive the immutable prior version snapshot (including `contentSnapshot`, `documentHash`, `documentBuffer`, `approvalSnapshot`) in `LabReportVersionModel` before incrementing `currentVersion`.

### 6. `QCRun`
- **States:** `PENDING` → `PASSED` | `FAILED` | `UNDER_INVESTIGATION` | `INVALIDATED`
- **Guards:** Automatic rule evaluation compares observed values against active `QCProfile` bounds (`acceptableMin`/`acceptableMax` or qualitative expectation). `FAILED` runs automatically generate a linked `QualityIncident` and activate the QC Release Safety Gate.

### 7. `QualityIncident`
- **States:** `OPEN` → `UNDER_INVESTIGATION` → `RESOLVED` → `CLOSED`
- **Guards:** Resolution requires root cause / resolution notes; unresolved QC failure incidents block report publication for affected test codes.

### 8. `CAPA` (Corrective & Preventive Actions)
- **States:** `OPEN` → `IN_PROGRESS` → `PENDING_EFFECTIVENESS_REVIEW` → `CLOSED` (or `REOPENED` if effectiveness review fails)
- **Guards:** Effectiveness review records reviewer identity, timestamp, and outcome; closed CAPAs can only reopen via explicit audited `/reopen` transition.

### 9. `LabInstrument` & 10. `InstrumentCalibration`
- **Instrument Operating States:** `ACTIVE` ↔ `IN_MAINTENANCE` | `OUT_OF_SERVICE` → `RETIRED`
- **Calibration States:** `PENDING` → `PASSED` | `FAILED` | `OVERDUE`
- **Guards:** Failed calibration automatically transitions the instrument to `OUT_OF_SERVICE` and blocks the QC Release Gate; overdue calibrations (`calibrationStatus === 'OVERDUE'` or `nextCalibrationDate < now`) also block the QC Release Gate until authorized clearance (`/calibrations/:id/clear`).

### 11. `ReagentLot` & 12. `ReagentInventoryTransaction`
- **Lot States:** `ACTIVE` → `DEPLETED` | `EXPIRED` | `QUARANTINED` | `RECALLED`
- **Transaction Ledger:** Append-only immutable records (`RECEIPT`, `CONSUMPTION`, `ADJUSTMENT`, `DISPOSAL`, `REVERSAL`).
- **Concurrency & Safety Guards:**
  - Clinical `CONSUMPTION` explicitly rejects `QUARANTINED`, `RECALLED`, or `EXPIRED` lots (`400`).
  - Deductions use atomic MongoDB conditional updates (`findOneAndUpdate({ _id, laboratoryId, availableQuantity: { $gte: deductionQty } }, { $inc: { availableQuantity: -deductionQty } })`) preventing double-deduction or negative balances under concurrent requests.
  - Negative `ADJUSTMENT`/`REVERSAL` operations also enforce atomic `{ availableQuantity: { $gte: Math.abs(delta) } }`.

### 13. `LaboratoryInvitation` (`LaboratoryStaffModel`)
- **States:** `INVITED` / `PENDING_ACCEPTANCE` → `ACTIVE` → `SUSPENDED` ↔ `ACTIVE` → `DEACTIVATED`; or `EXPIRED`
- **Guards:** Single-use SHA-256 hashed token cleared (`invitationTokenHash = undefined`) upon acceptance; expired tokens (>7 days) are rejected; primary owner cannot be deactivated.

### 14. `LaboratoryShiftAssignment`
- **States:** `SCHEDULED` → `CONFIRMED` → `SWAP_REQUESTED` → `SWAPPED` | `COMPLETED` | `ABSENT` | `CANCELLED`
- **Guards:** Prevents overlapping shifts (including overnight time windows) and blocks assignment during `APPROVED` leave dates (`400`/`409`).

### 15. `LaboratoryTaskAssignment`
- **States:** `UNASSIGNED` → `ASSIGNED` → `ACCEPTED` → `IN_PROGRESS` ↔ `BLOCKED` → `COMPLETED` | `CANCELLED`
- **Guards:** `BLOCKED` requires mandatory `blockedReason`; reassignments verify assignee role/permission eligibility and append immutable entries to `assignmentHistory`.

---

## 3. Concurrency & Transaction Notes
- **Atomic Conditional Updates:** Used on reagent lot consumption, negative adjustments, and single-use invitation acceptance.
- **Multi-Document Transactions Limitation:** Standalone local MongoDB / mocked Vitest environments do not run replica-set multi-document ACID sessions. Production deployments on **MongoDB Atlas (replica set)** support wrapping multi-collection mutations (e.g., lot deduction + parent reagent `currentStock` update + ledger insert, and report publish + version archive + order `COMPLETED`) inside `mongoose.startSession()` transactions when enabled.
