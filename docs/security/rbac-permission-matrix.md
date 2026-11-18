# HealthBridge India — RBAC & Resource Permission Matrix (Phase 18)

## 1. Core Authorization Principles

1. **Server-Side Enforcement Only:** Frontend visibility is never treated as authorization. Every sensitive Express route enforces `authenticate` followed by `authorize([...])`, `requirePermission(...)`, or `requireSecurityOpsPermission(...)`.
2. **Fail-Closed Ownership & Consent Checks:** Resource ownership (`record.patientId === req.user.userId`) and active patient consent (`consentEnforcementService.enforce()`) are checked independently on every read, preview, download, and write endpoint.
3. **Zero Unrestricted Clinical Access:** As enforced in `apps/api/src/security/permissions.registry.ts`, **no role — including `ADMIN` — holds `unrestrictedClinicalAccess`**.

---

## 2. Platform Role Permission Matrix

| Role | Scope Boundary | Authorized Capabilities | Explicitly Prohibited |
| --- | --- | --- | --- |
| **PATIENT** | `SELF` (`userId === patientId`) | Own profile, own appointments, own medical documents (upload/preview/download/soft-archive), own prescriptions, own published lab reports, own consent & ABHA linking/unlinking, own global search scope. | Cross-patient records (IDOR blocked `403`), provider schedules, pharmacy inventory, lab worklists, admin audit/security logs. |
| **DOCTOR** | `CARE_RELATIONSHIP_AND_CONSENT` | Assigned patient queue & appointments, clinical encounters, digital prescriptions, lab orders, consent-gated patient medical records & document preview/download, read-only ABDM imported records. | Unconsented patient records (`403`), archiving/deleting patient documents, editing external ABDM imported records, pharmacy dispensing/inventory, admin endpoints. |
| **PHARMACY** | `FACILITY_PHARMACY` | Eligible routed prescriptions (verify & preview Rx only), medicine inventory, batches, expiry alerts, dispensing execution, orders, suppliers & procurement. | General patient medical records (`403`), clinical encounters, lab reports, admin audit/security endpoints. |
| **LABORATORY** | `FACILITY_LABORATORY` | Assigned lab orders, specimen accessioning/barcode custody, result entry, pathologist approval & report publication, QC & reagent inventory. | General patient vault documents (`403`), prescriptions, pharmacy inventory, clinical encounters, admin endpoints. |
| **ADMIN** | `PLATFORM_OPERATIONS` | Operational platform monitoring, user account lifecycle, ABDM readiness & FHIR validation, domain outbox monitoring, read-only immutable audit logs (`admin:audit:read`). | Unrestricted clinical PHI access, deleting/modifying audit logs, auto-granting SecOps responder privileges. |
| **ADMIN + SecOps Grants** | Explicit `AdminProfile` permissions | Granular `SECURITY_EVENTS_READ`, `SECURITY_ALERTS_READ/MANAGE`, `SECURITY_INCIDENTS_READ/MANAGE/RESPOND`, `SECURITY_VULNERABILITIES_READ/MANAGE` (separation of duties enforced for incident containment/eradication/recovery). | Destructive audit deletion, unauthorized clinical record downloads. |
