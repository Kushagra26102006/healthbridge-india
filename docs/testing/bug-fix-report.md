# HealthBridge India — Phase 19 Defect & Bug-Fix Report

## Summary of Confirmed Defects Discovered & Remediated

| Defect ID | Severity | Affected Module | Status |
| --- | --- | --- | --- |
| **QA-DEF-01** | **HIGH** | Frontend Accessibility — `apps/web/src/components/landing/HeroSection.tsx` | **FIXED & VERIFIED** |
| **QA-DEF-02** | **MEDIUM** | Frontend Accessibility — `apps/web/src/components/auth/AuthLayout.tsx`, `apps/web/src/app/privacy-policy/page.tsx` | **FIXED & VERIFIED** |
| **QA-DEF-03** | **MEDIUM** | Frontend Test Infrastructure — `apps/web/package.json` & root `package.json` | **FIXED & VERIFIED** |
| **QA-DEF-04** | **LOW** | Next.js Build Isolation — `apps/web/next.config.mjs` | **FIXED & VERIFIED** |
| **QA-DEF-05** | **LOW** | Laboratory ESLint Hook Dependencies (Pre-Existing Day-6 QMS files) | **OPEN (LOW / NON-BLOCKING)** |

---

## Detailed Defect Logs

### QA-DEF-01 (HIGH — Serious WCAG 1.4.3 Color Contrast Violation on Landing Hero)
- **Description:** Live `axe-core@4.14.0` WCAG 2.2 AA scan flagged a `serious` `color-contrast` violation on the ABHA badge pill on `/`.
- **Reproduction Steps:** Navigate to `/` in Light Mode at `1440×900` and execute `axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })`.
- **Expected Behavior:** Text contrast ratio >= 4.5:1 for `12px` semibold badge text.
- **Actual Behavior:** `text-primary` rendered on `bg-primary/[0.06]` failed minimum 4.5:1 contrast threshold (`1` serious violation node).
- **Root Cause:** Light-tinted primary alpha background paired with medium-saturation `text-primary`.
- **Fix Applied:** Updated `apps/web/src/components/landing/HeroSection.tsx` to `border-blue-200 dark:border-primary/30 bg-blue-50/90 dark:bg-primary/15 text-blue-700 dark:text-blue-200`.
- **Retest Result:** **PASSED** — Post-fix live `axe-core` audit returned **0 violations** on `/`.

### QA-DEF-02 (MEDIUM — Missing `<main>` Landmark on Auth & Privacy Policy Pages)
- **Description:** Live DOM landmark audit detected `hasMainLandmark: false` on `/login`, `/register`, `/forgot-password`, and `/privacy-policy`, breaking skip-to-content navigation targets (`#main-content`), plus a heading level jump (`<h3>` without preceding `<h2>`) in `privacy-policy/page.tsx`.
- **Reproduction Steps:** Navigate to `/login`, `/register`, `/forgot-password`, or `/privacy-policy` and evaluate `Boolean(document.querySelector('main'))`.
- **Expected Behavior:** Every rendered page exposes a semantic `<main id="main-content">` landmark and monotonic heading order.
- **Actual Behavior:** Primary form/document containers were rendered using generic `<div>` elements.
- **Root Cause:** `AuthLayout.tsx` and `privacy-policy/page.tsx` omitted `<main>` wrappers.
- **Fix Applied:** Wrapped primary content in `<main id="main-content">` in `AuthLayout.tsx` and `privacy-policy/page.tsx`, and corrected heading tag to `<h2>` + higher-contrast link (`text-teal-700 dark:text-teal-300`).
- **Retest Result:** **PASSED** — Post-fix live audit confirmed `hasMainLandmark: true` and `h1Count: 1` on **11 / 11 audited routes**.

### QA-DEF-03 (MEDIUM — Complete Absence of Automated Frontend Test Suite)
- **Description:** `@healthbridge/web` had zero unit/component tests and no `test` script in `package.json`.
- **Root Cause:** Vitest was configured only inside `@healthbridge/api`.
- **Fix Applied:** Added `apps/web/vitest.config.mts`, wired `"test"` in `apps/web/package.json` and `"test:web"` / `"test:all"` in root `package.json`, and implemented 4 frontend unit/component/validation/a11y suites (`32` tests).
- **Retest Result:** **PASSED** — `pnpm --dir healthbridge-india test:web` passed **4 / 4 files, 32 / 32 tests** in `190 ms`.

### QA-DEF-04 (LOW — QA Production Build Colliding With Developer `.next` Directory)
- **Description:** Running `next start` for automated QA while a local `next dev` process touched `.next` caused missing `vendor-chunks` errors.
- **Fix Applied:** Added optional `NEXT_DIST_DIR` override support in `apps/web/next.config.mjs` (`...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {})`), preserving default `.next` behavior when unset.
- **Retest Result:** **PASSED** — Isolated `.next-qa` build and live CDP server ran cleanly with 0 errors.

### QA-DEF-05 (LOW — Open Pre-Existing `react-hooks/exhaustive-deps` ESLint Warnings in Laboratory QMS)
- **Affected Module:** 5 pre-existing Day-6 laboratory files (`reagents/[id]`, `control/runs/[id]`, `instruments/[id]`, `ReagentLotModal.tsx`, `use-laboratory-quality.ts`).
- **Status:** **OPEN (LOW)** — Zero ESLint errors; left untouched to avoid unintended fetch-loop regressions in laboratory QMS pages without live DB testing.
