# Laboratory Staff Activity & Immutable Audit Trail — HealthBridge India

## 1. Overview
Every administrative, security, scheduling, and clinical workforce mutation in the Laboratory Portal writes an immutable audit record to the platform's existing `AuditLogModel` (`apps/api/src/modules/audit/models/audit-log.model.ts`). No parallel or mutable activity tables are introduced.

## 2. Audited Workforce Events
| Category | Audited Action Codes |
|---|---|
| **Staff Lifecycle** | `LAB_STAFF_INVITED`, `LAB_STAFF_INVITE_ACCEPTED`, `LAB_STAFF_UPDATED`, `LAB_STAFF_STATUS_CHANGED` |
| **RBAC & Permissions** | `LAB_STAFF_PERMISSIONS_UPDATED` (records before/after grants, denials, and audit reason) |
| **Departments** | `LAB_DEPARTMENT_CREATED`, `LAB_DEPARTMENT_UPDATED` |
| **Shift Scheduling** | `LAB_SHIFT_TEMPLATE_CREATED`, `LAB_SHIFT_TEMPLATE_UPDATED`, `LAB_SHIFT_ASSIGNED`, `LAB_SHIFT_UPDATED`, `LAB_SHIFT_SWAP_REQUESTED`, `LAB_SHIFT_SWAP_REVIEWED` |
| **Leave & Availability** | `LAB_LEAVE_REQUESTED`, `LAB_LEAVE_REVIEWED`, `LAB_STAFF_AVAILABILITY_UPDATED` |
| **Workload Allocation** | `LAB_TASK_ASSIGNED`, `LAB_TASK_REASSIGNED`, `LAB_TASK_STATUS_UPDATED` |

## 3. Security & Privacy Rules
1. **Zero Secret Leakage:** Raw single-use invitation tokens are never written to `AuditLogModel.metadata` or application logs; only staff identity, role, and expiry metadata are logged.
2. **Tenant Scoping:** `GET /api/v1/laboratory/staff/:id/activity` verifies that the target staff member belongs to the caller's `laboratoryId` before retrieving chronological audit entries (`createdAt: -1`).
3. **Immutability:** Audit records are append-only; no update or delete endpoints exist for staff activity records.
4. **Notification Integration:** Alongside audit logging, operational events publish notifications via `NotificationService.publishEvent(...)` (`STAFF_INVITED`, `STAFF_STATUS_UPDATED`, `SHIFT_ASSIGNED`, `SHIFT_SWAP_REQUESTED`, `SHIFT_SWAP_REVIEWED`, `LEAVE_REQUEST_SUBMITTED`, `LEAVE_REQUEST_REVIEWED`, `TASK_ASSIGNED`, `TASK_REASSIGNED`, `TASK_STATUS_UPDATED`).

## 4. Frontend Interface
- **Staff Activity Timeline:** `/laboratory/staff/[id]/activity` (`StaffActivityTimeline.tsx`)
- **Profile Overview Preview:** `/laboratory/staff/[id]` displays the 8 most recent audit entries alongside effective permission grants.
