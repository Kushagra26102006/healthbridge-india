# HealthBridge India — Complete Route Inventory (Phase 01)

> **Total Verified Routes:** **207** `page.tsx` routes across **6** `layout.tsx` shells, plus **1** `error.tsx` and **1** `not-found.tsx` (**0** `loading.tsx` files).

---

## 1. Route Summary by Area

| Area / Portal | Route Group / Layout | Route Count | Guard / Role Requirement |
| :--- | :--- | :---: | :--- |
| **Public Pages** | `app/layout.tsx` | 2 | Public (Unauthenticated) |
| **Authentication** | `app/(auth)/` (inherits root layout) | 6 | Public / Auth Flow |
| **Shared Authenticated** | `app/(dashboard)/` | 2 | Any Authenticated Role |
| **Patient Portal** | `app/(dashboard)/patient/layout.tsx` | 45 | `ProtectedRoute(['PATIENT'])` |
| **Doctor Portal** | `app/(dashboard)/doctor/layout.tsx` | 42 | `ProtectedRoute(['DOCTOR'])` |
| **Pharmacy Portal** | `app/(dashboard)/pharmacy/layout.tsx` | 50 | `ProtectedRoute(['PHARMACY'])` |
| **Laboratory Portal** | `app/(dashboard)/laboratory/layout.tsx` | 47 | `ProtectedRoute(['LABORATORY'])` |
| **Admin & SecOps Portal** | `app/(dashboard)/admin/layout.tsx` | 13 | `ProtectedRoute(['ADMIN'])` |
| **Total** | **6 layouts (`layout.tsx`)** | **207** | — |

---

## 2. Public Routes (2)

- `/` — Public landing page (Hero, Platform Overview, Services, How It Works, User Ecosystem, ABHA Info, Privacy, Final CTA, AuthModal, InfoModal)
- `/privacy-policy` — Public Healthcare Privacy Notice & DPDP/ABDM disclosures

---

## 3. Authentication Routes (6)

