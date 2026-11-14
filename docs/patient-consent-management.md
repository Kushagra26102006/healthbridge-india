# HealthBridge India — Patient Consent Management & Access Control

## 1. Architectural Overview

The **Patient Consent Management & Access Control** module provides a zero-trust, patient-sovereign digital authorization engine built in accordance with the **Ayushman Bharat Digital Mission (ABDM)** and the **Digital Personal Data Protection (DPDP) Act**. 

In modern Indian healthcare, no doctor, hospital, diagnostic laboratory, or pharmacy may access a patient's protected health records without explicit, purpose-bounded, time-limited, and category-restricted digital consent.

### Core Architectural Pillars
- **Zero-Trust Access Gate**: Providers cannot access protected health data merely by possessing a patient identifier (`patientId` or `abhaNumber`). Every patient-data endpoint enforces electronic consent on the server.
- **Fail-Closed Authorization**: If a valid, active, non-expired, non-revoked consent artifact containing the requested data category is not present in the database, the access request is immediately blocked with `403 Forbidden`.
- **Granular Scoping**: Consent is issued for specific data categories (`MEDICAL_RECORDS`, `PRESCRIPTIONS`, `LAB_REPORTS`, `DIAGNOSTIC_REPORTS`, `ENCOUNTER_INFO`) and specific ABDM purpose codes (`CAREMGT`, `BTG`, `PUBHLTH`, `HPAYMT`, `DSRCH`, `PATRQT`).
- **Immediate Prospective Revocation**: Patients can terminate active permissions at any time. Revocation takes effect instantaneously across all API endpoints.
- **Immutable Audit Trail**: Every access request, patient approval, denial, revocation, and data read is recorded in an immutable append-only audit ledger (`AuditLogModel`).

---

## 2. Consent Lifecycle & State Machine

```
                           ┌──────────────────────────┐
                           │   Healthcare Provider    │
                           │   Initiates Requisition  │
                           └────────────┬─────────────┘
                                        │
                                        ▼
                             [Status: PENDING]
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
            Patient Approves                        Patient Rejects
                    │                                       │
                    ▼                                       ▼
           [Status: APPROVED]                      [Status: REJECTED]
                    │                                (Terminal State)
         Issues ConsentArtifact
                    │
         ┌──────────┴──────────┐
         │                     │
    Time Expires        Patient Revokes
         │                     │
         ▼                     ▼
 [Status: EXPIRED]     [Status: REVOKED]
 (Terminal State)      (Terminal State)
```

### State Definitions
1. **`PENDING`**: Request submitted by provider; awaiting patient review.
2. **`APPROVED`**: Explicitly authorized by patient; creates an active `ConsentArtifact` with digital signature.
3. **`REJECTED`**: Explicitly declined by patient with optional clinical or privacy reason.
4. **`REVOKED`**: Terminated by patient before normal expiry; halts all prospective access immediately.
5. **`EXPIRED`**: Validity window (`expiresAt`) elapsed; automatically invalidates provider access.

---

## 3. Database Schema & Models

### 3.1 Consent Request (`ConsentRequestModel`)
Defined in `apps/api/src/modules/consent/models/consent-request.model.ts`:

```typescript
const ConsentRequestSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterName: { type: String, trim: true },
  requesterRole: { type: String, default: 'DOCTOR' },
  organization: { type: String, required: true },
  facilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
  purpose: { type: String, required: true, index: true },
  purposeDescription: { type: String },
  requestedDataTypes: { type: [String], required: true },
  dateRange: {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  revokedAt: { type: Date },
  rejectionReason: { type: String },
  revocationReason: { type: String },
  signature: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED'],
    default: 'PENDING',
    index: true,
  },
  expiresAt: { type: Date, required: true, index: true },
  auditId: { type: Schema.Types.ObjectId, ref: 'AuditLog' },
}, { timestamps: true });

// Compound Indexes
ConsentRequestSchema.index({ patientId: 1, status: 1, expiresAt: 1 });
ConsentRequestSchema.index({ requesterId: 1, status: 1 });
ConsentRequestSchema.index({ patientId: 1, requestedAt: -1 });
```

### 3.2 Consent Artifact (`ConsentArtifactModel`)
Defined in `apps/api/src/modules/consent/models/consent-artifact.model.ts`:

```typescript
const ConsentArtifactSchema = new Schema({
  consentRequestId: { type: Schema.Types.ObjectId, ref: 'ConsentRequest', index: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterName: { type: String },
  organization: { type: String },
  purpose: { type: String, required: true },
  permittedDataTypes: { type: [String], required: true },
  validityPeriod: {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  consentStatus: {
    type: String,
    enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
    default: 'ACTIVE',
    index: true,
  },
  approvedAt: { type: Date, default: Date.now, required: true },
  revokedAt: { type: Date },
  revocationReason: { type: String },
  signature: { type: String },
}, { timestamps: true });

ConsentArtifactSchema.index({
  patientId: 1,
  requesterId: 1,
  consentStatus: 1,
  'validityPeriod.to': 1,
});
```

---

## 4. Centralized Consent Enforcement Service

The backend enforcement service (`ConsentEnforcementService`) is mounted at `apps/api/src/modules/consent/services/consent-enforcement.service.ts`:

```typescript
class ConsentEnforcementService {
  async validateAccess(options: {
    requesterId: string;
    requesterRole: string;
    patientId: string;
    dataCategory: string;
    purpose?: string;
    requestId?: string;
  }): Promise<{ authorized: boolean; reason?: string; consentArtifactId?: string }>;
}
```

