# ABDM Health Information Request & State Machine Workflow

> **Services:** `AbdmHipService`, `AbdmHiuService`, `AbdmHealthInformationTransferService`  
> **Models:** `AbdmHealthInformationRequestModel`, `AbdmHealthInformationTransferModel`

## 1. Verified ABDM V3 Data-Flow Endpoints
- **HIU -> Gateway:** `POST /api/hiecm/data-flow/v3/health-information/request` (`202 Accepted`)
- **Gateway -> HIP:** `POST /api/v3/hip/health-information/request`
- **HIP -> Gateway Ack:** `POST /api/hiecm/data-flow/v3/health-information/hip/on-request` (`ACKNOWLEDGED`)
- **HIP -> HIU Direct Push:** `POST <dataPushUrl>` (`pageNumber`, `pageCount`, `transactionId`, `entries[]`, `keyMaterial`)
- **HIP / HIU -> Gateway Notify:** `POST /api/hiecm/data-flow/v3/health-information/notify`

## 2. Explicit 15-State Transfer State Machine
Implemented in `AbdmHealthInformationTransferService`:
- **States:** `DRAFT`, `DISCOVERY_PENDING`, `DISCOVERY_COMPLETED`, `LINKING_PENDING`, `CONSENT_PENDING`, `AUTHORIZED`, `REQUEST_SUBMITTED`, `TRANSFER_PENDING`, `TRANSFER_RECEIVED`, `VALIDATION_PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `EXPIRED`, `REQUIRES_REVIEW`.
- **Monotonic Terminal Protection:** `COMPLETED`, `CANCELLED`, and `EXPIRED` are terminal — any attempt to overwrite them throws `409 ABDM_INVALID_STATE_TRANSITION`.
- **Out-of-Order & Duplicate Handling:** Same-state events or callbacks older than `lastEventTimestamp` are ignored idempotently without mutating state.
- **Auditability:** Every valid transition appends `{ fromState, toState, externalStatus, source, reason, correlationId, occurredAt }` to `stateHistory[]`.
