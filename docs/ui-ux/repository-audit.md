# HealthBridge India — Complete Repository Audit (Phase 01)

> **Audit Date:** 2026-11-18  
> **Scope:** Read-only technical, architectural, and UI/UX baseline audit prior to Phase 02 premium UI enhancement.  
> **Repository Root:** `healthbridge-india/` (Git branch `main`, commit `86873a4`, working tree clean prior to audit docs).

---

## 1. Monorepo & Workspace Structure

HealthBridge India is a **pnpm workspaces monorepo** (`pnpm@9.15.5`, Node `>= 18.0.0`) containing two applications (`apps/web`, `apps/api`) and three shared TypeScript packages (`packages/config`, `packages/shared-types`, `packages/validation`).

```text
healthbridge-india/
├── .env.example                    # Root environment template
├── .github/workflows/              # CI & security pipelines (e.g., security-ci.yml)
├── .prettierrc / .prettierignore   # Code formatting config
├── package.json                    # Root scripts: dev, build, lint, typecheck, format
├── pnpm-workspace.yaml             # Workspaces: apps/*, packages/*
├── pnpm-lock.yaml                  # Locked dependency graph
├── tsconfig.base.json              # Shared strict TypeScript base config
├── README.md                       # Root project documentation
├── scripts/                        # Operational, backup, restore & verification scripts
├── docs/                           # 180+ technical, ABDM, e2e, privacy & security docs
│   ├── abdm/                       # ABHA, HIP/HIU, FHIR R4, consent & webhook docs
│   ├── day-8/                      # Day 8 platform audit & sign-off docs
│   ├── day-9/                      # Day 9 security, privacy, KMS & SecOps completion docs
│   ├── deployment/                 # Deployment readiness checklists
│   ├── e2e/                        # End-to-end patient journey verification reports
│   ├── events/                     # Domain events, transactional outbox & DLQ docs
│   ├── operations/                 # Backup, restore & disaster recovery runbooks
│   ├── platform-integration/       # Cross-module workflow integration docs
│   ├── privacy/                    # Consent governance, retention & data rights docs
│   ├── security/                   # Threat model, KMS, SecOps & CI pipeline docs
│   └── ui-ux/                      # Phase 01 UI/UX audit documentation (this directory)
├── packages/
│   ├── config/                     # @healthbridge/config (env parsing, shared constants)
│   ├── shared-types/               # @healthbridge/shared-types (33 domain type modules)
│   └── validation/                 # @healthbridge/validation (26 shared Zod schemas)
└── apps/
    ├── api/                        # Express + TypeScript + Mongoose REST & SSE backend
    │   ├── .env.example
    │   ├── package.json
    │   ├── vitest.config.ts
    │   └── src/
    │       ├── app.ts              # Express app, middleware pipeline & security headers
    │       ├── server.ts           # HTTP bootstrap, DB connect & outbox worker lifecycle
    │       ├── config/             # Runtime configuration & secrets validation
    │       ├── database/           # MongoDB connection, indexes & migration helpers
    │       ├── middleware/         # Auth, RBAC, CSRF, rate limiting, validation, errors
    │       ├── routes/             # Versioned /api/v1 router registry
    │       ├── security/           # Envelope encryption, KMS, key rotation & file security
    │       ├── shared/             # Shared API response envelopes & domain helpers
    │       ├── utils/              # Structured Pino logger, sanitization & crypto utils
    │       └── modules/            # 22 domain modules:
    │           ├── abdm/           ├── appointments/   ├── audit/
    │           ├── auth/           ├── consent/        ├── docs/
    │           ├── doctors/        ├── events/         ├── health/
    │           ├── healthcare/     ├── laboratory/     ├── notifications/
    │           ├── patients/       ├── pharmacy/       ├── platform/
    │           ├── prescriptions/  ├── privacy/        ├── records/
    │           ├── search/         ├── security/       ├── security-monitoring/
    │           └── users/
    └── web/                        # Next.js 14 App Router + React 18 + Tailwind CSS 3.4 frontend
        ├── .env.example
        ├── .env.local              # Local dev env (gitignored)
        ├── next.config.mjs         # Security headers, CSP, transpilePackages
        ├── package.json
        ├── postcss.config.mjs
        ├── tailwind.config.ts      # Theme tokens, custom brand palette & keyframes
        ├── public/                 # EMPTY (0 static image/font/SVG assets)
        └── src/
            ├── app/                # 207 page.tsx routes, 6 layout.tsx, 1 error.tsx, 1 not-found.tsx
            │   ├── (auth)/         # 6 authentication routes
            │   ├── (dashboard)/    # 199 authenticated portal routes (shared + 5 role portals)
            │   ├── privacy-policy/ # Public privacy notice route
            │   ├── layout.tsx      # Root HTML shell, theme FOUC script, AppProviders
            │   ├── page.tsx        # Public landing page (client component)
            │   ├── error.tsx       # Root error boundary
            │   ├── not-found.tsx   # Root 404 page
            │   └── globals.css     # CSS custom properties (light/dark HSL tokens)
            ├── components/         # 292 component files across 12 folders
            ├── features/           # 81 domain API clients, TanStack Query hooks & lab UI modules
            ├── lib/                # Axios API clients, endpoints, error handler, safe-redirect, cn()
            ├── providers/          # AppProviders (Redux, TanStack Query, ThemeProvider)
            └── store/              # Redux Toolkit store (authSlice, systemSlice)
```

---

## 2. Application Entry Points & Package Scripts

