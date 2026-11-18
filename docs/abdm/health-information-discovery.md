# ABDM Health Information Discovery Workflow

> **Primary Service:** `apps/api/src/modules/abdm/services/abdm-health-information-discovery.service.ts`  
> **Model:** `AbdmDiscoveryRequestModel` (`abdm_discovery_requests`)

## 1. Official ABDM V3 Discovery Architecture
In ABDM V3, care-context discovery operates asynchronously:
- **User-Initiated Discovery Ingress (HIP):** `POST /api/v3/hip/patient/care-context/discover` (`202 Accepted`) -> outbound response `POST /api/hiecm/user-initiated-linking/v3/patient/care-context/on-discover`.
- **HealthBridge Discovery Foundation Endpoints:**
  - `POST /api/v1/abdm/hie/discovery` — Initiates discovery for an authenticated patient with a verified `AbhaLinkModel`.
  - `GET /api/v1/abdm/hie/discovery` & `GET /api/v1/abdm/hie/discovery/:id` — Retrieves authorized discovery history and status.
  - `POST /api/v1/abdm/webhooks/hie/discovery` — Processes authenticated, replay-protected discovery callbacks.

## 2. Guarantees & Controls
- **Actor-Derived Patient Ownership:** For `PATIENT` actors, `patientId` is derived from JWT (`req.user.userId`); cross-patient discovery attempts return `403`.
- **Participant Format Validation:** Rejects malformed participant identifiers (`400 ABDM_VALIDATION_ERROR`).
- **Duplicate Prevention:** Supports caller `idempotencyKey` (unique compound partial index `{ patientId, idempotencyKey }`) and rejects concurrent duplicate pending discoveries for the same `(patientId, participantId)` with `409 ABDM_DUPLICATE_RESOURCE`.
- **Idempotent Callbacks:** Terminal discovery states (`DISCOVERY_COMPLETED`, `NO_MATCH_FOUND`, `FAILED`) and stale timestamps are handled idempotently without mutating prior completed results.
- **No Unnecessary Participant Leakage:** Stores only participant reference, display name, requested HI types, care-context references, correlation ID, and timestamps.
