# HealthBridge India — Component Inventory & Reuse Assessment (Phase 01)

> **Total Frontend UI Component Files:** **292** files under `apps/web/src/components/` plus **37** laboratory feature UI components under `apps/web/src/features/laboratory/components/` and **3** auth feature components under `apps/web/src/features/auth/components/` (**332 UI component files total**).

---

## 1. Component Directory Breakdown

| Directory | File Count | Role / Scope | Reuse Status |
| :--- | :---: | :--- | :--- |
| `components/ui/` | 6 | Core primitives (`badge`, `button`, `card`, `input`, `switch`, `textarea`) | **Upgrade & Expand** (missing Dialog, Sheet, Table, Tabs, Select, Skeleton, Tooltip, Toast, DropdownMenu) |
| `components/layout/` | 4 | Public chrome (`Navbar`, `Footer`, `InfoModal`, `ThemeToggle`) | **Upgrade** (add glass polish, focus trap in `InfoModal`, reduced-motion safe transitions) |
| `components/landing/` | 11 | Marketing sections (`HeroSection`, `AbhaPreviewCard`, `PlatformOverview`, `ServicesSection`, `HowItWorks`, `UserEcosystem`, `AbhaInformation`, `PrivacySection`, `FinalCTA`, unused `TrustSection`, unused `UserRoles`) | **Upgrade** (fix nested `<a>` inside `<button>`, wire motion choreography, reconcile or remove dead components) |
| `components/auth/` | 11 | `AuthLayout`, `AuthModal`, `LoginForm`, `RegistrationForm`, role-specific forms, `RoleSelector`, `PasswordField`, `FormError` | **Upgrade** (add focus trap to `AuthModal`, polish inputs & role cards) |
| `components/notifications/` | 9 | `NotificationBell`, `NotificationDropdown`, `NotificationCenter`, `NotificationCard`, `NotificationCategoryTabs`, `NotificationDeliveryStatus`, `NotificationEmptyState`, `NotificationPreferencesForm`, `index` | **Reusable — Visual Polish** (unify shadows/blur, replace `animate-ping` with reduced-motion aware pulse) |
| `components/search/` | 1 | `GlobalSearchCommand` (Cmd/Ctrl+K modal) | **Reusable — Upgrade** (add mobile trigger, keyboard focus trap, replace invalid `backdrop-blur-xs`) |
| `components/patient/` | 80 | Shell (`PatientSidebar`, `PatientTopbar`), dashboard cards, appointments (15), consent (14), lab-reports (13), profile (7), records (13), settings (7) | **Keep Business Logic — Unify Shell & Cards** |
| `components/doctor/` | 100 | Shell (`DoctorSidebar`, `DoctorTopbar`), dashboard cards, appointments (15), encounters (17), patients (15), prescriptions (15), schedule (15), settings (9) | **Keep Business Logic — Unify Shell & Cards** |
| `components/pharmacy/` | 55 | Shell (`PharmacySidebar`, `PharmacyTopbar`), dispensing, inventory, orders, prescriptions, procurement, suppliers, settings nav | **Fix Dark Mode & Breakpoints — Unify Shell** |
| `components/laboratory/` | 13 | Shell (`LaboratorySidebar`, `LaboratoryTopbar`), sample/order badges, modals (`AccessionSampleModal`, `AssignTestModal`, `OrderReviewModal`, `PrintableSampleLabelModal`, `RejectSampleModal`), timeline | **Fix Dark Mode & Breakpoints — Unify Modals** |
| `features/laboratory/components/` | 37 | QMS tables & modals (CAPA, QC, Calibration, Instruments, Maintenance, Incidents, Reagents, Workforce, Shifts, Permissions, WorkloadBoard) | **Standardize Tables & Modals onto Shared Primitives** |
| `features/auth/components/` | 3 | `protected-route.tsx`, legacy `login-form.tsx`, `register-form.tsx` | **Keep `protected-route.tsx` unchanged**; audit duplicate auth forms |
| `components/dashboard/` + `_root` | 2 | `DashboardPlaceholder.tsx`, `system-status.tsx` | **Audit / Relocate** (`system-status.tsx` should not float over public landing page) |

---

## 2. Core System Components Audit

