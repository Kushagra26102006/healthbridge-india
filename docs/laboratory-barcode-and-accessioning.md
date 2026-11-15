# Laboratory Barcode Scanning & Specimen Accessioning

## 1. Overview
Sample accessioning is the critical security and quality gate where physical specimens enter official laboratory custody. It verifies sample identity, checks physical container integrity, evaluates pre-analytical adequacy, and transitions the status to `ACCESSIONED`.

## 2. Barcode Scanning Station
- **Endpoint:** `GET /api/v1/laboratory/samples/barcode/:barcode`
- Scanners (USB/Bluetooth wedge) transmit the scanned string directly to the auto-focused scan input.
- Validates that the sample belongs to the authenticated laboratory (`{ laboratoryId }`).
- Rejects access attempts by unauthorized laboratories with `404 Not Found` or `403 Forbidden`.

## 3. Pre-Analytical Inspection & Checklist
Prior to accessioning, laboratory staff perform pre-analytical verification:
- Container integrity: intact seal, no cracks or leakage.
- Volume adequacy: sufficient volume for analytical repeat runs.
- Temperature & transit stability: adherence to cold chain requirements.

## 4. Accessioning Confirmation
- **Endpoint:** `POST /api/v1/laboratory/samples/accession`
- **Payload:** `{ barcode: string, receivedAt?: string, notes?: string }`
- **Behavior:**
  - Transitions sample status to `ACCESSIONED`.
  - Stamps `receivedAt`, `receivedById`, `accessionedAt`, and `accessionedById`.
  - Records an immutable event in the sample audit timeline.
  - Automatically updates the parent order's status to `SAMPLE_COLLECTED` if all required specimens are accessioned.

## 5. Controlled Sample Rejection
If a specimen fails pre-analytical inspection:
- **Endpoint:** `POST /api/v1/laboratory/samples/:id/reject`
- **Statutory Reason Codes:**
  - `UNLABELLED_SAMPLE`
  - `INCORRECT_SPECIMEN`
  - `INSUFFICIENT_QUANTITY`
  - `DAMAGED_CONTAINER`
  - `LEAKAGE`
  - `EXPIRED_STABILITY_WINDOW`
  - `DUPLICATE_SAMPLE`
  - `TRANSPORT_CONDITION_FAILURE`
  - `OTHER`
- **Behavior:**
  - Transitions status to `REJECTED`.
  - Rejection records are permanently retained in the audit ledger (never deleted).
  - Optional `requestRecollection: true` triggers notifications to the collection center and ordering provider for immediate patient recollection.
