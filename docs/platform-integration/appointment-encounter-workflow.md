# Appointment-to-Encounter Cross-Module Workflow (Day 8 Task 01)

> **Services:** `AppointmentService`, `DoctorAppointmentService`, `DoctorEncounterService`  
> **Models:** `AppointmentModel`, `EncounterModel`

## 1. Integrated Flow & Duplicate Prevention
1. Patient books an appointment (`REQUESTED` / `SCHEDULED`), Doctor confirms (`CONFIRMED`).
2. Doctor starts an encounter via `POST /api/v1/doctors/encounters` referencing `appointmentId`.
3. **Day 8 Duplicate Encounter Guard:**
   - Application layer (`doctor-encounter.service.ts`): Rejects creating a second encounter when `appointment.encounterId` is already set (`409 CONFLICT`).
   - Database layer (`encounter.model.ts`): Enforces a partial unique index on `{ appointmentId: 1 }` across active/completed statuses (`PLANNED | IN_PROGRESS | COMPLETED | FINALIZED`).
4. Appointment transitions atomically to `IN_PROGRESS` with `encounterId` linked; finalizing the encounter locks notes, enables follow-up prescriptions/lab orders, and records immutable `AuditLogModel` history.
