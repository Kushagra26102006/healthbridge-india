# HealthBridge India — Accessibility Test Report (WCAG 2.2 AA)

## 1. Automated `axe-core@4.14.0` Live Browser Audit

Executed live against the built Next.js production server (`http://127.0.0.1:3019`) via Headless Chrome CDP (`scripts/qa-live-browser-audit.mjs`) evaluating `wcag2a`, `wcag2aa`, `wcag21aa`, and `wcag22aa` rule tags.

### Before vs. After Remediation Summary
- **Initial Audit Run:** Detected **1 serious color-contrast violation** on `/` (`HeroSection.tsx` ABHA pill badge `.bg-primary/[0.06] > .tracking-wide.font-semibold`) and **missing `<main>` landmarks** (`hasMainLandmark: false`) on `/login`, `/register`, `/forgot-password`, and `/privacy-policy`.
- **Remediation Applied:** Updated `HeroSection.tsx` badge contrast (`text-blue-700 dark:text-blue-200` on `bg-blue-50/90`), wrapped primary content in `<main id="main-content">` in `AuthLayout.tsx` and `privacy-policy/page.tsx`, and normalized heading hierarchy (`<h2>`) in `privacy-policy/page.tsx`.
- **Post-Fix Re-Audit Result (`2026-11-18T15:15:54Z`):** **0 `axe-core` violations across all 11 / 11 audited routes**, **`hasMainLandmark: true` on 11 / 11 routes**, and **exactly 1 `<h1>` per route on 11 / 11 routes**.

| Route | `axe-core` Passes | `axe-core` Violations (Post-Fix) | Incomplete (Needs Manual Review) | `<main>` Landmark | `<h1>` Count |
| --- | --- | --- | --- | --- | --- |
| `/` | 25 | **0** | 2 | Yes | 1 |
| `/login` | 24 | **0** | 1 | Yes | 1 |
| `/register` | 25 | **0** | 1 | Yes | 1 |
| `/forgot-password` | 23 | **0** | 1 | Yes | 1 |
| `/privacy-policy` | 19 | **0** | 0 | Yes | 1 |
| `/patient/dashboard` (unauth shell) | 24 | **0** | 1 | Yes | 1 |
| `/doctor/dashboard` (unauth shell) | 24 | **0** | 1 | Yes | 1 |
| `/pharmacy/dashboard` (unauth shell) | 24 | **0** | 1 | Yes | 1 |
| `/laboratory/dashboard` (unauth shell) | 24 | **0** | 1 | Yes | 1 |
| `/admin/audit-logs` (unauth shell) | 24 | **0** | 1 | Yes | 1 |
| `/dashboard/search` (unauth shell) | 24 | **0** | 1 | Yes | 1 |

---

## 2. Component-Level Accessibility Unit Verification (`apps/web/tests/unit/ui-components-and-a11y.test.tsx`)

- **10 / 10 tests PASSED** confirming:
  - `Button`: `disabled`, `aria-busy="true"`, decorative spinner `aria-hidden="true"`.
  - `Input`: explicit `<label htmlFor>` pairing, `aria-invalid="true"`, and `aria-describedby` linking error messages.
  - `ErrorState`: `role="alert"` recovery panel.
  - `FormErrorSummary`: WCAG 3.3.1 `role="alert"`, programmatic focus (`tabindex="-1"`), and keyboard jump links (`href="#fieldId"`).
  - `HighlightMatch`: safe `<mark>` tags with escaped HTML entities.

---

## 3. Manual Assistive-Technology Checks Still Required (Honest Disclosure)

Automated `axe-core` rules cannot validate every WCAG 2.2 AA criterion. The following checks require manual verification in a staging environment with live authenticated accounts:
1. Screen reader announcement order (VoiceOver / NVDA) across authenticated Patient, Doctor, Pharmacy, Laboratory, and Admin data tables, modals, and toast notifications.
2. Authenticated chart tooltip keyboard accessibility and contrast on Recharts interactive overlays (`axe-core` flagged 1–2 `incomplete` gradient/overlay contrast items for manual color-contrast review).
3. Full Tab / Shift+Tab / Escape focus-trap cycle verification on complex multi-step clinical dialogs (`RecordUploadDialog`, `GlobalSearchCommand`, `ConfirmDialog`).
