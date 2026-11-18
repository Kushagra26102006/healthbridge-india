# HealthBridge India — Role & Resource Access Control Matrix (Day 9 Task 01)

**Authoritative Source:** `apps/api/src/security/permissions.registry.ts`, `apps/api/src/modules/search/search.permissions.ts`, and `apps/api/src/security/authorization.policy.ts`

---

## 1. Role Capability & Scope Matrix

| Resource / Action | PATIENT | DOCTOR | PHARMACY | LABORATORY | ADMIN |
|---|---|---|---|---|---|
| **Own Profile & Account Settings** | Read/Write (`SELF`) | Read/Write (`SELF`) | Read/Write (`SELF`) | Read/Write (`SELF`) | Read/Write (`SELF`) |
| **Other Patient's Profile / Timeline** | **DENIED (403)** | Authorized/Assigned or Active Consent Only | Minimal Order Identity Only | Minimal Assigned Order Identity Only | **DENIED (No unrestricted clinical access)** |
| **Medical Records (`GET/POST /records`)** | Own Only (`SELF`) | Active Consent Required | **DENIED (403)** | **DENIED (403)** | Audited Break-Glass Justification Required (`ConsentSecurityAdapter`) |
| **Appointments** | Manage Own | Manage Assigned | **DENIED (403)** | **DENIED (403)** | Operational Oversight Only |
| **Clinical Encounters** | Read Own Timeline | Create/Finalize Assigned | **DENIED (403)** | **DENIED (403)** | **DENIED** |
| **Prescriptions** | Read Own | Issue & View Own | Read Eligible & Dispense (`FACILITY_PHARMACY`) | **DENIED (403)** | **DENIED** |
| **Pharmacy Inventory, Orders & Dispensing** | **DENIED (403)** | **DENIED (403)** | Manage Own Facility (`assertFacilityScope`) | **DENIED (403)** | Operational Order Metadata Only |
| **Lab Orders, Samples, QC & Report Publication** | Read Own Published Reports Only | Create Orders & Read Authorized Reports | **DENIED (403)** | Manage Assigned Lab Scope (`assertFacilityScope`) | Operational Order Metadata Only |
| **Patient Consent Management (`/consent`)** | Grant / Deny / Revoke Own | Request Consent Only (Blocked from `/consent` patient portal) | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** |
| **Global Search (`/api/v1/search`)** | Own records + public providers (`patient` blocked) | Assigned/consented patients & clinical + medicines | Prescriptions, pharmacy ops, inventory, medicines | Lab orders, samples, tests, reports, assigned patient | Users, providers, operational orders (`medical_record`/`lab_report` blocked) |
| **Unified Notifications & SSE (`/notifications`)** | Own Inbox & Stream Only | Own Inbox & Stream Only | Own Inbox & Stream Only | Own Inbox & Stream Only | Own Inbox + Operational Publish (`POST /notifications/events`) |
| **Platform Events & Dead-Letter Replay (`/events`)** | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** | Allowed (`admin:events:manage`) |
| **Audit Logs (`/audit`) & User Admin (`/users`)** | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** | Allowed (`admin:audit:read`, `admin:users:manage`) |

---

## 2. Multi-Layer Enforcement Checks

1. **Perimeter RBAC:** `authorize([...])` or `requirePermission(...)` rejects unauthorized roles before controller logic executes.
2. **Resource Ownership (`assertResourceOwnership`):** Compares canonical `resource.patientId` / `resource.userId` against JWT-derived `req.user.userId` (ignoring any client-supplied ID parameters).
3. **Organization / Facility Scope (`assertFacilityScope`):** Enforces `pharmacyId` and `laboratoryId` isolation across multi-tenant facilities.
4. **Consent-Aware Enforcement (`consentSecurityAdapter`):** Validates active status, validity window (`from`/`to`), resource category (`permittedDataTypes`), and synchronous revocation barrier (`invalidateConsentImmediately`), failing closed on any ambiguity.

---

## 3. Day 9 Audit Remediation Note

During Day 9 Task 01 automated security testing, three Day 2 scaffold route files (`audit.routes.ts`, `user.routes.ts`, `prescription.routes.ts`) were discovered without authentication/authorization middleware. All three were immediately locked down with `authenticate` plus `requirePermission('admin:audit:read')`, `requirePermission('admin:users:manage')`, and `authorize(['PATIENT', 'DOCTOR', 'PHARMACY'])`, and verified via `apps/api/tests/integration/security-architecture.test.ts`.
