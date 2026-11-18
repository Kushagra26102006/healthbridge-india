# ABDM Callback & Event Reliability Audit Report (Day 7 Task 05)

> **Audit Date:** 2026-11-18  
> **Audited Webhook Endpoints (6 Total):**
> 1. `POST /api/v1/abdm/webhooks/callback`
> 2. `POST /api/v1/abdm/webhooks/consent/:callbackType`
> 3. `POST /api/v1/abdm/webhooks/hie/discovery`
> 4. `POST /api/v1/abdm/webhooks/hip/health-information/request`
> 5. `POST /api/v1/abdm/webhooks/hiu/data-push`
> 6. `POST /api/v1/abdm/webhooks/hie/acknowledgement`

## Reliability & Ordering Controls Verified

| Control | Implementation | Verified in Tests |
|---|---|---|
| **Auth Before Validation** | HMAC-SHA256 (`x-abdm-signature`) or constant-time `x-abdm-webhook-secret` checked BEFORE Zod parsing (`401` before `422`) on all 6 endpoints. | Yes (`abdm-day7-e2e-audit.test.ts`) |
| **Replay Protection** | ±5-minute ISO timestamp window (`ABDM_REPLAY_DETECTED`, `401`) enforced on all timestamped callbacks. | Yes (`abdm-consent-integration.test.ts`, `abdm-hip-hiu-integration.test.ts`) |
| **Burst Rate Limiting** | Dedicated `abdmWebhookLimiter` (`120 req/min/IP`) on all 6 endpoints. | Yes (`abdm.routes.ts`) |
| **Idempotency & Deduplication** | Compound unique indexes on `AbdmWebhookEventModel`, `AbdmConsentEventModel`, `AbdmTransferAcknowledgementModel`, `AbdmImportedRecordModel`, and `AbdmHealthInformationRequestModel`. | Yes (`abdm-consent-manager.test.ts`, `abdm-hip-hiu.test.ts`, `abdm-hip-hiu-integration.test.ts`) |
| **Out-of-Order & Monotonic Protection** | `lastExternalEventAt` / `lastCallbackAt` / `lastEventTimestamp` prevent stale callbacks from overwriting newer states; terminal states (`REVOKED`, `EXPIRED`, `COMPLETED`, `CANCELLED`) are immutable. | Yes (`abdm-consent-manager.test.ts`, `abdm-hip-hiu.test.ts`) |
| **Correlation & Failure Tracking** | Every outbound request and inbound callback tracks `correlationId`, `externalTransactionId`, failure reasons, and immutable `AuditLogModel` records. | Yes |
| **Outbound Retry Discipline** | `AbdmHttpClient` retries ONLY idempotent requests on `408 | 429 | 502 | 503 | 504` with exponential backoff; non-idempotent POSTs are never blindly retried; direct `dataPushUrl` enforces `AbortController` timeout. | Yes (`abdm-foundation.test.ts`) |
