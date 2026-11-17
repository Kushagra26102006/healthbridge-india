# Laboratory Staff Management — HealthBridge India

## 1. Overview
The Laboratory Staff Management module provides multi-tenant workforce lifecycle management scoped strictly to each diagnostic laboratory (`laboratoryId`). It allows laboratory administrators and managers to invite personnel, onboard them securely with single-use hashed invitation tokens, organize staff by departments and designations, and manage operational access states (`INVITED`, `PENDING_ACCEPTANCE`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `EXPIRED`).

## 2. Data Model (`LaboratoryStaffModel`)
Defined in `apps/api/src/modules/laboratory/models/laboratory-staff.model.ts`:
- **Tenancy & Identity:** `laboratoryId` (indexed), optional linked `userId`, unique compound index `{ laboratoryId: 1, email: 1 }`, and unique `{ laboratoryId: 1, employeeId: 1 }`.
- **Profile Fields:** `fullName`, `email`, `phone`, `employeeId` (auto-generated as `LAB-EMP-XXXX` if omitted), `designation`, `departmentId`, `qualifications`, `licenseNumber`, `profilePhotoUrl`, `notes`, `isPrimaryOwner`.
- **Authorization Fields:** `role` (`LaboratoryStaffRole`), `allowedPermissions`, `deniedPermissions`.
- **Invitation Lifecycle:**
  - `invitationTokenHash`: SHA-256 hex digest of a cryptographically random 32-byte token. Raw tokens are never persisted in MongoDB or emitted into server logs.
  - `invitationSentAt`, `invitationExpiresAt` (7-day TTL), `invitationAcceptedAt`.
- **Status Lifecycle:** `INVITED` → `ACTIVE` → (`SUSPENDED` / `DEACTIVATED`) or `EXPIRED`.

## 3. Secure Onboarding Workflow
1. **Invitation (`POST /api/v1/laboratory/staff/invite`):**
   - Requires `staff.invite` permission.
   - Prevents duplicate emails within the same laboratory.
   - Blocks non-`LAB_ADMIN` callers from inviting another `LAB_ADMIN` (prevents privilege escalation).
   - Generates a 64-char hex random token, stores only its SHA-256 hash, sets a 7-day expiry, creates an audit record, and dispatches a `STAFF_INVITED` notification event.
2. **Acceptance (`POST /api/v1/laboratory/staff/accept-invite`):**
   - Authenticated user submits the raw invitation token.
   - Service hashes the incoming token and queries `LaboratoryStaffModel` by `invitationTokenHash`.
   - Rejects expired or already-used tokens.
   - Links `userId`, sets `status = 'ACTIVE'`, records `invitationAcceptedAt`, and clears `invitationTokenHash = undefined` (enforcing single-use idempotency).
3. **Multi-User Tenancy Resolution:**
   - `LaboratoryService.resolveLaboratoryProfile(userId)` resolves the laboratory context for either the primary owner (`LaboratoryProfile.userId === userId`) or any `ACTIVE` staff member (`LaboratoryStaffModel.userId === userId`).

## 4. API Endpoints
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/laboratory/staff` | `staff.view` | Paginated directory with search, role, department, and status filters |
| `POST` | `/api/v1/laboratory/staff/invite` | `staff.invite` | Invite new staff member with single-use hashed token |
| `POST` | `/api/v1/laboratory/staff/accept-invite` | Authenticated | Accept invitation and activate laboratory staff membership |
| `GET` | `/api/v1/laboratory/staff/:id` | `staff.view` | Staff profile detail with computed effective permissions |
| `PUT` | `/api/v1/laboratory/staff/:id` | `staff.update` | Update profile fields, department, credentials, or role |
| `PUT` | `/api/v1/laboratory/staff/:id/status` | `staff.deactivate` | Activate, suspend, or deactivate a staff member (blocks primary owner deactivation) |
| `GET` | `/api/v1/laboratory/staff/:id/activity` | `staff.view` | Paginated immutable audit log for staff actions |

## 5. Frontend Interface
- **Staff Directory:** `/laboratory/staff` (`LaboratoryStaffTable`, `StaffInvitationModal`)
- **Dedicated Invite Page:** `/laboratory/staff/invite`
- **Staff Profile:** `/laboratory/staff/[id]` (`StaffProfileCard`)
- **Edit Profile:** `/laboratory/staff/[id]/edit`
- **Permissions Override:** `/laboratory/staff/[id]/permissions` (`StaffPermissionEditor`)
- **Activity Log:** `/laboratory/staff/[id]/activity` (`StaffActivityTimeline`)
