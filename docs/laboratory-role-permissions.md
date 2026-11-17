# Laboratory Role Permissions & Segregation of Duties — HealthBridge India

## 1. Architecture Overview
Laboratory authorization operates as a **deny-by-default, laboratory-scoped RBAC engine** layered cleanly on top of the platform-level roles (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`, `ADMIN`). Platform roles are never altered or replaced; instead, authenticated `LABORATORY` users are resolved to their `LaboratoryStaffModel` profile within their assigned `laboratoryId`.

Centralized logic lives in `apps/api/src/modules/laboratory/services/laboratory-authorization.service.ts`.

## 2. Laboratory-Scoped Roles (8 Roles)
| Role | Operational Scope |
|---|---|
| `LAB_ADMIN` | Full laboratory governance, staff lifecycle, permission overrides, and all operational permissions |
| `LAB_MANAGER` | Operational oversight across departments, orders, schedules, QC, instruments, inventory, and analytics |
| `LAB_SUPERVISOR` | Shift oversight, task allocation, sample accessioning, test processing, and report review |
| `LAB_TECHNICIAN` | Sample collection/accessioning, bench test processing, result entry, and QC run execution |
| `LAB_REVIEWER` | Clinical verification and secondary review of test results and diagnostic reports |
| `LAB_PATHOLOGIST` | Medical verification, final report approval, publication, and report amendments |
| `LAB_INVENTORY_MANAGER` | Reagent catalogue, lot receipt, consumption tracking, stock adjustments, and quarantine control |
| `LAB_QUALITY_MANAGER` | QC profile configuration, Westgard failure investigation, incidents, CAPA, calibration, and maintenance |

## 3. Granular Permission Catalogue (38 Permissions across 8 Domains)
- **Staff:** `staff.view`, `staff.invite`, `staff.update`, `staff.deactivate`, `staff.permissions.manage`
- **Orders & Samples:** `lab.orders.view`, `lab.orders.assign`, `lab.samples.view`, `lab.samples.collect`, `lab.samples.accession`
- **Processing:** `lab.processing.view`, `lab.processing.perform`, `lab.results.create`, `lab.results.update`, `lab.results.submit`
- **Reports:** `lab.reports.view`, `lab.reports.generate`, `lab.reports.review`, `lab.reports.approve`, `lab.reports.publish`, `lab.reports.amend`
- **Quality (QMS):** `lab.qc.view`, `lab.qc.configure`, `lab.qc.execute`, `lab.incidents.manage`, `lab.capa.manage`
- **Instruments:** `lab.instruments.view`, `lab.instruments.manage`, `lab.calibration.manage`, `lab.maintenance.manage`
- **Inventory:** `lab.reagents.view`, `lab.reagents.manage`, `lab.inventory.receive`, `lab.inventory.consume`, `lab.inventory.adjust`, `lab.inventory.quarantine`
- **Analytics:** `lab.analytics.view`, `lab.analytics.export`

## 4. Effective Permission Resolution
Effective permissions for any staff record are computed deterministically:
```
EffectivePermissions = (RoleDefaults ∪ allowedPermissions) \ deniedPermissions
```
- Explicit denials (`deniedPermissions`) always override role defaults and grants.
- Primary laboratory owners receive full `LAB_ADMIN` privileges and cannot be locked out.
- Route protection is enforced via `requireLabPermission(permission)` middleware, returning `403 Forbidden` for unauthorized actors or inactive/suspended staff.

## 5. Segregation of Duties (SoD) Controls
To support clinical integrity and internal governance:
1. **No Self-Approval of Diagnostic Reports:** `assertSegregationOfDutiesForReportApproval(approverActorId, resultAuthorActorId)` explicitly blocks a technician/author from approving reports whose underlying clinical results they entered.
2. **Role-Gated Approval:** Report approval requires `lab.reports.approve` (restricted by default to `LAB_PATHOLOGIST` and `LAB_ADMIN`).
3. **No Privilege Escalation:** Only `LAB_ADMIN` can assign `LAB_ADMIN` roles or invoke `staff.permissions.manage`.
4. **Inventory Adjustment Controls:** Stock write-offs and manual adjustments require `lab.inventory.adjust`.

> **Operational Note:** These software controls provide structured RBAC and segregation-of-duties enforcement to assist laboratory governance. They do not by themselves constitute regulatory certification or accreditation.
