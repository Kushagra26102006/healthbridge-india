# HealthBridge India — Clinical Encounter Workflow E2E Documentation (Day 8 Task 05)

## Workflow Diagram

```mermaid
flowchart LR
    A[Assigned Appointment] --> B[POST /api/v1/doctors/encounters<br/>Ownership + Consent Check]
    B --> C[Unique Appointment Guard<br/>Prevents Duplicate Encounter 409]
    C --> D[Save Draft Notes & Vitals<br/>PATCH /encounters/:id<br/>Optimistic Version Lock 409]
    D --> E[Finalize Encounter<br/>POST /encounters/:id/complete]
    E --> F[Complete Linked Appointment<br/>+ Publish ENCOUNTER_FINALIZED]
    F --> G[Patient Unified Timeline<br/>Finalized Only — Zero Drafts]
```

## Verified Clinical Safety Invariants
- Encounter creation validates doctor ownership and active care relationship/consent (fail-closed `403`).
- Duplicate encounter creation for the same `appointmentId` returns `409 CONFLICT`.
- Optimistic concurrency locking rejects stale draft updates (`409 CONFLICT`).
- Appointment completion NEVER auto-generates clinical diagnoses or consultation text.
- Draft encounters (`isDraft: true`) are strictly excluded from patient timeline projections and patient API responses.