### A. Navigation & Portal Shells (6 Layouts, 4 Divergent Patterns)
| Component / Layout | Breakpoint Behavior | Theme Support | Issues Found |
| :--- | :--- | :--- | :--- |
| `layout/Navbar.tsx` | `md:flex` desktop nav, mobile collapse menu | Light + Dark | Uses invalid `bg-background/98` (Tailwind v3 no-op), no scroll-elevation transition. |
| `patient/layout.tsx` + `PatientSidebar` / `PatientTopbar` | Topbar `h-16 md:h-20`, mobile button `lg:hidden`, search `hidden md:flex` | Light + Dark (`bg-background`) | `getPageTitle()` misses 9 routes (`/abha`, `/abdm`, `/privacy`, `/orders`, etc.), falling back to `"Dashboard Overview"`. |
| `doctor/layout.tsx` + `DoctorSidebar` / `DoctorTopbar` | Topbar `h-16 md:h-20`, mobile button `lg:hidden`, search `hidden md:flex` | Light + Dark (`bg-background`) | Diverges in height & spacing from Pharmacy/Lab; duplicates sidebar shell code. |
| `pharmacy/layout.tsx` + `PharmacySidebar` / `PharmacyTopbar` | Topbar `h-16`, mobile button `md:hidden`, search `hidden lg:flex` | **BROKEN Dark Mode** (`bg-slate-50/70`, `bg-white` footer vs `bg-background` topbar) | Breakpoint mismatch vs Patient/Doctor; `getPageTitle()` misses `/purchases`, `/suppliers`, `/replenishment`. |
| `laboratory/layout.tsx` + `LaboratorySidebar` / `LaboratoryTopbar` | Topbar `h-16`, mobile button `md:hidden`, search `hidden lg:flex` | **BROKEN Dark Mode** (`bg-slate-50/70`, `bg-white` footer vs `bg-background` topbar) | Breakpoint mismatch vs Patient/Doctor; `getPageTitle()` misses `/quality`, `/staff`, `/scheduling`, `/reagents`, `/workload`. |
| `admin/layout.tsx` | Single sticky `h-14` horizontal topbar (`overflow-x-auto`) | Light + Dark | **No collapsible sidebar**, **no `<ThemeToggle />`**, **no profile/logout menu**, invalid `backdrop-blur-xs`, 5 nav links reuse identical `ShieldCheck` icon, SecOps subpages hidden from nav. |

### B. UI Primitives (`components/ui/`)
| Primitive | File | Status & Findings |
| :--- | :--- | :--- |
| `Button` | `ui/button.tsx` | Uses CVA with variants (`default`, `teal`, `destructive`, `outline`, `secondary`, `ghost`, `link`). **Bug:** declares `asChild?: boolean` in `ButtonProps` but ignores it and always renders `<button>`, causing invalid nested `<button><a/></button>` in `HeroSection.tsx`. |
| `Card` | `ui/card.tsx` | Basic `rounded-xl border bg-card text-card-foreground shadow-sm`. No glass variant, interactive hover elevation token, or metric card abstraction. |
| `Badge` | `ui/badge.tsx` | Basic CVA pill. Overridden ad-hoc by dozens of portal-specific status badges (`QueueStatusBadge`, `OrderStatusBadge`, `LabOrderStatusBadge`, `ReportStatusBadge`, etc.). |
| `Input` / `Textarea` / `Switch` | `ui/input.tsx`, `textarea.tsx`, `switch.tsx` | Functional baseline; lack consistent error state styling, prefix/suffix icon slots, and focus halo tokens. |
| **Missing Primitives** | *(None exist)* | No shared `Dialog/Modal`, `Drawer/Sheet`, `DropdownMenu`, `DataTable`, `Tabs`, `Select`, `Skeleton`, `Tooltip`, `Toast`, `EmptyState`, or `PageHeader` in `components/ui/`. |

### C. Modals, Tables, Loading & Theme Provider
- **Modals & Dialogs:** Over 30 custom modal/dialog components exist across `auth/`, `layout/`, `patient/`, `doctor/`, `pharmacy/`, `laboratory/`, and `features/laboratory/components/`. Only **6 files** set `role="dialog"` and **5 files** set `aria-modal="true"`; **0 modals** implement a keyboard focus trap or return-focus-on-close.
- **Tables:** **65 raw `<table>` elements** across **63 files** (wrapped in `overflow-x-auto` 83 times) with inconsistent header styling, cell padding, sorting affordances, and no mobile card view fallback at `375px`.
- **Loading States:** 6 bespoke portal skeletons (`PatientDashboardSkeleton`, `DoctorDashboardSkeleton`, `AppointmentSkeleton`, `ConsentSkeleton`, `RecordsSkeleton`, `PrescriptionSkeleton`, `ScheduleSkeleton`, `EncounterSkeleton`, `PatientDetailsSkeleton`, `LabReportsSkeleton`), plus 94 inline `animate-pulse` blocks and 115 `animate-spin` spinners. Zero route-level `loading.tsx` files.
- **Theme Provider (`src/providers/theme-provider.tsx`):** Clean `light | dark | system` context with `matchMedia` listener and root inline FOUC script. Minor edge case: `toggleTheme()` cycles only `dark <-> light` even when current theme is `system` (if OS is dark and `theme === 'system'`, first click sets `dark` instead of switching to `light` — a classic UX papercut!).

---

## 3. Keep vs. Upgrade vs. Consolidate Summary

- **Keep Intact (Do Not Break):** All 81 files in `src/features/` (API clients, TanStack Query hooks, SSE & cross-tab sync, `ProtectedRoute`), Redux store (`src/store/`), Axios client & CSRF handling (`src/lib/`), and domain business forms/wizards.
- **Upgrade First (High Leverage Foundation):** `components/ui/*` (fix `Button` `asChild`, add `Dialog`, `Drawer`, `DataTable`, `Tabs`, `Skeleton`, `EmptyState`, `PageHeader`, `MotionPrimitives`), `ThemeProvider` (`toggleTheme` from `system` fix), and a unified `<PortalShell>` abstraction shared by all 5 portals.
- **Upgrade Incrementally by Surface:** Public landing page (`components/landing/*` + `Navbar` + `Footer`), Auth pages & `AuthModal`, then each portal dashboard and high-traffic clinical workflow view.
