# HealthBridge India — Patient Data Correction & Clinical Amendment Workflow (Day 9 Task 02)

**Endpoints:**
- `POST /api/v1/patient/privacy/correction-requests` (Patient)
- `GET /api/v1/patient/privacy/correction-requests` (Patient)
- `PATCH /api/v1/admin/privacy/requests/:id/review` (Authorized Privacy Admin)

**Frontend UI:** `/patient/privacy` ("Request Correction" tab) & `/admin/privacy-requests`

---

## 1. Clinical Record Integrity Rule

**Patients MUST NEVER directly overwrite finalized clinical records** (`MEDICAL_RECORD`, `PRESCRIPTION`, `LAB_REPORT`).

1. When a patient submits a correction targeting a finalized clinical resource, `PrivacyGovernanceService.createCorrectionRequest(...)` automatically flags `isFinalizedClinicalRecord: true`, preserves `originalValueSnapshot`, and routes the request (`status: 'SUBMITTED'`) for authorized review and formal clinical amendment (`appliedAmendmentReference`).
2. Personal profile corrections (`PATIENT_PROFILE`, `ABHA_MAPPING`, `APPOINTMENT`) follow the same auditable state machine (`SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` / `REJECTED` -> `COMPLETED` / `WITHDRAWN`), preserving full `reviewHistory`.
3. Every submission and decision emits an audit record (`DATA_CORRECTION_REQUESTED`, `PRIVACY_REQUEST_REVIEWED`) and sends a neutral privacy-safe notification to the patient.
