# Laboratory Module Architecture — HealthBridge India (Day 6)

## 1. Architectural Overview
The HealthBridge India Laboratory Information Management System (LIMS) is implemented as a cohesive vertical domain inside the TypeScript monorepo (`pnpm` workspaces), sharing contracts, validation schemas, authentication/RBAC, notification delivery, and immutable audit infrastructure with the Patient, Doctor, and Pharmacy portals.

### Workspace Topology
| Workspace Package | Laboratory Responsibilities |
|---|---|
| `packages/shared-types` | Shared DTOs, status enums, RBAC role & permission constants (`laboratory.types.ts`, `laboratory-quality.types.ts`, `laboratory-workforce.types.ts`, `lab-report.types.ts`, `notification.types.ts`) |
| `packages/validation` | Shared Zod schemas (`laboratory.schema.ts`, `laboratory-qms.schema.ts`, `laboratory-workforce.schema.ts`, `lab-report.schema.ts`) |
| `packages/config` | Unified application prefix (`/api/v1`), constants, and environment configuration contracts |
| `apps/api` | Express REST API, Mongoose models (20+ lab collections), domain services, PDF generator, FHIR R4 DiagnosticReport mapper, Vitest unit & integration suites |
| `apps/web` | Next.js 14 App Router UI (`(dashboard)/laboratory/**`), React hooks, Tailwind CSS / Lucide components, and typed Axios API clients |

---

## 2. Repository Implementation Inventory (Audited)
Every subsystem below was inspected end-to-end across MongoDB models, Express services/controllers/routes, Zod validation, Next.js pages, and automated tests:

| Module | Backend Status | Frontend Status | Test Verification | Audit Notes |
|---|---|---|---|---|
| **A. Laboratory Dashboard & Profile** | Implemented | Implemented | Verified | Live DB KPI counts; strict zero self-approval guard on statutory verification status |
| **B. Diagnostic Test Catalogue** | Implemented | Implemented | Verified | Compound unique `{ laboratoryId, testCode }`, full-text search index, parameter & reference range definitions |
| **C. Order Management** | Implemented | Implemented | Verified | Order queue, review, accept/reject/clarify, test assignment, duplicate & cross-lab guards |
| **D. Sample Collection, Barcodes & Accessioning** | Implemented | Implemented | Verified | Specimen requirements, barcode generation/lookup, accessioning, rejection/recollection, collection centers, timeline |
| **E. Test Processing & Results** | Implemented | Implemented | Verified | Structured numeric/qualitative parameter entry, automated abnormal/critical flag evaluation, unique `{ laboratoryId, orderId, testCode }` |
| **F. Diagnostic Reports, PDFs & FHIR R4** | Implemented | Implemented | Verified | Draft compilation, review/SoD, approval, publication, SHA-256 PDF seal, immutable version ledger, amendment flow, HL7 FHIR R4 Bundle |
| **G. Quality Management (QMS, QC, Incidents, CAPA)** | Implemented | Implemented | Verified | Versioned QC profiles, automated rule evaluation, auto-incident creation, CAPA lifecycle, QC Release Safety Gate & audited overrides |
| **H. Instruments, Calibration & Maintenance** | Implemented | Implemented | Verified | Instrument registry, test mapping, operating statuses (`ACTIVE`, `IN_MAINTENANCE`, `OUT_OF_SERVICE`, `RETIRED`), failed/overdue calibration lockouts |
| **I. Reagent & Consumable Inventory** | Implemented | Implemented | Verified | Catalogue, lot tracking, expiry/FEFO selection, atomic non-negative stock ledger, quarantine/recall consumption blocks |
| **J. Workforce, Lab RBAC, Departments, Shifts & Workload** | Implemented | Implemented | Verified | Multi-user tenancy, SHA-256 single-use invites, 8 lab roles / 38 permissions, SoD, departments, overnight shifts, swap/leave conflict checks, real-time workload board |

---

