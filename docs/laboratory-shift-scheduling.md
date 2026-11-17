# Laboratory Shift Scheduling, Availability & Leave Management — HealthBridge India

## 1. Overview
The Shift Scheduling module provides laboratory duty-roster planning, overnight shift support, shift swap approval workflows, weekly staff availability windows, custom blackout dates, and leave request tracking with automated conflict detection.

## 2. Database Models
- **`LaboratoryShiftTemplateModel`** (`apps/api/src/modules/laboratory/models/laboratory-shift.model.ts`):
  - Defines reusable templates (`name`, `code`, `startTime` `HH:mm`, `endTime` `HH:mm`, `breakMinutes`, `isOvernight`, `color`, `applicableDepartmentIds`, `isActive`).
  - Automatically computes `isOvernight = true` when `endTime < startTime` (e.g., `22:00` to `06:00`).
- **`LaboratoryShiftAssignmentModel`**:
  - Concrete duty assignments linking `staffId`, `shiftTemplateId`, `departmentId`, `date` (`YYYY-MM-DD`), `startTime`, `endTime`, `isOvernight`, and `status` (`SCHEDULED`, `CONFIRMED`, `SWAP_REQUESTED`, `SWAPPED`, `COMPLETED`, `ABSENT`, `CANCELLED`).
  - Embedded `swapDetails` subdocument tracking requester target, reason, review decision, and reviewer timestamp.
- **`LaboratoryLeaveRequestModel`** (`apps/api/src/modules/laboratory/models/laboratory-leave.model.ts`):
  - Tracks leave types (`ANNUAL`, `SICK`, `CASUAL`, `EMERGENCY`, `MATERNITY`, `OTHER`), `startDate`, `endDate`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), and operational impact counts (`affectedShiftCount`, `affectedTaskCount`).
- **`LaboratoryStaffAvailabilityModel`**:
  - Stores per-staff `timezone`, 7-day `weeklySchedule` windows (`isAvailable`, `preferredShiftTemplateId`, `maxHours`), and `customBlackouts`.

## 3. Conflict Detection & Safety Rules (`LaboratorySchedulingService`)
1. **Duplicate / Overlapping Shift Prevention:** Assigning a shift checks existing non-cancelled shifts for the same staff member on the same date (including overnight time-window overlap checks) and rejects conflicts with `409 Conflict`.
2. **Approved Leave Guard:** Assigning a shift to a staff member whose date overlaps an `APPROVED` leave request is blocked.
3. **Shift Swap Workflow:**
   - Staff or supervisors submit a swap request specifying `targetStaffId` and `reason` → status becomes `SWAP_REQUESTED`.
   - Supervisors approve or reject via `POST /api/v1/laboratory/shifts/:id/swap-review`. Approval verifies target staff availability, transfers the shift assignment, updates status to `SWAPPED`, emits notifications, and logs an audit entry.
4. **Leave Impact Auditing:** Submitting or reviewing a leave request counts intersecting scheduled shifts and open assigned clinical tasks (`affectedShiftCount`, `affectedTaskCount`). Pending clinical tasks are **never silently deleted** upon leave approval—supervisors are alerted to reassign them explicitly through the Workload Board.

## 4. API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/api/v1/laboratory/shift-templates` | List or create shift templates |
| `PUT` | `/api/v1/laboratory/shift-templates/:id` | Update shift template |
| `GET / POST` | `/api/v1/laboratory/shifts` | Query schedule or assign a shift |
| `POST` | `/api/v1/laboratory/shifts/batch` | Batch-assign multiple shifts |
| `PUT` | `/api/v1/laboratory/shifts/:id` | Update shift status or notes |
| `POST` | `/api/v1/laboratory/shifts/:id/swap-request` | Request a shift swap |
| `POST` | `/api/v1/laboratory/shifts/:id/swap-review` | Supervisor approve/reject shift swap |
| `GET / PUT` | `/api/v1/laboratory/availability/:staffId` | Get or update weekly availability & blackouts |
| `GET / POST` | `/api/v1/laboratory/leave-requests` | List or submit leave requests |
| `PUT` | `/api/v1/laboratory/leave-requests/:id/review` | Approve or reject leave request |

## 5. Frontend Interface
- **Shift Roster & Templates:** `/laboratory/scheduling/shifts`
- **Shift Calendar:** `/laboratory/scheduling/calendar`
- **Leave Requests:** `/laboratory/scheduling/leave`
- **Weekly Availability:** `/laboratory/scheduling/availability`
