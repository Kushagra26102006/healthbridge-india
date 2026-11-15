# Laboratory Sample Collection & Barcode Generation

## 1. Overview
The sample collection workflow bridges the clinical requisition with physical laboratory processing. It enforces multi-specimen handling, pre-analytical validation, unique human-readable references, and privacy-preserving barcode identifiers.

## 2. Multi-Specimen Architecture
Diagnostic orders frequently encompass tests across distinct specimen matrices (e.g., Blood, Serum, Plasma, Urine). HealthBridge enables independent sample tube registration for a single order:
- Distinct `LabSample` records are created per container/specimen matrix.
- Each sample links back to the parent `orderId`.
- Prevents contamination and cross-discipline handling conflicts.

## 3. Unique Reference & Barcode Generation
When a sample is registered via `POST /api/v1/laboratory/samples/collect`:
1. **Human-Readable Sample Number:** `SMP-YYYYMMDD-XXXX` (e.g. `SMP-20261115-0001`), generated with scoped sequence numbers for clear operational reporting.
2. **Opaque Barcode Token:** `BC128-SMP-YYYYMMDD-XXXXX` (e.g. `BC128-SMP-20261115-98214`), indexed uniquely across the database.

## 4. Privacy-Preserving Label Safeguards
In accordance with ABDM patient privacy standards and NABL pre-analytical guidelines:
- Physical barcode tags must strictly exclude clinical diagnoses, medical history, and prescription notes.
- Only minimal operational data is printed:
  - Barcode & Human-Readable Sample Reference.
  - Minimal Patient Identifier (`PT-XXXX` or initials).
  - Specimen Type (e.g., `BLOOD`, `URINE`).
  - Collection Timestamp.
  - Laboratory Brand & NABL Accreditation mark.
- Accessing the printable label endpoint (`GET /api/v1/laboratory/samples/:id/label`) returns only this sanitized payload.
