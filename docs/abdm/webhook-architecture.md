# ABDM Callback & Webhook Architecture — HealthBridge India

## 1. Asynchronous Gateway Pattern (ABDM V3)
ABDM V3 gateway interactions are inherently asynchronous:
1. HealthBridge dispatches an outbound request with a unique `REQUEST-ID` UUID header and receives a synchronous `202 Accepted`.
2. ABDM Gateway processes the workflow and sends an inbound HTTP `POST` callback (`on-discover`, `on-consent`, `on-fetch`, etc.) containing `requestId` and `resp.requestId` to our registered public HTTPS callback endpoint.

## 2. Implemented Inbound Callback Pipeline (`POST /api/v1/abdm/webhooks/callback`)
Implemented in `apps/api/src/modules/abdm/webhooks/abdm-webhook.service.ts` and `controllers/abdm.controller.ts`:
1. **Schema Validation (`abdmWebhookCallbackSchema`):** Validates `requestId`, ISO-8601 `timestamp`, `eventType`, optional `resp.requestId`, `error`, and `payload` (`422 VALIDATION_ERROR` on malformed payloads).
2. **Caller Authentication (`verifyCallbackAuthentication`):**
   - Supports HMAC-SHA256 verification (`x-abdm-signature: sha256=<hex>`) using `crypto.timingSafeEqual` over the raw body, or constant-time `x-abdm-webhook-secret` header verification against `ABDM_WEBHOOK_SECRET`.
   - Rejects unconfigured/placeholder secrets or mismatched signatures with `401 ABDM_WEBHOOK_UNAUTHORIZED`.
   - *Pending Sandbox Verification:* Once live ABDM V3 gateway callback JWT/JWKS signing public keys are confirmed in the developer portal, gateway JWT signature verification will be added alongside this adapter.
3. **Replay Protection (`verifyReplayWindow`):** Rejects callbacks whose `timestamp` drifts more than ±5 minutes from server time with `401 ABDM_REPLAY_DETECTED`.
4. **Idempotent Duplicate Detection (`AbdmWebhookEventModel`):**
   - Compound unique index `{ requestId: 1, eventType: 1 }` prevents duplicate processing on gateway retries.
   - Duplicate callbacks return `202 Accepted` with `duplicate: true, status: 'DUPLICATE_IGNORED'` without re-executing side effects.
5. **Correlation & Immutable Audit Logging:**
   - Updates `AbdmCorrelationService` status (`COMPLETED` or `FAILED`).
   - Persists sanitized metadata (never raw PHI or tokens) into `AbdmWebhookEventModel` and `AuditLogModel`.
   - Returns documented `202 Accepted` acknowledgement (`AbdmWebhookAckDto`).
