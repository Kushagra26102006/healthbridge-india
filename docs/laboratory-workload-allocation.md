# Laboratory Workload Allocation & Operations Dashboard — HealthBridge India

## 1. Overview
The Laboratory Workload Allocation Engine coordinates operational tasks across sample collection, accessioning, test processing, quality control runs, report review, medical approval, instrument maintenance, inventory activities, quality incidents, and CAPA actions. All dashboard KPIs aggregate real-time persisted MongoDB records without mock or placeholder numbers.

## 2. Data Model (`LaboratoryTaskAssignmentModel`)
Defined in `apps/api/src/modules/laboratory/models/laboratory-task-assignment.model.ts`:
- `assignmentNumber`: Unique lab-scoped identifier (`LAB-TASK-XXXXXX`).
- `taskType`:
  - `SAMPLE_COLLECTION`
  - `SAMPLE_ACCESSIONING`
  - `TEST_PROCESSING`
  - `QC_RUN`
  - `REPORT_REVIEW`
  - `REPORT_APPROVAL`
  - `INSTRUMENT_MAINTENANCE`
  - `INVENTORY_ACTIVITY`
  - `QUALITY_INCIDENT`
  - `CAPA_ACTION`
- `status`: `UNASSIGNED`, `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `BLOCKED` (requires mandatory `blockedReason`), `COMPLETED`, `CANCELLED`.
- `priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- `relatedEntityType` & `relatedEntityId`: Links tasks directly to `LabOrder`, `LabSample`, `LabReport`, `LabInstrument`, `Reagent`, `QualityIncident`, or `CAPA`.
- `assignmentHistory`: Immutable append-only audit trail recording every assignment, reassignment, acceptance, status transition, blockage, and completion with timestamps, previous/new staff IDs, actor ID, and notes.

## 3. Assignment Eligibility & Operational Safeguards (`LaboratoryWorkloadService`)
1. **Active Staff & Tenancy Verification:** Only `ACTIVE` staff belonging to the same `laboratoryId` can receive tasks.
2. **Permission Eligibility:** Role/permission checks validate whether an assignee is authorized for specialized tasks (e.g., `REPORT_APPROVAL` requires `lab.reports.approve`).
3. **Mandatory Blocked Reason:** Transitioning a task to `BLOCKED` without a `blockedReason` is rejected (`400 Bad Request`).
4. **Audited Reassignment:** Reassigning a task requires a reason, appends an immutable `REASSIGNED` history record, emits notifications to the new assignee, and logs to `AuditLogModel`.

## 4. Real-Time Workload Dashboard Metrics
`GET /api/v1/laboratory/workload/dashboard` aggregates live persisted metrics:
- `totalTasks`, `unassignedTasks`, `inProgressTasks`, `completedTasks`, `overdueTasks`, `blockedTasks`.
- Cross-module operational queue counts: `pendingReportReviews`, `pendingReportApprovals`, `pendingSampleProcessing`.
- `staffWorkloadDistribution`: Active task counts, completed-today counts, and live availability indicators per active staff member.
- `departmentWorkloadDistribution`: Open vs. completed task counts and staff headcounts per active department.

## 5. Frontend Interface
- **Workload Operations Board:** `/laboratory/workload`
- **Components:** `WorkloadBoard.tsx`, `TaskAssignmentModal.tsx`, `DepartmentWorkloadChart.tsx`
