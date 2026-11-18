# HealthBridge India — Synchronous Consent Revocation Handling (Day 8 Task 03)

## 1. Zero-Delay Security Invariant

**Consent revocation NEVER depends on an asynchronous event worker to take effect.**

When a patient revokes consent (`ConsentService.revokeConsent`):
1. The `ConsentRequest` and all linked `ConsentArtifact` documents are persisted as `REVOKED` synchronously in MongoDB.
2. `consentEnforcementService.invalidateConsentImmediately(patientId, requesterId, consentId)` records an immediate synchronous revocation barrier BEFORE returning to the caller.
3. `consentEnforcementService.validateAccess(...)` evaluates the synchronous revocation barrier BEFORE reading any artifact or cache, and otherwise queries live MongoDB consent state (fail-closed). Stale caches can NEVER grant access after revocation.
4. ONLY AFTER synchronous persistence + immediate invalidation completes, `CONSENT_REVOKED` is published to the durable outbox for asynchronous notifications, timeline projection, and compliance audit recording.

## 2. Sequence Diagram — Consent Revocation

```mermaid
sequenceDiagram
    autonumber
    participant Patient as Patient Portal
    participant ConsentSvc as ConsentService
    participant Mongo as MongoDB (Consent Models)
    participant Barrier as ConsentEnforcementService
    participant Outbox as OutboxEventModel
    participant Doctor as Doctor Access Attempt
    participant Worker as EventWorkerProcessor

    Patient->>ConsentSvc: POST /api/v1/consent/:id/revoke
    ConsentSvc->>Mongo: Synchronously persist ConsentRequest & ConsentArtifact = REVOKED
    ConsentSvc->>Barrier: invalidateConsentImmediately(patientId, doctorId, consentId)
    ConsentSvc->>Outbox: Publish Signed CONSENT_REVOKED Event (revokedSynchronously=true)
    ConsentSvc-->>Patient: 200 OK (Consent Revoked)

    Note over Doctor,Barrier: Even if EventWorkerProcessor is offline or delayed...
    Doctor->>Barrier: validateAccess(doctorId, patientId, LAB_REPORTS)
    Barrier-->>Doctor: 403 DENIED immediately (DATA_ACCESS_DENIED_REVOKED_IMMEDIATE)

    Worker->>Outbox: Claim & Process CONSENT_REVOKED asynchronously
    Worker->>Patient: Timeline Entry + Privacy-Safe Revocation Notice + AuditLog
```
