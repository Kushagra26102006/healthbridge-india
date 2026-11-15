# Laboratory Order Management & Test Assignment

## 1. Overview
The Laboratory Order Management system coordinates incoming physician diagnostic orders (`LaboratoryOrderModel`), order review, acceptance/rejection workflows, clinical clarification queries, test assignment to specialized diagnostic departments/technicians, and catalogue specimen requirement resolution.

## 2. Order Review Workflow
Incoming orders created by physicians originate in `ORDERED` status. Laboratory staff review requested tests, patient demographics, and clinical priority (`ROUTINE`, `URGENT`, `STAT`).

### 2.1 Order Acceptance
- **Endpoint:** `POST /api/v1/laboratory/orders/:id/accept`
- **Payload:** `{ notes?: string }`
- **Behavior:** Transitions order status to `ACCEPTED`. Records an immutable status transition in `statusHistory` with timestamp and actor name. Emits `LAB_ORDER_ACCEPTED` notification.

### 2.2 Order Rejection
- **Endpoint:** `POST /api/v1/laboratory/orders/:id/reject`
- **Mandatory Reason Codes:**
  - `TEST_NOT_AVAILABLE`
  - `INVALID_ORDER`
  - `INSUFFICIENT_INFORMATION`
  - `FACILITY_UNAVAILABLE`
  - `SPECIMEN_REQUIREMENT_UNSUPPORTED`
  - `OTHER`
- **Behavior:** Requires both standard `reasonCode` and descriptive `reason`. Transitions order status to `REJECTED`. Preserves the record in database; never physically deletes the order. Emits `LAB_ORDER_REJECTED` notification.

### 2.3 Clinical Clarification
- **Endpoint:** `POST /api/v1/laboratory/orders/:id/clarification`
- **Payload:** `{ notes: string }`
- **Behavior:** Transitions order status to `CLARIFICATION_REQUESTED`. Does not alter original clinical instructions. Notifies ordering physician.

## 3. Test Assignment
- **Endpoint:** `POST /api/v1/laboratory/orders/:id/assign-tests`
- Allows laboratory supervisors to assign specific ordered tests to internal departments (e.g., Clinical Biochemistry, Hematology & Hemostasis, Microbiology & Serology, Histopathology) and technician personnel.
- Rejects any attempt to assign an unrequested test code with `422 Unprocessable Entity`.
- Assigns priority overrides (`STAT`, `URGENT`) without modifying original clinical notes.

## 4. Catalogue Specimen Resolution
- **Endpoint:** `GET /api/v1/laboratory/orders/:id/specimen-requirements`
- Resolves tests ordered against the laboratory diagnostic catalogue (`LabTestModel`) scoped to `{ laboratoryId }`.
- Returns required container types (e.g., EDTA Lavender Top, Serum Separator Gold Top, Sodium Heparin Green Top), required fasting duration hours, and pre-analytical patient preparation instructions.
