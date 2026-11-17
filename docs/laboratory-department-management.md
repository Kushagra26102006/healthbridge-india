# Laboratory Department Management — HealthBridge India

## 1. Overview
Laboratory departments organize clinical personnel, testing benches, shift assignments, and workload allocations into structured operational sections (e.g., Hematology, Biochemistry, Microbiology, Pathology, Clinical Chemistry, Sample Collection, Quality Control, Administration).

## 2. Data Model (`LaboratoryDepartmentModel`)
Defined in `apps/api/src/modules/laboratory/models/laboratory-department.model.ts`:
- `laboratoryId` (ObjectId, required, indexed)
- `name` (String, required, 2–100 chars)
- `code` (String, required, uppercase, 2–20 chars)
- Unique compound index: `{ laboratoryId: 1, code: 1 }`
- `description`, `location`, `contactExtension`
- `headOfDepartmentId` (ref: `LaboratoryStaff`)
- `isActive` (Boolean, default `true`)

## 3. Service & Operational Metrics (`LaboratoryDepartmentService`)
Implemented in `apps/api/src/modules/laboratory/services/laboratory-department.service.ts`:
- **Cross-Laboratory Isolation:** All queries filter strictly by `laboratoryId`. Assigning a department head validates that the target staff member belongs to the same laboratory and is `ACTIVE`.
- **Real-Time Aggregation:** `listDepartments` and `getDepartmentById` dynamically aggregate:
  - `staffCount`: Count of non-deactivated staff members assigned to the department.
  - `activeWorkloadCount`: Count of active tasks (`ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `BLOCKED`) scoped to the department.
- **Audit Logging:** Department creation, updates, head assignments, and activation changes write immutable `AuditLogModel` entries.

## 4. API Endpoints
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/laboratory/departments` | `staff.view` | List departments with real-time staff and active workload counts |
| `POST` | `/api/v1/laboratory/departments` | `staff.update` | Create a new department with unique lab-scoped code |
| `GET` | `/api/v1/laboratory/departments/:id` | `staff.view` | Get department details and live counts |
| `PUT` | `/api/v1/laboratory/departments/:id` | `staff.update` | Update department details, location, status, or head of department |

## 5. Frontend Interface
- **Departments Console:** `/laboratory/departments`
- **Components:** `DepartmentManagementTable.tsx`, `DepartmentModal.tsx`
- Displays active department KPIs, staff headcount, open workload count, bench location, and department head selector.
