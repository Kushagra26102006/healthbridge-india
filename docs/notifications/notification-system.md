# HealthBridge India — Notifications & Real-Time Communication Architecture (Phase 14)

> **Scope:** Audited and enhanced the unified, privacy-safe notification and real-time Server-Sent Events (SSE) communication architecture across all 5 HealthBridge India portals (Patient, Doctor, Pharmacy, Laboratory, and Admin) — preserving existing backend models, controllers, routes, RBAC, and SSE transport while completing the reusable 9-component UI suite, adding live privacy-safe toast & screen-reader announcements, and introducing a Notification Detail inspection modal.

---

## 1. Notification Architecture Overview

### Backend Architecture (Reused & Verified — Zero Duplication)
- **Models (`apps/api/src/modules/notifications/models/`):**
  - `notification.model.ts` — User-scoped notifications with category, read state, safe action link (`linkUrl`), and deterministic idempotency keys.
  - `notification-preference.model.ts` — Per-user channel preferences (`inApp`, `email`, `sms`) per notification category, enforcing mandatory delivery for `SECURITY` alerts.
  - `notification-delivery.model.ts` — Auditable channel delivery ledger (`SENT`, `DELIVERED`, `PENDING`, `FAILED`).
- **Services (`apps/api/src/modules/notifications/services/`):**
  - `notification-stream.service.ts` — Hardened one-way **Server-Sent Events (SSE)** transport (`Map<userId, Set<SseClientConnection>>`), max `5` concurrent connections per user, SSE `id:` frame headers for `Last-Event-ID` catch-up, `25s` keep-alive heartbeats, and instant `disconnectUser()` with `session_expired` frame on logout/revocation.
  - `notification-recipient.resolver.ts` — Role & ownership authorization preventing cross-user leaks and blocking `ADMIN` from receiving patient clinical PHI notifications.
  - `notification-template.registry.ts` — Neutral, privacy-safe templates that strip diagnoses, lab values, medication dosages, ABHA/Aadhaar numbers, and bearer tokens from previews.
  - `notification-event.handler.ts` — Bridges domain events (appointments, prescriptions, pharmacy orders, lab reports, consent updates, security alerts) into deterministic, deduplicated notification creation.
- **Routes (`apps/api/src/modules/notifications/routes/notification.routes.ts`):**
  - Rejects URL query tokens (`rejectUrlAccessToken`) before JWT `authenticate` + per-user rate limiting (`180 req/min`).
  - Endpoints: `GET /stream`, `GET /unread-count`, `GET/PATCH/PUT /preferences`, `POST /preferences/reset`, `GET /delivery-history`, `POST/PATCH /mark-all-read`, `GET /`, `PATCH /:id/read`, `DELETE /:id`, and `ADMIN`-only `POST /events`.

### Real-Time Transport Selection (Why SSE, Not WebSockets)
HealthBridge India's notification delivery is strictly server-to-client (`one-way push`) paired with standard authenticated REST mutations (`mark-read`, `delete`, `preferences`). Reusing the existing hardened **Server-Sent Events (SSE)** infrastructure over HTTP-only cookie authentication avoids introducing duplicate Socket.IO/WebSocket dependencies while providing automatic browser reconnection, `Last-Event-ID` support, cross-tab `BroadcastChannel` synchronization (`cross-tab-sync.ts`), client-side event deduplication (`markAndCheckDuplicateEventId`), and automatic `15s` polling fallback (`60s` gentle sync when SSE is healthy).

---

## 2. Reusable Frontend Notification UI Components

All 9 standardized components are exported from `apps/web/src/components/notifications/index.ts`:
1. **`NotificationBell`** — Header trigger with `<AnimatePresence>` animated dropdown, `<NotificationBadge />`, Escape focus restoration, and live `sr-only` unread count announcements.
2. **`NotificationBadge`** — Reusable unread counter pill (`99+` cap, `motion-reduce:animate-none` pulse).
3. **`NotificationDropdown`** — Glassmorphic `.glass-dropdown` quick inbox showing live connection status (`Live`, `Reconnecting…`, `Sync`), `<NotificationSkeleton compact />`, mark-all-read, and link to full center.
4. **`NotificationItem` (`NotificationCard`)** — Privacy-safe notification card with category icon, relative timestamp, unread state, safe navigation link, mark-read, and dismiss actions.
5. **`NotificationList`** — Paginated list container integrating `<NotificationSkeleton />`, accessible `<ErrorState />` retry, `<NotificationEmptyState />`, and a **Notification Detail View (`<Dialog>`)** with privacy disclaimer and quick actions.
6. **`NotificationCenter`** — Full-page searchable, category-tabbed, date-filtered, paginated workspace deployed across all 5 portals (`/patient/notifications`, `/doctor/notifications`, `/pharmacy/notifications`, `/laboratory/notifications`, `/admin/notifications`).
7. **`NotificationPreferences` (`NotificationPreferencesForm`)** — Category/channel matrix honestly gating Email & SMS availability against `preferences.availableChannels` and enforcing mandatory `SECURITY` notifications.
8. **`NotificationEmptyState`** — Clean empty state for zero notifications or zero unread notifications.
9. **`NotificationSkeleton`** — Accessible `role="status" aria-busy="true"` loading skeleton for compact and full views.