### Authorization Rules
1. **Self Access**: If `requesterId === patientId`, access is granted unconditionally.
2. **System Administration**: If `requesterRole === 'ADMIN'`, access is granted under compliance audit.
3. **Healthcare Providers (`DOCTOR`, `PHARMACY`, `LABORATORY`)**:
   - Locates `ConsentArtifactModel` or active `ConsentRequestModel`.
   - Rejects if status is `REVOKED` (`403 Forbidden`).
   - Rejects if status is `REJECTED` (`403 Forbidden`).
   - Rejects if `now > validityPeriod.to` (`403 Forbidden`).
   - Rejects if `now < validityPeriod.from` (`403 Forbidden`).
   - Rejects if requested `dataCategory` is not in `permittedDataTypes` (`403 Forbidden`).
   - If all conditions match: logs `DATA_ACCESSED_UNDER_CONSENT` in `AuditLog` and grants access.

---

## 5. API Endpoints Specification

All endpoints are registered under both `/api/v1/consent` and `/api/v1/consents`:

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/consent` | JWT Bearer | `PATIENT` | Paginated permissions and requests with status & search filters |
| `GET` | `/api/v1/consent/summary` | JWT Bearer | `PATIENT` | Aggregate KPI counts: pending, active, expiring soon, revoked |
| `GET` | `/api/v1/consent/requests` | JWT Bearer | `PATIENT` | Incoming pending access requests awaiting patient decision |
| `GET` | `/api/v1/consent/active` | JWT Bearer | `PATIENT` | Currently active approved permissions |
| `GET` | `/api/v1/consent/history` | JWT Bearer | `PATIENT` | Chronological audit trail of all consent lifecycle events |
| `GET` | `/api/v1/consent/:consentId` | JWT Bearer | `PATIENT` | Complete request detail (enforces patient ownership check) |
| `POST` | `/api/v1/consent/:consentId/approve` | JWT Bearer | `PATIENT` | Approves pending request, creates `ConsentArtifact`, records audit |
| `POST` | `/api/v1/consent/:consentId/reject` | JWT Bearer | `PATIENT` | Rejects pending request with optional reason |
| `POST` | `/api/v1/consent/:consentId/revoke` | JWT Bearer | `PATIENT` | Revokes active permission, updates artifact, halts future queries |

---

## 6. Frontend Pages & Reusable Components

The frontend is implemented under `apps/web/src/app/(dashboard)/patient/consent/` and `apps/web/src/components/patient/consent/`:

1. **Dashboard Overview (`/patient/consent`)**:
   - `ConsentHeader`: Action pills linking to incoming requests and audit history.
   - `ConsentSummary`: KPI cards for Pending, Active, Expiring Soon, and Revoked.
   - Pending Requests banner with direct call to action.
   - `ActiveConsentList`: Card view of active providers with expiration trackers and immediate revocation buttons.
2. **Incoming Requests (`/patient/consent/requests`)**:
   - Filter bar and search input.
   - `ConsentRequestList`: Review, quick approve, and quick reject triggers.
3. **Consent Details (`/patient/consent/[consentId]`)**:
   - `ConsentDetails`: Requester verification badges, purpose breakdown, date ranges, and category scope pills.
   - Explicit confirmation dialogs (`ConsentApprovalDialog`, `ConsentRejectionDialog`, `ConsentRevocationDialog`).
4. **Audit History (`/patient/consent/history`)**:
   - `ConsentHistoryTimeline`: Chronological visual ledger of consent lifecycle transitions.

---

## 7. Security Testing & Verification

The automated integration test suite in `apps/api/tests/integration/consent.test.ts` verifies:
- **Authentication**: Unauthenticated calls fail with `401 UNAUTHORIZED`.
- **Role Isolation**: Non-patient roles attempting to manage patient consent fail with `403 FORBIDDEN`.
- **IDOR Prevention**: Patient B attempting to access Patient A's consent request fails with `403 FORBIDDEN`.
- **State Integrity**:
  - Approving a request transitions state to `APPROVED` and generates a valid `ConsentArtifact`.
  - Cannot approve an already approved request (`400 Bad Request`).
  - Cannot approve an expired request (`400 Bad Request`).
  - Rejecting a request transitions state to `REJECTED`.
  - Revoking an active permission transitions state to `REVOKED` and updates the artifact.
- **Fail-Closed Centralized Enforcement**:
  - Doctor with no consent accessing patient data fails with `403 FORBIDDEN`.
  - Doctor accessing patient data after revocation fails with `403 FORBIDDEN`.
  - Doctor accessing patient data after expiration fails with `403 FORBIDDEN`.
  - Doctor with consent for `LAB_REPORTS` attempting to access `MEDICAL_RECORDS` fails with `403 FORBIDDEN`.
  - Doctor with active valid consent for `MEDICAL_RECORDS` succeeds.

---

## 8. Known Limitations & DPDP Boundaries

1. **Prospective Enforcement Only**:
   Revoking consent stops prospective queries from the revocation moment onward. In accordance with clinical law, it does not erase physical or medical records lawfully created by healthcare professionals during past consultations.
2. **Break-the-Glass (BTG) Emergency Mode**:
   Emergency override under `purpose = 'BTG'` requires hospital super-admin credentials and triggers automated immediate notifications to the patient and national audit authority.
