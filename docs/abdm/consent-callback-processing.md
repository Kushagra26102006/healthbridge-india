# ABDM Consent Callback Processing (Day 7 Task 03)

## 1. Verified Callback Routes

Built on top of the Day 7 Task 01 webhook foundation (`AbdmWebhookService`):

- Unified callback endpoint: `POST /api/v1/abdm/webhooks/callback`
- Dedicated consent callback endpoints: `POST /api/v1/abdm/webhooks/consent/:callbackType`
  - `on-init` → `consent/request/on-init`
  - `on-status` → `consent/request/on-status`
  - `hiu-notify` → `consent/hiu/notify`
  - `hip-notify` → `consent/hip/notify`
  - `on-fetch` → `consent/on-fetch`
  - `revocation-notify` → `consent/revocation/notify`

## 2. Security & Reliability Pipeline

Every inbound callback passes through a mandatory 7-stage pipeline:

1. **Authentication (`verifyCallbackAuthentication`):** Verifies `x-abdm-signature` (HMAC-SHA256 over raw body using `crypto.timingSafeEqual`) or constant-time `x-abdm-webhook-secret`. Rejects unauthenticated or misconfigured requests with HTTP `401`. *(Gateway asymmetric JWKS verification plugs in here during live sandbox bridge onboarding.)*
2. **Replay Protection (`verifyReplayWindow`):** Enforces ±5 minute freshness window on ISO-8601 `timestamp`; older or future-skewed callbacks fail with `401 ABDM_REPLAY_DETECTED`.
3. **Schema Validation:** Validates top-level envelope via `abdmWebhookCallbackSchema` (Zod) and domain payload inside `AbdmConsentLifecycleService.processConsentCallback`.
4. **Idempotency:** Enforces unique `{ requestId, eventType }` in `AbdmWebhookEventModel` and unique `{ eventId, eventType }` in `AbdmConsentEventModel`. Duplicate deliveries return HTTP `202` with `duplicate: true, status: 'DUPLICATE_IGNORED'` without double-applying state transitions.
5. **Transaction & Anti-Forgery Correlation:** Rejects `on-init`, `on-status`, and `hiu/notify` callbacks referencing unknown `correlationId` or unknown `externalRequestId`, logging `ABDM_FORGED_CONSENT_CALLBACK_REJECTED` (`outcome: 'BLOCKED'`) in `AuditLogModel`.
6. **Event Ordering & Anti-Stale-Overwrite:** Compares incoming `eventTimestamp` against persisted `lastExternalEventAt` and blocks non-monotonic regressions (e.g., a delayed `GRANTED` callback cannot overwrite a `REVOKED`, `EXPIRED`, or `DENIED` consent). Ignored stale callbacks are recorded as `STALE_IGNORED`.
7. **Gateway Acknowledgement & Audit:** Sends HIU/HIP `on-notify` acknowledgement where applicable, invalidates authorization caches on `REVOKED`/`EXPIRED`, writes redacted `AuditLogModel` entries, and dispatches privacy-safe in-app notifications.
