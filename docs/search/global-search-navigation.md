# HealthBridge India — Global Search & Smart Navigation (Phase 15)

## 1. Overview & Architecture

HealthBridge India provides a unified, role-scoped **Global Search & Command Palette** across all 5 authenticated workspaces (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`, and `ADMIN`), backed by the existing hardened Express/MongoDB Global Search service.

### System Flow

```text
Topbar Trigger (Desktop ⌘K / Mobile Compact Icon)
       │
       ▼  (Singleton Event Coordinator + React Portal to document.body)
GlobalSearchCommand (Command Palette Modal)
  ├── Instant Debounced Suggestions (280ms + AbortController)
  │     └── GET /api/v1/search/suggestions?q=...&limit=8
  ├── Role-Scoped Quick Actions (41 verified routes across 5 roles)
  │     └── apps/web/src/features/search/lib/quick-actions.ts
  ├── Recently Visited Pages (User-scoped sessionStorage, ID-stripped, max 6)
  │     └── apps/web/src/features/search/lib/recent-navigation.ts
  └── Recent Searches (Session-memory only, sensitive-term filtered)
        ├── GET    /api/v1/search/recent
        └── DELETE /api/v1/search/recent
       │
       ▼  (Full Search / Enter / View All Results)
/dashboard/search (Full Search & Filtered Results Workspace)
  └── GET /api/v1/search?q=...&types=...&sortBy=...&sortOrder=...&from=...&to=...&status=...&page=...
```

---

## 2. Backend Search API Endpoints (Reused & Verified)

All endpoints live under `apps/api/src/modules/search/` and require strict JWT authentication (`authenticate`) and per-user rate limiting (`searchRateLimiter`: 90 requests/minute per user):

| Endpoint | Method | Purpose | Security & Privacy Controls |
| --- | --- | --- | --- |
| `/api/v1/search` | `GET` | Full paginated, filtered, relevance-ranked search across role-authorized resources | Fail-closed RBAC (`403 FORBIDDEN` on unauthorized types), ReDoS-safe regex escaping, max 100-char query, zero raw query text in `AuditLog` |
| `/api/v1/search/suggestions` | `GET` | Fast debounced autocomplete suggestions for the Command Palette | Strict role-scope intersection, sanitized title/subtitle metadata only (zero clinical values in previews) |
| `/api/v1/search/recent` | `GET` | Retrieves recent non-sensitive searches for the current user session | `SESSION_MEMORY_ONLY` policy; blocks ABHA numbers, Aadhaar numbers, credentials, and sensitive clinical terms |
| `/api/v1/search/recent` | `DELETE` | Clears server-side session recent searches for the caller | User-scoped deletion |

---

## 3. Role-Based Search Permissions & Quick Actions

### Server-Enforced Search Scope (`ROLE_SEARCH_PERMISSION_MATRIX`)

- **PATIENT:** Own appointments, own prescriptions, own lab reports, own health records, verified doctors, own pharmacy/lab orders. Cannot search other patients, inventory, dispensing, or platform users.
- **DOCTOR:** Authorized patients, own appointments, clinical encounters, prescriptions, linked diagnostic reports. Cannot search pharmacy inventory or admin users.
- **PHARMACY:** Prescriptions routed for fulfillment, pharmacy medicine inventory, batches, dispensing records, pharmacy orders. Cannot search general patients, encounters, or lab reports.
- **LABORATORY:** Diagnostic test orders, specimens/samples, test catalogue, laboratory reports. Cannot search prescriptions, pharmacy inventory, or general clinical encounters.
- **ADMIN:** Platform users, organizations, consent oversight records, security/audit governance entities. Cannot search sensitive clinical notes, encounters, prescriptions, or lab report values.

### Role-Scoped Quick Actions (`quick-actions.ts`)

Every role receives curated, searchable quick commands in the Command Palette (`41` verified actions total, strictly isolated by role prefix):

- **Patient (9):** Book Appointment, My Appointments, Health Records, Prescriptions, Lab Reports, Consent & Data Sharing, ABHA Health ID, Health Analytics, Account & Security Settings.
- **Doctor (8):** Patient Queue, Appointments, New Consultation, Write Prescription, My Patients, Clinic Schedule, Clinical Analytics, Doctor Settings.
- **Pharmacy (8):** Prescription Queue, Medicine Inventory, Low Stock & Expiry Alerts, Dispensing Desk, Medicine Orders, Add Medicine SKU, Pharmacy Analytics, Pharmacy Settings.
- **Laboratory (8):** Lab Test Orders, Scan Sample Barcode, Sample Collection, Diagnostic Reports, Test Catalogue, Quality & TAT Analytics, Reagent Inventory, Laboratory Settings.
- **Admin (8):** Platform Overview, Role & Access Control, Consent Oversight, Audit Logs, Security Center, System Monitoring, ABDM Integration, Admin Settings.

---

## 4. Command Palette & Keyboard Shortcuts

| Shortcut / Interaction | Behavior |
| --- | --- |
| `Cmd + K` (macOS) / `Ctrl + K` (Windows/Linux) | Opens or toggles the Global Search & Command Palette from any authenticated portal |
| `ArrowDown` / `ArrowUp` | Moves selection seamlessly across Suggestions, Matching Quick Actions, Recently Visited Pages, Recent Searches, and Full Search |
| `Enter` | Navigates to the highlighted item or submits full filtered search |
| `Escape` | Closes the palette and restores keyboard focus to the previously active element |

### Accessibility Implementation
- Implements ARIA `role="dialog"`, `aria-modal="true"`, `role="combobox"`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, and `role="option"` (`aria-selected`).
- Integrates `useLiveAnnouncer()` (`LiveAnnouncerProvider`) to announce suggestion counts, full search totals, filter resets, and history privacy changes to screen readers.
- Uses `<HighlightMatch>` (`HighlightMatch.tsx`) with semantic `<mark>` tags and regex-escaped tokenization (zero `dangerouslySetInnerHTML`) for readable keyword highlighting in both Light and Dark themes.
- Renders the Command Palette via `createPortal(..., document.body)` with singleton coordination across desktop and mobile Topbar triggers so duplicate modals never stack and responsive visibility wrappers (`hidden md:flex` / `md:hidden`) never hide the dialog.

---

## 5. Privacy Controls & Security Hardening

1. **User-Scoped React Query Cache (`/dashboard/search`):** Search query keys explicitly include `user?.id` (`['global-search', user?.id ?? 'anon', ...]`) to eliminate any possibility of cross-user cached search results within a shared browser session.
2. **Privacy-Safe Recently Visited Pages (`recent-navigation.ts`):**
   - Persists strictly in `sessionStorage` (cleared when the browser tab/session ends), namespaced by `userId`.
   - Strips query parameters and URL fragments before saving.
   - Automatically refuses to store routes containing dynamic MongoDB ObjectIds, UUIDs, or long numeric identifiers, plus `/dashboard/search` and auth/public routes — ensuring patient IDs, record IDs, and clinical search queries are never written to client storage.
3. **User-Controlled History Pause & Clear:** Users can pause/resume recent history or clear both local recent pages and server session searches directly inside the Command Palette. Pausing immediately wipes local session entries and clears server session history.
4. **Zero Sensitive Clinical Previews:** Search previews display safe metadata only (record type, category group, status, date, safe title/subtitle).

---

## 6. Performance Optimizations

- **Debounced Autocomplete (280ms)** with `AbortController` request cancellation prevents stale responses and redundant API calls during fast typing.
- **Zero New Dependencies:** Built exclusively with existing React, Framer Motion, Lucide Icons, and internal UI primitives (`ErrorState`, `EmptyState`, `Skeleton`, `Badge`, `Button`).
- **Single Mounted Modal Coordinator:** Desktop and compact mobile Topbar triggers coordinate over a lightweight DOM event so `/api/v1/search/recent` is only queried once per open.

---

## 7. Verification Summary

| Check | Scope | Result |
| --- | --- | --- |
| Backend Unit Tests (`vitest run tests/unit/global-search.test.ts`) | Role permission matrix, fail-closed 403, ReDoS protection, sensitive history blocking, audit privacy | **14 / 14 PASSED** |
| Phase 15 Runtime Verification (`verify-phase15-search.ts`) | All 41 Quick Action routes + 5 role home routes verified on disk (`page.tsx`), role isolation, keyword ranking, ID-stripping privacy, user isolation, history pause/clear, ReDoS-safe highlighter | **8 / 8 SUITES PASSED** |
| TypeScript (`pnpm --filter @healthbridge/web type-check`) | Entire web monorepo package | **0 errors** |
| ESLint (`pnpm --filter @healthbridge/web lint`) | All Phase 15 files (0 new errors/warnings) | **0 errors** |
| Next.js Production Build (`pnpm --filter @healthbridge/web build`) | Full static & dynamic production build (shared First Load JS `87.5 kB`) | **PASSED** |

---

## 8. Known Limitations

- **Dynamic Detail Pages Excluded from Recently Visited Pages by Design:** To prevent sensitive patient/encounter/report IDs from persisting in browser storage, the Recently Visited Pages list tracks top-level and section workspace routes only.
- **No Saved Searches / Cross-Session Search History:** By healthcare privacy design, recent searches remain `SESSION_MEMORY_ONLY` on the server and are not persisted in MongoDB across sessions.
- **Interactive Browser QA Pending:** Automated unit, route-existence, type-check, lint, and production build checks are verified; live interactive keyboard/screen-reader walkthrough in a running browser session should be performed during full E2E QA.