---

## 3. Real-Time UX & Security Controls

- **Live Toast & Screen-Reader Announcements (`useNotificationStream`):** Deduplicated incoming SSE notifications emit a polite, non-disruptive toast (title + category only — zero clinical PHI) and announce via `LiveAnnouncerProvider` (`assertive` for `SECURITY`, `polite` for workflow alerts).
- **Zero Cross-User Cache Contamination:** All TanStack Query keys are strictly keyed by `userId` (`NOTIFICATION_QUERY_KEYS.forUser(userId)`), and switching accounts or logging out immediately clears cached notifications, seen event IDs, and active `EventSource` handles across all browser tabs.
- **Role-Based Behavior:**
  - **Patient:** Appointments, Prescriptions, Lab Reports, Health Records, Consent Updates, Account Security.
  - **Doctor:** Appointment requests/changes, Consultation workflow updates, Authorized report updates, Security.
  - **Pharmacy:** Prescription queue updates, Orders, Inventory/Expiry alerts, Security.
  - **Laboratory:** Test orders, Sample updates, Report workflow alerts, QMS alerts, Security.
  - **Admin:** Operational system alerts, Security/SecOps alerts (never private patient clinical notifications).

---

## 4. Appointment Reminders & External Channels (Honest Status)

- **Workflow Event Notifications (Active):** Appointment booking, confirmation, rescheduling, and cancellation emit real domain events handled by `notification-event.handler.ts` with idempotent keys.
- **Scheduled Time-Ahead Reminder Cron Job (Not Yet Implemented):** A dedicated background scheduler for future time-ahead appointment reminders (e.g., T-24h / T-1h with cancellation guard) is not yet implemented in the backend and is documented transparently rather than simulated.
- **Email & SMS Providers:** Channel toggles in `NotificationPreferencesForm` strictly reflect server-reported `availableChannels.email` and `availableChannels.sms`; external delivery is never claimed unless the provider confirms delivery.
- **Browser Web Push Notifications (Not Configured):** No Service Worker or server-side VAPID push subscription storage is currently configured; therefore, the application **never** requests browser `Notification.requestPermission()` automatically and does not claim push delivery works.

---

## 5. Executed Verification Results

- **Backend Unified Notification Unit Tests (`pnpm --dir healthbridge-india/apps/api exec vitest run tests/unit/unified-notifications.test.ts`):** Passed (`9/9` tests — verified PHI redaction, role-scoped templates, ADMIN clinical isolation, SSE per-user isolation, max-connection cap, session-expired termination, honest channel reporting, and deterministic event routing).
- **Frontend Deduplication & 9-Component Architecture Tests (`tsx`):** Passed (`13/13` assertions — verified `markAndCheckDuplicateEventId` duplicate suppression, cache reset on user switch, and all 9 named exports in `components/notifications/index.ts`).
- **TypeScript (`pnpm --filter @healthbridge/web type-check`):** Passed (`0` errors).
- **ESLint (`pnpm --filter @healthbridge/web lint`):** Passed (`0` errors; `0` warnings across all Phase 14 files).
- **Next.js Production Build (`rm -rf .next && pnpm --filter @healthbridge/web build`):** Passed cleanly across all `215` routes (including all 5 portals' `/notifications` and `/notifications/preferences` routes) with shared First Load JS maintained flat at `87.5 kB`.

---

## 6. Known Limitations

- **Scheduled Appointment Reminder Worker:** Time-ahead reminder scheduling (excluding cancelled appointments) requires a backend cron/queue job to be implemented in a future backend phase.
- **Web Push / Service Worker:** Requires VAPID key provisioning, push subscription database model, and Service Worker registration before user-initiated push opt-in can be offered.
- **Live Browser Multi-Tab SSE QA:** Live end-to-end SSE streaming, reconnection under network drop, and multi-tab `BroadcastChannel` sync should be verified against a running local Express + MongoDB stack outside the sandbox.
