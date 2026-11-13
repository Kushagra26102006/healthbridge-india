# HealthBridge India — Patient Appointment Booking & Scheduling Architecture

## 1. Architectural Overview

The Patient Appointment Booking & Management System delivers an end-to-end clinical scheduling workflow connecting authenticated patients with verified medical practitioners across India's ABHA/ABDM healthcare network.

The system is designed with:
- **Zero Trust Security & Strict Ownership**: Patient identity is strictly derived from the server-side JWT session (`req.user.userId`). Patients cannot view, modify, or cancel appointments belonging to other individuals (enforced with `403 Forbidden`).
- **Atomic Concurrency & Double-Booking Prevention**: MongoDB partial unique indexing guarantees that no two active appointments (`REQUESTED` or `CONFIRMED`) can ever occupy the exact same time slot for a doctor.
- **Real-Time Slot Engine**: Clinic hours (09:00 to 17:00 IST) are partitioned into discrete 30-minute consultation windows, cross-checked in real-time against doctor schedules.
- **7-Step Guided Booking Wizard**: Smooth, accessible multi-step booking experience with instant validation, consultation mode selection (`IN_PERSON` vs `TELECONSULTATION`), and graceful 409 conflict recovery.

---

## 2. API Endpoints Specification

### 2.1 Doctor Discovery & Availability

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/doctors` | JWT Bearer | `PATIENT`, `DOCTOR`, `ADMIN` | Search & filter verified practitioners by specialization, hospital, or city |
| `GET` | `/api/v1/doctors/:doctorId` | JWT Bearer | `PATIENT`, `DOCTOR`, `ADMIN` | Fetch verified doctor public profile with qualifications & facility |
| `GET` | `/api/v1/doctors/:doctorId/availability?date=YYYY-MM-DD` | JWT Bearer | `PATIENT`, `DOCTOR`, `ADMIN` | Query real-time time slots for a specified date (IST/UTC) |

### 2.2 Appointment Lifecycle & Operations

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/appointments` | JWT Bearer | `PATIENT` | Paginated list of appointments for the authenticated patient |
| `POST` | `/api/v1/appointments` | JWT Bearer | `PATIENT` | Book new consultation slot with atomic concurrency protection |
| `GET` | `/api/v1/appointments/:appointmentId` | JWT Bearer | `PATIENT` | Retrieve appointment details (strictly verified patient ownership) |
| `PATCH` | `/api/v1/appointments/:appointmentId/cancel` | JWT Bearer | `PATIENT` | Cancel upcoming appointment with reason & release slot |
| `PATCH` | `/api/v1/appointments/:appointmentId/reschedule` | JWT Bearer | `PATIENT` | Reschedule appointment to a free future slot |

---

## 3. Concurrency Protection & Double-Booking Prevention

### 3.1 MongoDB Partial Unique Index
To eliminate race conditions when two patients simultaneously attempt to reserve the same doctor slot:

```typescript
AppointmentSchema.index(
  { doctorId: 1, scheduledAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['REQUESTED', 'CONFIRMED'] },
    },
  }
);
```

- When an active appointment exists for a doctor at a given `scheduledAt` UTC timestamp, any concurrent insert triggers MongoDB code `11000 Duplicate Key Error`.
- The Express service catches error code 11000 and transforms it into a structured HTTP `409 Conflict` response with error code `CONFLICT`.
- The Next.js frontend catches the 409 status and renders a dedicated conflict state, prompting the patient to select another available slot without losing their reason or notes.

### 3.2 Timezone & Schedule Storage
- **Storage Standard**: All timestamps are persisted in MongoDB as UTC ISO 8601 Date objects.
- **Presentation Standard**: Converted to Indian Standard Time (IST, UTC+5:30) for clinic hours (09:00 - 17:00 IST) and localized using `toLocaleDateString('en-IN')`.

---

## 4. Frontend Component Hierarchy & Routes

```
apps/web/src/
├── app/(dashboard)/patient/
│   ├── doctors/
│   │   ├── page.tsx                     # Doctor Discovery directory
│   │   └── [doctorId]/page.tsx          # Comprehensive Doctor Profile
│   └── appointments/
│       ├── page.tsx                     # Appointments Dashboard (Upcoming, Confirmed, Requested)
│       ├── book/page.tsx                # Guided 7-Step Booking Wizard
│       ├── [appointmentId]/page.tsx     # Full Appointment Details
│       └── history/page.tsx             # Past Consultation History
│
└── components/patient/appointments/
    ├── DoctorSearch.tsx                 # Debounced specialist query input
    ├── DoctorFilters.tsx                # Specialization, consultation mode & city filters
    ├── DoctorCard.tsx                   # Specialist card with verification badge
    ├── DoctorProfile.tsx                # Doctor header, credentials & inline slot booking
    ├── AppointmentCalendar.tsx          # 14-day interactive date selector
    ├── TimeSlotSelector.tsx             # Morning, Afternoon & Evening slot selector
    ├── BookingSummary.tsx               # Review & policy agreement card
    ├── AppointmentBookingWizard.tsx     # 7-step guided booking wizard
    ├── AppointmentCard.tsx              # Appointment card with status & actions
    ├── AppointmentDetails.tsx           # Comprehensive appointment view
    ├── CancelAppointmentDialog.tsx      # Cancellation dialog with policy notice
    ├── RescheduleAppointmentDialog.tsx  # Rescheduling dialog with slot picker
    ├── AppointmentSkeleton.tsx          # Accessible loading states
    ├── AppointmentEmptyState.tsx        # Empty state with CTAs
    └── index.ts                         # Component barrel
```

---

## 5. Security & Isolation Matrix

| Layer | Enforcement Mechanism | Failure Response |
|---|---|---|
| **Route Protection** | `authenticate` + `authorize(['PATIENT'])` | `401 Unauthorized` / `403 Forbidden` |
| **Patient Identity** | Server-side `req.user.userId` binding | Client `patientId` ignored if passed |
| **Object Isolation** | `appointment.patientId.toString() === req.user.userId` | `403 Forbidden` |
| **Past Slot Booking** | `new Date(scheduledAt) <= new Date()` | `422 Unprocessable Entity` |
| **Cancellation Policy** | Cannot cancel past or completed appointments | `400 Bad Request` |
| **Double Booking** | Atomic query check + partial unique index | `409 Conflict` |

---

## 6. Automated Test Verification

Integration tests in `apps/api/tests/integration/appointments.test.ts` verify all 11 critical paths:
1. `GET /api/v1/doctors` rejects unauthenticated requests with `401 UNAUTHORIZED`.
2. `GET /api/v1/doctors?specialization=Cardiology` filters verified doctors.
3. `GET /api/v1/doctors/:doctorId` returns doctor profile by ID.
4. `GET /api/v1/doctors/:doctorId/availability?date=...` returns real-time slot array.
5. `POST /api/v1/appointments` books a valid future slot.
6. `POST /api/v1/appointments` rejects past scheduledAt timestamps with `422 VALIDATION_ERROR`.
7. `POST /api/v1/appointments` returns `409 CONFLICT` when slot is already reserved.
8. `GET /api/v1/appointments/:appointmentId` strictly forbids Patient A from viewing Patient B's appointment (`403 FORBIDDEN`).
9. `PATCH /api/v1/appointments/:appointmentId/cancel` strictly forbids Patient A from cancelling Patient B's appointment (`403 FORBIDDEN`).
10. `PATCH /api/v1/appointments/:appointmentId/cancel` cancels own appointment with valid reason.
11. `PATCH /api/v1/appointments/:appointmentId/reschedule` reschedules to a free future slot.

