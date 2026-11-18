# ABDM Consent Revocation, Expiry & Synchronization (Day 7 Task 03)

## 1. Verified Consent Revocation Workflow

Implemented in `AbdmConsentLifecycleService.initiatePatientRevocation` and `POST /api/v1/abdm/consent/artefacts/:id/revoke`:

1. **Patient Identity & Ownership Verification:** Actor is strictly derived from the authenticated JWT (`req.user.userId`). Attempting to revoke another patient's artefact is blocked (`403 Forbidden`) and recorded in `AuditLogModel` (`ABDM_CONSENT_UNAUTHORIZED_REVOCATION_ATTEMPT`).
2. **Official Revocation Adapter Check:**
   - Official HIE-CM revocation (`POST /api/hiecm/gateway/v3/consents/revoke`) requires a registered PHR app role and patient `X-AUTH-TOKEN`.
   - When external confirmation cannot be immediately obtained, HealthBridge marks `revocationStatus = 'PENDING_CONFIRMATION'` and **never falsely claims external revocation succeeded**.
3. **Fail-Closed Safe Policy & Cache Invalidation:**
   - Immediately invalidates cached authorization decisions via `abdmConsentValidationService.invalidateByArtefact(...)`.
   - `validateAbdmConsentAccess` immediately denies external access under any artefact with `revocationStatus === 'PENDING_CONFIRMATION'` (`REVOCATION_PENDING_CONFIRMATION`).
   - Once the official external `REVOKED` callback arrives from HIE-CM, `externalStatus` transitions to `REVOKED`, `revocationStatus` transitions to `CONFIRMED_REVOKED`, cache is invalidated again, and `ABDM_CONSENT_REVOCATION_CONFIRMED` notification is emitted.
4. **Immutable History Preservation:** Revocation NEVER deletes consent requests, artefacts, or lifecycle events. Duplicate revocation requests are handled idempotently.

## 2. Expiry Detection & Status Synchronization Service

Implemented in `AbdmConsentLifecycleService.runExpiryAndStatusSync` (callable safely from any cron/scheduler or manually via `POST /api/v1/abdm/consent/sync` by an `ADMIN` without introducing unnecessary new infrastructure):

- **Local Expiry Detection:**
  - Marks expired pending consent requests (`expiresAt <= now`) as `internalStatus: 'EXPIRED'`, `externalStatus: 'EXPIRED'` while preserving previous status in `statusHistory`.
  - Marks expired artefacts (`expiresAt <= now` or `dataEraseAt <= now`) as `externalStatus: 'EXPIRED'`, `validationStatus: 'EXPIRED'`, invalidates authorization cache, and emits `ABDM_CONSENT_EXPIRED` notification.
- **Nearing-Expiry Notifications:** Detects active artefacts expiring within `nearingExpiryHours` (default 24h) not yet notified (`nearingExpiryNotifiedAt` unset) and emits privacy-safe `ABDM_CONSENT_NEARING_EXPIRY` alerts.
- **External Status Polling:** For active pending requests with `externalRequestId`, invokes `POST /api/hiecm/consent/v3/request/status` where enabled and logs any failures to `AbdmConsentSyncLogModel` + `ABDM_CONSENT_SYNC_FAILED` admin alerts.
- **Out-of-Order & Stale Event Protection:** Both request and artefact documents track `lastExternalEventAt` and enforce monotonic terminal states (`REVOKED`/`EXPIRED`/`DENIED` cannot be overwritten by delayed `REQUESTED` or `GRANTED` events).
