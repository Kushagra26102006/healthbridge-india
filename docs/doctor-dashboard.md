# HealthBridge India — Doctor Dashboard & Professional Profile Architecture
**Day 4 Task 01: Doctor Dashboard — Architecture, Professional Profile & Clinical Overview**

---

## 1. Executive Summary

As part of the **HealthBridge India — One Nation One Health Record** initiative, Day 4 Task 01 establishes the foundational architecture and clinical overview for verified healthcare providers (`DOCTOR` role). Built in full alignment with the Ayushman Bharat Digital Mission (ABDM), the National Health Authority (NHA) Healthcare Professionals Registry (HPR), and the Digital Personal Data Protection (DPDP) Act 2023, the Doctor Dashboard provides a high-efficiency clinical workspace for clinicians to manage daily consultations, review assigned patients, inspect schedules, and maintain professional credentials.

---

## 2. Core Architectural Pillars

```
                                      +--------------------------------------------+
                                      |            Next.js App Router              |
                                      |         /doctor/dashboard & portals        |
                                      +---------------------+----------------------+
                                                            |
                                                 TanStack React Query
                                                            |
                                              Axios API Client + JWT
                                                            |
                     +--------------------------------------+--------------------------------------+
                     |                                                                             |
+--------------------v--------------------+                               +------------------------v--------------------+
|            Doctor Dashboard             |                               |             Security & Boundary             |
|  - Welcome & Active Hospital Header     |                               |  - Role Guard: DOCTOR only                  |
|  - Verified Profile Card (MCI/NMC)      |                               |  - Patient Roster Scoping: Clinical Rel.    |
|  - 5-Point Clinical Stat Cards          |                               |  - Immutable Regulatory Credentials         |
|  - Today's Appointments with Filters    |                               |  - Audit Log Trail (DPDP / ABDM compliant)  |
|  - Upcoming Consultations Feed          |                               +---------------------------------------------+
|  - Assigned Patient Roster              |
|  - Clinical Activity Feed               |
+-----------------------------------------+
```

### 2.1 Role-Based Access Control (RBAC)
- All doctor routes are protected at the server route level (`authorize(['DOCTOR'])`) and at the client layout level (`<ProtectedRoute allowedRoles={['DOCTOR']} redirectUnauth>`).
- Cross-role requests (e.g. from `PATIENT`, `PHARMACIST`, or unauthenticated callers) are blocked with `401 Unauthorized` or `403 Forbidden`.

### 2.2 Patient Boundary & Consent Scoping
- In strict adherence to DPDP Act 2023 principles, doctors **cannot** query arbitrary patient records.
- The `getAssignedPatients` service strictly derives the doctor's accessible roster from:
  1. Active and past appointments booked with the doctor.
  2. Clinical encounters attended with the doctor.
  3. Digital consent artifacts granted to the doctor via ABDM Consent Manager.

### 2.3 Credential Immutability
- Regulated medical credentials—such as the Medical Council of India / National Medical Commission registration number (`registrationNumber`), degree qualifications (`qualifications`), board-certified specializations (`specialization`), and primary affiliated hospital (`primaryFacilityId`)—are **protected and read-only**.
- Permitted updates are scoped to practice preferences:
  - Clinical Bio
  - Spoken Languages
  - Consultation Fee (₹ INR)
  - Consultation Modes (`IN_PERSON`, `TELECONSULTATION`)
  - Weekly Working Days & Daily Hours

---

## 3. Endpoints & API Contracts

All endpoints are registered under `/api/v1/doctors`:

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/me`, `/profile` | DOCTOR | Retrieve complete authenticated doctor profile & credentials |
| `PATCH` | `/me`, `/profile` | DOCTOR | Update permitted practice information (bio, fee, hours, languages) |
| `GET` | `/dashboard/summary` | DOCTOR | Aggregate clinical metrics, today's consults, upcoming & activity feed |
| `GET` | `/appointments/today` | DOCTOR | Today's consultations with status filters (`ALL`, `UPCOMING`, `COMPLETED`, `CANCELLED`) |
| `GET` | `/appointments/upcoming`| DOCTOR | Chronological upcoming consultations list |
| `GET` | `/patients` | DOCTOR | Assigned and authorized patient roster |
| `GET` | `/schedule` | DOCTOR | Working hours, days, slot durations and blocked periods |

---

## 4. Frontend Component Hierarchy

```
apps/web/src/
├── app/(dashboard)/doctor/
│   ├── layout.tsx                     # Protected layout: DoctorSidebar + DoctorTopbar + Footer
│   ├── dashboard/page.tsx             # Clinical Workspace: Welcome, Profile, Stats, Today, Activity
│   ├── profile/page.tsx               # Professional Profile: Protected Credentials + Practice Form
│   ├── appointments/page.tsx          # Consultations Schedule: Today vs Upcoming + Status Filters
│   ├── patients/page.tsx              # Authorized Patient Roster with ABDM compliance notice
│   ├── schedule/page.tsx              # Weekly Matrix, Working Hours & Blocked Slots Foundation
│   ├── encounters/page.tsx            # Clinical Encounters & EMR placeholder
│   ├── prescriptions/page.tsx         # Digital Prescriptions & Rx Repository placeholder
│   └── settings/page.tsx              # Practice & Account Security Settings
│
├── components/doctor/
│   ├── DoctorSidebar.tsx              # Collapsible navigation drawer with doctor identity
│   ├── DoctorTopbar.tsx               # Breadcrumbs, quick search, notifications, theme toggle
│   ├── DoctorWelcome.tsx              # Personalized greeting, active clinic & CTA buttons
│   ├── DoctorProfileCard.tsx          # Clinician badges, registration, qualifications & fee
│   ├── ClinicalStatCard.tsx           # 5-card metrics with healthcare styling & routing
│   ├── TodaysAppointments.tsx         # Filterable real-time appointment roster
│   ├── UpcomingAppointments.tsx       # Next 7-day scheduled consultations
│   ├── AssignedPatients.tsx           # Compact authorized patient roster with visit dates
│   ├── ClinicalActivity.tsx           # Clinical event timeline & audit trail
│   ├── DoctorDashboardSkeleton.tsx    # High-fidelity loading skeleton
│   ├── DoctorEmptyState.tsx           # Accessible empty state with clinical messaging
│   └── index.ts                       # Public component exports
│
└── features/doctor/
    ├── api/doctor-api.ts              # Axios client wrapper for all doctor endpoints
    └── hooks/use-doctor.ts            # TanStack React Query hooks with cache invalidation
```

---

## 5. Quality & Compliance Verification

- **TypeScript Typecheck:** 0 errors across monorepo (`packages/shared-types`, `packages/validation`, `apps/api`, `apps/web`).
- **ESLint:** 0 warnings or errors across all workspace packages.
- **Next.js Production Build:** All 40 routes statically generated and optimized.
- **DPDP Act & ABDM Alignment:** Scoped patient lookup, immutable medical registration credentials, and non-blocking clinical audit logging.

