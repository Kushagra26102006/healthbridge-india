# Unified Doctor Patient Clinical Workspace (Day 8 Task 01)

> **Backend Service:** `apps/api/src/modules/platform/services/doctor-workspace.service.ts`  
> **Endpoint:** `GET /api/v1/platform/doctor/patients/:patientId/overview`  
> **Frontend Page:** `/doctor/patients/[patientId]/overview` (`apps/web/src/app/(dashboard)/doctor/patients/[patientId]/overview/page.tsx`)

## 1. Authorization & Read-Only Clinical Boundaries
- **Fail-Closed Access Check:** Doctor must hold either an active internal/ABDM consent OR a verified appointment/encounter relationship with the patient (`403 Forbidden` otherwise).
- **Consolidated Sections:** Patient Identity & external ABHA badge, Consent & Access Policy status, Appointments, Clinical Encounters, Issued Prescriptions with live Pharmacy Dispensing status, Consolidated Medication History, Published/Amended Laboratory Reports (`currentVersion` & amendment badge), Medical Documents, and Authorized ABDM External Imported Records.
- **Strict Immutability:** Laboratory reports, pharmacy dispensing records, and external ABDM records carry `readOnly: true` and expose zero doctor edit/delete endpoints. Zero AI-generated diagnoses or clinical interpretations are synthesized.
- **Note on Dynamic Route Segment:** Uses `[patientId]` to align with the existing Next.js App Router dynamic segment under `apps/web/src/app/(dashboard)/doctor/patients/[patientId]/`.