## 3. Database Model Inventory (20 Laboratory Models + Shared Models)
### Core Laboratory Models (`apps/api/src/modules/laboratory/models/`)
1. `lab-test.model.ts` (`LabTestModel`)
2. `lab-sample.model.ts` (`LabSampleModel`)
3. `collection-center.model.ts` (`CollectionCenterModel`)
4. `test-result.model.ts` (`TestResultModel`)
5. `lab-report-version.model.ts` (`LabReportVersionModel`)
6. `qc-profile.model.ts` (`QCProfileModel`)
7. `qc-run.model.ts` (`QCRunModel`)
8. `quality-incident.model.ts` (`QualityIncidentModel`)
9. `capa.model.ts` (`CAPAModel`)
10. `lab-instrument.model.ts` (`LabInstrumentModel`)
11. `instrument-calibration.model.ts` (`InstrumentCalibrationModel`)
12. `instrument-maintenance.model.ts` (`InstrumentMaintenanceModel`)
13. `test-instrument-mapping.model.ts` (`TestInstrumentMappingModel`)
14. `reagent.model.ts` (`ReagentModel`, `ReagentLotModel`)
15. `reagent-transaction.model.ts` (`ReagentInventoryTransactionModel`)
16. `laboratory-staff.model.ts` (`LaboratoryStaffModel`)
17. `laboratory-department.model.ts` (`LaboratoryDepartmentModel`)
18. `laboratory-shift.model.ts` (`LaboratoryShiftTemplateModel`, `LaboratoryShiftAssignmentModel`)
19. `laboratory-leave.model.ts` (`LaboratoryLeaveRequestModel`, `LaboratoryStaffAvailabilityModel`)
20. `laboratory-task-assignment.model.ts` (`LaboratoryTaskAssignmentModel`)

### Reused Platform Models
- `LaboratoryProfileModel` (`modules/users/models/laboratory-profile.model.ts`)
- `LaboratoryOrderModel` (`modules/healthcare/models/lab-order.model.ts`)
- `LaboratoryReportModel` (`modules/healthcare/models/lab-report.model.ts`)
- `UserModel` (`modules/users/models/user.model.ts`)
- `AuditLogModel` (`modules/security/models/audit-log.model.ts`)
- `NotificationModel` (`modules/notifications/models/notification.model.ts`)

---

## 4. API Endpoint Architecture (`/api/v1/`)
- `/api/v1/laboratory/*` — Laboratory Portal endpoints (`authenticate` + `authorize(['LABORATORY', 'ADMIN'])` + granular `requireLabPermission` on workforce routes; public `/staff/accept-invite` token onboarding).
  - Dashboard & Profile (`/dashboard/*`, `/profile/*`)
  - Test Catalogue (`/tests/*`)
  - Orders & Samples (`/orders/*`, `/samples/*`, `/collection-centers/*`)
  - Clinical Results & Reports (`/reports/*`)
  - QMS, Instruments & Reagents (`/quality/*`, `/inventory/reagents/*`)
  - Workforce, Departments, Scheduling & Workload (`/staff/*`, `/permissions/*`, `/departments/*`, `/scheduling/*`, `/workload/*`)
- `/api/v1/lab-reports/*` — Multi-role authorized report access (`PATIENT`, `DOCTOR`, `ADMIN`, `LABORATORY`) with strict ownership, published-only patient/doctor visibility, PDF delivery (`/pdf` inline, `/download` attachment), version history, and HL7 FHIR R4 bundle (`/fhir`).
- `/api/v1/lab-orders/*` — Patient/Doctor/Admin laboratory order inspection.

---

## 5. PDF Generation & File Storage Architecture
- **Authoritative Server-Side PDF Generation (`ReportPdfService`):** Generates PDF-1.4 buffers directly from persisted MongoDB report and observation records. Frontend-submitted text is never trusted for PDF rendering.
- **Cryptographic Integrity:** Every generated PDF produces a SHA-256 `documentHash`, stored on `LaboratoryReportModel` and in the immutable `LabReportVersionModel` snapshot (along with the binary `documentBuffer`), and returned in the `X-Document-SHA256` response header.
- **Private Access Only:** Every PDF/download request requires JWT authentication and object-level ownership checks (`Cache-Control: private, no-cache, no-store, must-revalidate`).
- **Storage Limitation (Explicit):** Currently, immutable PDF snapshots are persisted in MongoDB (`LabReportVersionModel.documentBuffer`) and regenerated dynamically when needed. External cloud object storage (e.g., AWS S3 / GCS with signed short-lived URLs) is **not configured** in the current repository and is documented in `docs/laboratory-deployment-readiness.md` as a recommended production scale-out step.
