# HealthBridge India — Consent & Authorized Access Workflow E2E Documentation (Day 8 Task 05)

## Workflow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Doctor as Doctor / Provider
    participant Patient as Patient Consent Portal
    participant ConsentSvc as ConsentService
    participant Enforce as ConsentEnforcementService
    participant Outbox as OutboxEventModel

    Doctor->>Patient: Consent Request Created (Scoped Categories + Validity Window)
    Patient->>ConsentSvc: POST /api/v1/consent/:id/approve (or /reject)
    ConsentSvc->>Enforce: Active ConsentArtifact Created (Scoped Categories Only)
    Doctor->>Enforce: validateAccess(doctorId, patientId, PRESCRIPTIONS) -> AUTHORIZED
    Doctor->>Enforce: validateAccess(doctorId, patientId, UNGRANTED_CATEGORY) -> DENIED
    Patient->>ConsentSvc: POST /api/v1/consent/:id/revoke
    ConsentSvc->>Enforce: Synchronous invalidateConsentImmediately(patientId, doctorId, consentId)
    ConsentSvc->>Outbox: Publish CONSENT_REVOKED (async notifications & audit)
    Doctor->>Enforce: Subsequent Access Attempt -> IMMEDIATELY DENIED (even if worker offline)
```

## Role-Specific Access Validation
- **Doctor:** Requires active appointment, clinical encounter, or non-expired, non-revoked consent matching the requested data category.
- **Pharmacy:** Strictly scoped to issued prescriptions eligible for dispensing and pharmacy-owned orders/inventory; never granted general clinical histories.
- **Laboratory:** Strictly scoped to assigned laboratory orders, samples, and laboratory-owned reports; never granted unrestricted clinical records.
- **Patient:** Full self-access derived strictly from JWT `req.user.userId`; sole authority to approve, reject, or revoke consents.
