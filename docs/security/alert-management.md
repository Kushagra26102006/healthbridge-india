# HealthBridge India — Security Alert Management (Day 9 Task 04)

**API:** `GET/PATCH /api/v1/admin/security/alerts`, `GET /api/v1/admin/security/alerts/:id`  
**Console:** `/admin/security/alerts`

---

## 1. Deduplication, Grouping & Lifecycle

- **Fingerprint Deduplication:** Every alert is keyed by `${ruleId}:${groupBy}:${groupKeyValue}`. Repeated triggers against an existing `OPEN`, `ACKNOWLEDGED`, or `INVESTIGATING` alert increment `occurrenceCount`, update `lastDetectedAt`, and append related event IDs rather than creating duplicate alert storms.
- **Statuses:** `OPEN` -> `ACKNOWLEDGED` -> `INVESTIGATING` -> `RESOLVED` | `FALSE_POSITIVE` -> `CLOSED`.
- **Mandatory Resolution Notes:** Transitioning an alert to `RESOLVED` or `FALSE_POSITIVE` requires `resolutionNotes` (>= 5 characters, enforced by `alertUpdateSchema` Zod validation -> `422` otherwise).
- **Immutable Audit Trail:** Every alert update appends to `alert.auditHistory` and emits `SECURITY_ALERT_UPDATED` via `securityAuditMonitor`.
- **Privacy-Safe Escalation:** `CRITICAL` and `HIGH` alerts notify only server-derived `AdminProfile` holders carrying `SECURITY_ALERTS_READ` via neutral in-app `NotificationModel` alerts (zero sensitive evidence sent over email/SMS).
