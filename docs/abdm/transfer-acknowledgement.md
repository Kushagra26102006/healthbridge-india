# ABDM Health Information Transfer Acknowledgements

> **Service:** `apps/api/src/modules/abdm/services/abdm-transfer-acknowledgement.service.ts`  
> **Model:** `AbdmTransferAcknowledgementModel` (`abdm_transfer_acknowledgements`)

## 1. Official ABDM V3 Notification & Acknowledgement Mapping
- **Outbound Endpoint:** `POST /api/hiecm/data-flow/v3/health-information/notify`
- **Inbound Webhook:** `POST /api/v1/abdm/webhooks/hie/acknowledgement` (authenticated + ±5-minute replay window)

| Official ABDM `sessionStatus` | Internal Transfer State | Per-Care-Context `hiStatus` |
|---|---|---|
| `REQUESTED` | `REQUEST_SUBMITTED` | — |
| `ACKNOWLEDGED` | `TRANSFER_PENDING` | — |
| `RECEIVED` | `TRANSFER_RECEIVED` | `OK` / `DELIVERED` |
| `TRANSFERRED` | `COMPLETED` | `OK` / `DELIVERED` |
| `PARTIAL_TRANSFERRED` | `REQUIRES_REVIEW` | Mix of `OK` / `ERRORED` |
| `EXPIRED` | `EXPIRED` | `ERRORED` |
| `FAILED` | `FAILED` | `ERRORED` |

## 2. Idempotency & Immutability
- Unique compound index `{ acknowledgementRef, externalTransactionId, ackType }` guarantees duplicate deliveries return `duplicate: true` without re-mutating transfer state or duplicating records.
- Completed/cancelled/expired transfers are never overwritten by late acknowledgements.