| Scope | Entry Point / Config | Key Scripts |
| :--- | :--- | :--- |
| **Root** | `package.json`, `pnpm-workspace.yaml` | `pnpm dev`, `pnpm dev:web`, `pnpm dev:api`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format` |
| **Frontend (`apps/web`)** | `src/app/layout.tsx`, `src/app/page.tsx`, `next.config.mjs` | `next dev -p 3000`, `next build`, `next start`, `next lint`, `tsc --noEmit` |
| **Backend (`apps/api`)** | `src/server.ts`, `src/app.ts` | `tsx watch src/server.ts`, `tsc`, `vitest run` |
| **Shared Config** | `packages/config/src/index.ts` | Workspace package (`@healthbridge/config`) |
| **Shared Types** | `packages/shared-types/src/index.ts` | Workspace package (`@healthbridge/shared-types`) |
| **Shared Validation** | `packages/validation/src/index.ts` | Workspace package (`@healthbridge/validation`) |

---

## 3. Environment Configuration & Static Assets

### Environment Files
- `.env.example` — Root monorepo reference variables.
- `apps/api/.env.example` — Backend database (`MONGODB_URI`), JWT secrets, encryption/KMS keys, ABDM sandbox credentials, storage paths, SMTP/SMS flags, CORS origins, and SecOps alert settings.
- `apps/web/.env.example` — Frontend `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5001/api/v1`).
- `apps/web/.env.local` — Local development environment overrides (not tracked in Git).

### Static Assets
- `apps/web/public/` is currently **completely empty (0 files)**:
  - No `favicon.ico`, `apple-touch-icon.png`, or PWA manifest icons.
  - No OpenGraph social preview images (`og-image.png`).
  - No static illustrations, brand logos, or SVG emblems (all icons are inline `lucide-react` vectors).
  - `next/image` is imported in **0 files** across `apps/web/src/`.

---

## 4. Existing Functionality Status Matrix

Verified against the repository codebase and Day 8–9 test suite baseline (**65/65 backend test files, 798/798 passing Vitest tests**, clean `pnpm lint`, `pnpm typecheck`, and `pnpm build` as of commit `86873a4`).

| Module / Feature Area | Status | Notes & Evidence |
| :--- | :--- | :--- |
| **Landing Page & Marketing Shell** | Implemented (Needs UI Polish) | `app/page.tsx` renders 9 landing sections + AuthModal + InfoModal; `TrustSection.tsx` and `UserRoles.tsx` exist but are unused; developer API Status widget is pinned on public homepage. |
| **Authentication & Sessions** | Fully Implemented | Login, multi-role registration (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`), email/phone verification, password reset, HTTP-only refresh cookie rotation, CSRF tokens, session revocation, `<ProtectedRoute>` role guard. |
| **Patient Portal (45 routes)** | Fully Implemented | Dashboard, Appointments & Booking Wizard, Doctor Search, Health Records & Upload, Health Timeline, Prescriptions, Lab Orders & Reports, Pharmacy Order Tracking, ABHA & ABDM Record Discovery/Linking, Consent Governance, Privacy Rights & Data Export, Profile & Settings. |
| **Doctor Portal (42 routes)** | Fully Implemented | Dashboard, Patient Queue, Appointments, Clinical Encounter Workspace (SOAP, Vitals, Diagnosis, Attachments), Prescription Builder & Medication Catalog, Patient Directory & Clinical History, Schedule & Blocked Dates, Diagnostic Reports, ABDM Health Records, Settings. |
| **Pharmacy Portal (50 routes)** | Fully Implemented | Dashboard, Prescription Verification Queue, Dispensing & Receipts, Order Fulfillment & Pickup Verification, Inventory, Batches, Expiry, Stock-In/Adjustments, Transaction Ledger, Suppliers, Purchase Orders & Goods Receiving, Automated Replenishment, Staff & Settings. |
| **Laboratory Portal (47 routes)** | Fully Implemented | Dashboard, Lab Orders, Sample Collection & Barcode Scanner/Accessioning, Test Catalogue, Collection Centers, Diagnostic Reports (Preview, Review, Approval, Versioning, Amendment), QMS (QC Runs, Instruments, Calibration, Maintenance, CAPA, Incidents, Analytics), Reagent Inventory, Workforce/Shifts/Leave/Permissions. |
| **Admin & SecOps Portal (13 routes)** | Fully Implemented (UI Shell Minimal) | Admin Dashboard, Platform Overview, Transactional Outbox Event Monitor & DLQ Replay, Privacy Requests (Export/Correction/Deletion), SecOps Overview, Security Alerts, Incidents & Detail View, Vulnerability Register, Data Protection/KMS/DR Status, ABDM Status, Notifications. |
| **Global Search & Unified Notifications** | Fully Implemented | Role-scoped Cmd/Ctrl+K `GlobalSearchCommand` + `/dashboard/search`, `NotificationBell` + `NotificationDropdown` + `NotificationCenter` + SSE real-time stream + BroadcastChannel cross-tab sync + TanStack Query cache invalidation. |
| **ABDM / ABHA Integration** | Implemented (Sandbox / Mocked Upstream) | Complete internal state machines, FHIR R4 bundle builders, HIP/HIU callback handlers, and consent artefact persistence; external NHA ABDM gateway calls rely on sandbox/mock adapters when live NHA credentials are absent. |
| **External SMS / Email / Malware AV** | Mocked / Local Adapters | Local/stub adapters exist for development and automated tests; production SMTP/SMS/ClamAV/KMS connectors require external environment provisioning. |
| **Design System & Motion Layer** | Incomplete / Baseline Only | Only 6 basic UI primitives in `components/ui/`; `framer-motion` is installed but imported in **0 files**; `next/font` is unused; 0 `loading.tsx` files; `prefers-reduced-motion` is unimplemented. |