- `/login` — Role-aware user sign-in
- `/register` — Multi-role account registration (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`)
- `/forgot-password` — Password recovery request
- `/reset-password` — Tokenized password reset
- `/verify-email` — Email address verification
- `/verify-phone` — Mobile OTP verification

---

## 4. Shared Authenticated Routes (2)

- `/dashboard` — Role-based dashboard dispatcher (redirects authenticated user to their portal dashboard)
- `/dashboard/search` — Full-page role-scoped Global Search & Discovery results

---

## 5. Patient Dashboard Routes (45)

### Core & Timeline (3)
- `/patient/dashboard`
- `/patient/health-timeline`
- `/patient/profile`

### Appointments & Doctor Discovery (6)
- `/patient/appointments`
- `/patient/appointments/book`
- `/patient/appointments/history`
- `/patient/appointments/[appointmentId]`
- `/patient/doctors`
- `/patient/doctors/[doctorId]`

### Health Records, Prescriptions & Diagnostics (9)
- `/patient/records`
- `/patient/records/[recordId]`
- `/patient/prescriptions`
- `/patient/lab-orders`
- `/patient/lab-orders/[orderId]`
- `/patient/lab-reports`
- `/patient/lab-reports/[reportId]`
- `/patient/reports`
- `/patient/reports/[id]`

### Pharmacy Orders (3)
- `/patient/orders`
- `/patient/orders/[id]`
- `/patient/orders/[id]/tracking`

### ABHA & ABDM Interoperability (8)
- `/patient/abha`
- `/patient/abha/link`
- `/patient/abha/verification`
- `/patient/abha/history`
- `/patient/abdm/health-records`
- `/patient/abdm/linked-records`
- `/patient/abdm/record-discovery`
- `/patient/abdm/transfer-history`

### Consent & Privacy Governance (9)
- `/patient/consent`
- `/patient/consent/[consentId]`
- `/patient/consent/artefacts`
- `/patient/consent/history`
- `/patient/consent/requests`
- `/patient/consent/requests/[id]`
- `/patient/data-sharing`
- `/patient/privacy`
- `/patient/privacy-notice`

### Notifications & Account Settings (7)
- `/patient/notifications`
- `/patient/notifications/preferences`
- `/patient/settings`
- `/patient/settings/notifications`
- `/patient/settings/privacy`
- `/patient/settings/security`
- `/patient/settings/sessions`

---

## 6. Doctor Dashboard Routes (42)

### Core & Queue (3)
- `/doctor/dashboard`
- `/doctor/queue`
- `/doctor/profile`

### Appointments (5)
- `/doctor/appointments`
- `/doctor/appointments/today`
- `/doctor/appointments/upcoming`
- `/doctor/appointments/history`
- `/doctor/appointments/[appointmentId]`

### Clinical Encounters (4)
- `/doctor/encounters`
- `/doctor/encounters/new`
- `/doctor/encounters/[encounterId]`
- `/doctor/encounters/[encounterId]/edit`

### Patients & Longitudinal Records (8)
- `/doctor/patients`
- `/doctor/patients/[patientId]`
- `/doctor/patients/[patientId]/overview`
- `/doctor/patients/[patientId]/history`
- `/doctor/patients/[patientId]/encounters`
- `/doctor/patients/[patientId]/prescriptions`
- `/doctor/patients/[patientId]/lab-reports`
- `/doctor/patients/[patientId]/records`

### Prescriptions & Medications (6)
- `/doctor/prescriptions`
- `/doctor/prescriptions/new`
- `/doctor/prescriptions/[prescriptionId]`
- `/doctor/prescriptions/[prescriptionId]/edit`
- `/doctor/medications`
- `/doctor/medications/catalog`

### Diagnostics & ABDM (3)
- `/doctor/reports`
- `/doctor/reports/[id]`
- `/doctor/abdm/health-records`

### Schedule Management (5)
- `/doctor/schedule`
- `/doctor/schedule/weekly`
- `/doctor/schedule/availability`
- `/doctor/schedule/blocked-dates`
- `/doctor/schedule/settings`

### Notifications & Settings (8)
- `/doctor/notifications`
- `/doctor/notifications/preferences`
- `/doctor/settings`
- `/doctor/settings/practice`
- `/doctor/settings/professional`
- `/doctor/settings/notifications`
- `/doctor/settings/security`
- `/doctor/settings/sessions`

---

## 7. Pharmacy Dashboard Routes (50)

### Core & Profile (3)
- `/pharmacy`
- `/pharmacy/dashboard`
- `/pharmacy/profile`

### Prescriptions & Dispensing (6)
- `/pharmacy/prescriptions`
- `/pharmacy/prescriptions/[id]`
- `/pharmacy/dispensing`
- `/pharmacy/dispensing/history`
- `/pharmacy/dispensing/[id]`
- `/pharmacy/dispensing/[id]/receipt`

### Orders & Fulfillment (6)
- `/pharmacy/orders`
- `/pharmacy/orders/history`
- `/pharmacy/orders/cancelled`
- `/pharmacy/orders/[id]`
- `/pharmacy/orders/[id]/fulfillment`
- `/pharmacy/orders/[id]/pickup`

### Inventory Management (10)
- `/pharmacy/inventory`
- `/pharmacy/inventory/medicines`
- `/pharmacy/inventory/medicines/new`
- `/pharmacy/inventory/medicines/[id]`
- `/pharmacy/inventory/batches`
- `/pharmacy/inventory/expiry`
- `/pharmacy/inventory/alerts`
- `/pharmacy/inventory/stock-in`
- `/pharmacy/inventory/stock-adjustment`
- `/pharmacy/inventory/transactions`

### Procurement, Suppliers & Replenishment (13)
- `/pharmacy/suppliers`
- `/pharmacy/suppliers/new`
- `/pharmacy/suppliers/[id]`
- `/pharmacy/suppliers/[id]/edit`
- `/pharmacy/purchases`
- `/pharmacy/purchases/new`
- `/pharmacy/purchases/history`
- `/pharmacy/purchases/[id]`
- `/pharmacy/purchases/[id]/edit`
- `/pharmacy/purchases/[id]/receive`
- `/pharmacy/replenishment`
- `/pharmacy/replenishment/suggestions`
- `/pharmacy/replenishment/settings`

### Notifications & Settings (12)
- `/pharmacy/notifications`
- `/pharmacy/notifications/history`
- `/pharmacy/notifications/preferences`
- `/pharmacy/settings`
- `/pharmacy/settings/general`
- `/pharmacy/settings/business`
- `/pharmacy/settings/operating-hours`
- `/pharmacy/settings/services`
- `/pharmacy/settings/staff`
- `/pharmacy/settings/notifications`
- `/pharmacy/settings/security`
- `/pharmacy/settings/sessions`

---

## 8. Laboratory Dashboard Routes (47)

### Core, Profile & Operations (5)
- `/laboratory`
- `/laboratory/dashboard`
- `/laboratory/profile`
- `/laboratory/collection-centers`
- `/laboratory/departments`

### Orders, Samples & Tests (10)
- `/laboratory/orders`
- `/laboratory/orders/[id]`
- `/laboratory/samples`
- `/laboratory/samples/collect`
- `/laboratory/samples/scan`
- `/laboratory/samples/[id]`
- `/laboratory/tests`
- `/laboratory/tests/new`
- `/laboratory/tests/[id]`
- `/laboratory/workload`

### Diagnostic Reports (6)
- `/laboratory/reports`
- `/laboratory/reports/[id]`
- `/laboratory/reports/[id]/preview`
- `/laboratory/reports/[id]/review`
- `/laboratory/reports/[id]/approve`
- `/laboratory/reports/[id]/versions`

### Quality Management System (QMS) & Reagents (12)
- `/laboratory/quality`
- `/laboratory/quality/analytics`
- `/laboratory/quality/control`
- `/laboratory/quality/control/runs/[id]`
- `/laboratory/quality/instruments`
- `/laboratory/quality/instruments/[id]`
- `/laboratory/quality/calibration`
- `/laboratory/quality/maintenance`
- `/laboratory/quality/incidents`
- `/laboratory/quality/capa`
- `/laboratory/inventory/reagents`
- `/laboratory/inventory/reagents/[id]`

### Workforce, Scheduling, Notifications & Settings (14)
- `/laboratory/staff`
- `/laboratory/staff/invite`
- `/laboratory/staff/permissions`
- `/laboratory/staff/[id]`
- `/laboratory/staff/[id]/edit`
- `/laboratory/staff/[id]/permissions`
- `/laboratory/staff/[id]/activity`
- `/laboratory/scheduling/calendar`
- `/laboratory/scheduling/shifts`
- `/laboratory/scheduling/availability`
- `/laboratory/scheduling/leave`
- `/laboratory/notifications`
- `/laboratory/notifications/preferences`
- `/laboratory/settings`

---

## 9. Admin & SecOps Dashboard Routes (13)

### Core & Platform Operations (4)
- `/admin/dashboard`
- `/admin/platform-overview`
- `/admin/platform/events`
- `/admin/integrations/abdm`

### Privacy & Notifications (3)
- `/admin/privacy-requests`
- `/admin/notifications`
- `/admin/notifications/preferences`

### Security Operations & Data Protection (6)
- `/admin/security/overview`
- `/admin/security/alerts`
- `/admin/security/incidents`
- `/admin/security/incidents/[id]`
- `/admin/security/vulnerabilities`
- `/admin/security/data-protection`

---

## 10. Special App Router Files

| File | Present? | Scope / Gap |
| :--- | :---: | :--- |
| `src/app/layout.tsx` | Yes | Root shell (no `next/font`, no skip-to-content link) |
| `src/app/error.tsx` | Yes | Root error boundary only (no portal-level error boundaries) |
| `src/app/not-found.tsx` | Yes | Root 404 page |
| `**/loading.tsx` | **No (0 files)** | Missing across all 5 portals — causes layout jumps during route transitions |
| `**/template.tsx` | **No (0 files)** | No shared route-transition wrapper |
