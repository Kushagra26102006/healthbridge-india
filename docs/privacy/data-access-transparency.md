# HealthBridge India — Data Access Transparency Ledger (Day 9 Task 02)

**Model:** `apps/api/src/modules/privacy/models/data-access-event.model.ts` (`DataAccessEventModel`)  
**Patient Endpoint:** `GET /api/v1/patient/privacy/access-history`  
**Patient UI:** `/patient/privacy` ("Data Access History" tab)

---

## 1. Access Transparency Schema

Every meaningful access evaluation through `PurposeBasedAccessService` appends an immutable `DataAccessEvent` capturing:
- `accessEventId` (UUID)
- `patientId`, `actorId`, `actorRole`, `actorName`, `organization`
- `resourceCategory`, `resourceReference`
- `accessPurpose`, `lawfulBasis`
- `authorizationDecision` (`ALLOWED` | `DENIED` — explicitly distinguishes attempted denied access from successful access)
- `consentReference` (when authorized via consent artefact)
- `requestId`, `correlationId`, `timestamp`

---

## 2. Privacy & Security Safeguards

1. **Append-Only Immutability:** Mongoose pre-hooks on `DataAccessEventSchema` throw errors on `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, and `findOneAndDelete`. Ordinary users and services cannot tamper with access history.
2. **Zero Clinical Payloads:** The ledger records *who* accessed *which category* and *why* — never storing diagnoses, prescriptions, lab numeric results, or uploaded file bytes.
3. **Patient-Safe Projection:** `GET /api/v1/patient/privacy/access-history` filters strictly by JWT-derived `req.user.userId` (`patientVisible: true`) and returns a curated patient-facing DTO without exposing internal security investigation telemetry or other patients' events.
4. **Role Isolation:** Only authenticated `PATIENT` actors can call `/api/v1/patient/privacy/access-history` (`403` for other roles); detailed internal security audit logs remain restricted to `ADMIN` via `/api/v1/audit`.
