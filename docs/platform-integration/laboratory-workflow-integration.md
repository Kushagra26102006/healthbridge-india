# Doctor-to-Laboratory Order & Report Integration (Day 8 Task 01)

> **Services:** `DoctorLabOrderService`, `LaboratoryService`, `LabReportService`, `LabReportWorkflowService`  
> **Endpoints:** `POST /api/v1/lab-orders` (new Doctor bridge), `GET /api/v1/lab-orders`, `/api/v1/laboratory/*`

## 1. End-to-End Integration Flow
1. Authorized `DOCTOR` creates a lab order via `POST /api/v1/lab-orders` (`createDoctorLabOrderSchema`), referencing authoritative `patientId`, optional `encounterId` (ownership verified), optional `laboratoryId` (verified active `LABORATORY` user), `priority`, `idempotencyKey`, and `tests[]`.
2. `DoctorLabOrderService` enforces fail-closed doctor-patient clinical relationship or active consent, prevents duplicate orders via `idempotencyKey`, creates `LaboratoryOrderModel` (`status: 'ORDERED'`, `encounterId` linked), and emits `LAB_ORDER_CREATED` privacy-safe notifications to Patient and target Laboratory.
3. Laboratory accepts/assigns order -> collects & accessions barcoded `LabSample` -> processes test & checks QC release gates -> reviews, approves & publishes `LaboratoryReport` (immutable versions & amendments).
4. **Patient & Doctor Visibility:** Only `PUBLISHED` and `AMENDED` reports appear in `/patients/dashboard-summary`, `/patient/health-timeline`, and `/doctor/patients/[patientId]/overview` (strictly read-only for doctors).
