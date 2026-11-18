# HealthBridge India — Platform-Wide Current Architecture Audit (Day 8 Task 01)

> **Audit Date:** 2026-11-18  
> **Scope:** Full monorepo audit across `apps/api` (19 backend modules, 50+ Mongoose models), `packages/*` (`config`, `shared-types`, `validation`), and `apps/web` (Next.js App Router patient, doctor, pharmacy, laboratory, admin, and ABDM route groups).

---

## 1. Audited Module Inventory

| Domain | Backend Module(s) | Core Models | Frontend Route Group | Audit Status |
|---|---|---|---|---|
| **Auth & Identity** | `auth`, `users`, `security` | `User`, `PatientProfile`, `DoctorProfile`, `PharmacyProfile`, `LaboratoryProfile`, `AdminProfile`, `RefreshToken`, `VerificationToken` | `/(auth)/*`, `/patient/profile`, `/patient/settings` | Operational (`User._id` is authoritative internal key) |
| **Appointments** | `appointments`, `doctors` | `Appointment`, `DoctorSchedule` | `/patient/appointments*`, `/doctor/appointments*`, `/doctor/schedule*` | Operational; linked to `Encounter` via `encounterId` |
| **Encounters & Records** | `doctors`, `records`, `healthcare` | `Encounter`, `MedicalRecord` | `/doctor/encounters*`, `/patient/records*` | Operational; **Gap Found:** duplicate encounters per `appointmentId` not blocked |
| **Prescriptions** | `prescriptions`, `doctors`, `healthcare` | `Prescription`, `MedicationCatalog` | `/doctor/prescriptions*`, `/patient/prescriptions*` | Operational; **Gap Found:** draft prescriptions leaked into `/patients/dashboard-summary` |
| **Pharmacy** | `pharmacy` | `PharmacyInventory`, `PharmacyInventoryTransaction`, `PharmacyOrder`, `DispensingRecord`, `Supplier`, `PurchaseOrder`, `GoodsReceipt`, `PharmacyStaff` | `/pharmacy/*`, `/patient/orders*` | Operational (atomic dispensing, batch/expiry checks, immutable `DispensingRecord`) |
| **Laboratory** | `laboratory`, `healthcare` | `LaboratoryOrder`, `LabSample`, `TestResult`, `LaboratoryReport`, `LabReportVersion`, QMS & Workforce models | `/laboratory/*`, `/patient/lab-orders*`, `/patient/lab-reports*`, `/doctor/reports*` | Operational; **Gap Found:** no `POST /api/v1/lab-orders` Doctor order-creation endpoint & `LaboratoryOrder` lacked `encounterId`; unpublished lab reports counted in `/patients/dashboard-summary` |
| **Consent & Security** | `consent`, `audit`, `security` | `ConsentRequest`, `ConsentArtifact`, `AuditLog` | `/patient/consent*` | Operational (internal + ABDM separated; note dual mount `/consent` & `/consents` in `v1.routes.ts`) |
| **Notifications** | `notifications` | `Notification`, `NotificationPreference`, `NotificationDelivery` | `/patient/notifications*` | Operational SSE + idempotency; **Gap Found:** no unified typed cross-module domain event producer/scrubber |
| **ABDM Integration** | `abdm` | 15 ABDM models (`AbhaLink`, `AbdmConsent*`, `AbdmDiscovery*`, `AbdmLinked*`, `AbdmHealthInformation*`, `AbdmImportedRecord`, etc.) | `/patient/abha*`, `/patient/abdm*`, `/doctor/abdm*`, `/admin/integrations/abdm` | Mocked Foundation Complete; live sandbox onboarding & live Fidelius pending |

---

## 2. Specific Architectural & Integration Gaps Identified

1. **Duplicate Encounter Creation Risk (`doctor-encounter.service.ts`):** `createEncounter()` linked `Appointment.encounterId` without checking whether a non-cancelled `Encounter` already existed for that `appointmentId`.
2. **Missing Doctor-to-Laboratory Order Bridge (`lab-order.routes.ts` & `lab-order.model.ts`):** `LaboratoryOrderModel` lacked an indexed `encounterId` field, and `lab-order.routes.ts` only exposed `GET` routes without an authenticated `POST /api/v1/lab-orders` endpoint for authorized clinicians.
3. **Draft / Unpublished Clinical Data Leakage (`patient.routes.ts`):** `/api/v1/patients/dashboard-summary` counted ALL `LaboratoryReportModel` rows (including `DRAFT`/`UNDER_REVIEW`/`REJECTED`) and returned ALL `PrescriptionModel` rows (including `isDraft: true` / `DRAFT`) and omitted ABDM ABHA status, consent summary, dispensing history, encounters, and unread notifications.
4. **Missing Unified Cross-Module Read Views:**
   - No `/patient/health-timeline` chronological timeline aggregating appointments, finalized encounters, issued prescriptions, dispensing, lab orders, published/amended reports, documents, consents, and imported ABDM records.
   - No `/doctor/patients/[patientId]/overview` unified clinical workspace combining internal clinical history, pharmacy dispensing status (read-only), published lab reports (read-only), consent status, and authorized ABDM external records (read-only). *(Note: Next.js App Router uses `[patientId]` under `doctor/patients/` — reusing `[patientId]` avoids dynamic slug collision errors.)*
   - No `/admin/platform-overview` server-side aggregate operational overview.
5. **No Centralized Typed Domain Event Producer:** Modules individually created notifications with varying message formats; a centralized `PlatformEventService` wrapping `NotificationService` + `AuditLogModel` with privacy-safe scrubbing is required.
6. **Consistent Patient Identity Verification:** All operational models (`Appointment`, `Encounter`, `Prescription`, `LaboratoryOrder`, `LaboratoryReport`, `MedicalRecord`, `DispensingRecord`, `ConsentArtifact`, `AbhaLink`, `AbdmImportedRecord`) reference `User._id` as `patientId` (and `PatientProfile.userId` references `User._id`). ABHA remains strictly an external association in `AbhaLinkModel`. A dedicated `PlatformIdentityService` is needed to verify identity consistency and flag duplicate demographic accounts for authorized review without auto-merging.
7. **Dual Route Mount Observation (`v1.routes.ts`):** `/consent` and `/consents` both point to `consentRoutes` for backwards compatibility with legacy callers; preserved without breaking changes.
