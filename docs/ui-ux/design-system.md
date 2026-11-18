# HealthBridge India — Global Design System (Phase 02)

> **Status:** Implemented Foundation (`apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`, `apps/web/src/components/ui/*`, `apps/web/src/components/healthcare/*`)  
> **Visual Direction:** Minimal, clinical-grade healthcare SaaS inspired by Apple Health, Linear, and Stripe — engineered for clarity, high-contrast medical readability, and zero visual clutter.

---

## 1. Color System

All colors are defined as HSL CSS custom properties in `apps/web/src/app/globals.css` and mapped to Tailwind semantic utilities in `apps/web/tailwind.config.ts`. Never hardcode light-only palette colors (`bg-white`, `bg-slate-50`, `text-slate-900`) in shared shells or reusable components.

### Light Theme (`:root`)

| Token | Hex | CSS Variable (`HSL`) | Tailwind Utility | Intended Use |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `#2563EB` | `--primary: 221.2 83.2% 53.3%` | `bg-primary`, `text-primary` | Primary actions, active focus rings, links |
| **Primary Hover** | `#1D4ED8` | `--primary-hover: 224.3 76.3% 48%` | `hover:bg-primary-hover` | Primary interactive hover state |
| **Secondary** | `#0D9488` | `--secondary: 174.7 83.9% 31.6%` | `bg-secondary`, `text-secondary` | Medical/ABDM accents, verified indicators |
| **Accent** | `#06B6D4` | `--accent: 188.7 94.5% 42.7%` | `bg-accent`, `text-accent` | Subtle diagnostic highlights & gradients |
| **Background** | `#F8FAFC` | `--background: 210 40% 98%` | `bg-background` | Application page canvas |
| **Surface / Card** | `#FFFFFF` | `--surface` / `--card: 0 0% 100%` | `bg-surface`, `bg-card` | Cards, inputs, tables, sidebars |
| **Text Primary** | `#0F172A` | `--foreground: 222.2 47.4% 11.2%` | `text-foreground` | Primary headings & clinical body copy |
| **Text Secondary** | `#64748B` | `--muted-foreground: 215.4 16.3% 46.9%` | `text-muted-foreground` | Metadata, helper copy, table headers |
| **Border** | `#E2E8F0` | `--border: 214.3 31.8% 91.4%` | `border-border` | Hairline dividers, card & input borders |
| **Success** | `#16A34A` | `--success: 142.1 76.2% 36.3%` | `text-success`, `bg-success` | Verified, active, completed, normal results |
| **Warning** | `#D97706` | `--warning: 32.1 94.6% 43.7%` | `text-warning`, `bg-warning` | Pending consent, low stock, out-of-range |
| **Error** | `#DC2626` | `--error` / `--destructive: 0 72.2% 50.6%` | `text-error`, `bg-destructive` | Critical alerts, revoked, validation errors |

### Dark Theme (`.dark`)

| Token | Hex | CSS Variable (`HSL`) | Tailwind Utility | Intended Use |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `#080F1E` | `--background: 221 58% 7.5%` | `bg-background` | Deep clinical navy canvas |
| **Surface / Card** | `#111C30` | `--surface` / `--card: 219 48% 12.7%` | `bg-surface`, `bg-card` | Primary cards, sidebars, panels |
| **Elevated Surface** | `#17243A` | `--surface-elevated: 218 43% 15.9%` | `bg-surface-elevated` | Popovers, dropdowns, raised containers |
| **Primary** | `#3B82F6` | `--primary: 217.2 91.2% 59.8%` | `bg-primary`, `text-primary` | High-legibility dark-mode primary action |
| **Secondary** | `#2DD4BF` | `--secondary: 172.5 66% 50.4%` | `bg-secondary`, `text-secondary` | Luminous medical teal accent |
| **Text Primary** | `#F8FAFC` | `--foreground: 210 40% 98%` | `text-foreground` | Primary dark-mode copy |
| **Text Secondary** | `#94A3B8` | `--muted-foreground: 215 20.2% 65.1%` | `text-muted-foreground` | Secondary metadata & labels |
| **Border** | `#26364D` | `--border: 215 34% 22.5%` | `border-border` | Crisp hairline boundaries |

### Chart Tokens
- `--chart-1` (Primary Blue), `--chart-2` (Medical Teal), `--chart-3` (Diagnostic Cyan), `--chart-4` (Success Green), `--chart-5` (Warning Amber) — mapped as `chart-1` through `chart-5` in Tailwind and tuned independently for Light and Dark modes.

### Verified WCAG 2.1 AA Contrast Pairs
- Light Text Primary (`#0F172A`) on Background (`#F8FAFC`): **17.0:1** (AAA)
- Light Text Secondary (`#64748B`) on Surface (`#FFFFFF`): **4.76:1** (AA) | on Background (`#F8FAFC`): **4.56:1** (AA)
- Light Primary (`#2563EB`) with White foreground (`#FFFFFF`): **5.17:1** (AA)
- Light Error (`#DC2626`) with White foreground (`#FFFFFF`): **4.83:1** (AA)
- Dark Text Primary (`#F8FAFC`) on Background (`#080F1E`): **18.2:1** (AAA) | on Surface (`#111C30`): **15.6:1** (AAA)
- Dark Text Secondary (`#94A3B8`) on Background (`#080F1E`): **7.64:1** (AAA) | on Elevated Surface (`#17243A`): **5.74:1** (AA)
- Dark Primary (`#3B82F6`) with Deep Navy foreground (`#080F1E`): **5.20:1** (AA)

---

## 2. Typography System

- **Primary Sans Stack (`--font-sans`):** `'Inter', 'Geist', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` (offline-build-safe and strictly compliant with `font-src 'self' data:` CSP).
- **Monospace Stack (`--font-mono`):** `'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace` — used for ABHA numbers, Rx numbers, lab report numbers, and clinical codes.

| Class | Role | Scale & Weight | Line Height |
| :--- | :--- | :--- | :--- |
| `.text-display` | Landing hero & showcase titles | `30px → 36px → 48px`, `700`, `tracking-tight` | `1.12` |
| `.text-page-heading` | Portal page titles | `24px → 28px`, `600`, `tracking-tight` | `1.20` |
| `.text-section-heading` | Major page & modal sections | `18px → 20px`, `600`, `tracking-tight` | `1.30` |
| `.text-card-heading` | Card & widget titles | `16px`, `600`, `tracking-tight` | `1.35` |
| `.text-body` | Clinical & UI body copy | `14px`, `400` | `1.625` |
| `.text-label` | Form field labels | `12px–13px`, `500` | `1.0` |
| `.text-helper` | Form guidance & hints | `12px`, `400`, `muted-foreground` | `1.5` |
| `.text-caption` | Secondary timestamps & metadata | `12px`, `500`, `muted-foreground` | `1.375` |
| `.text-metric` | KPI & numeric dashboard values | `24px → 30px`, `700`, `tabular-nums` | `1.0` |

> **Rule:** Always apply `tabular-nums` (`.text-metric` or `tabular-nums`) to numeric counters, dosages, prices, dates, and pagination indicators to eliminate layout jitter.

---

## 3. Spacing Scale

Use the standardized 4px base grid (available as standard Tailwind utilities and explicit `ds-*` tokens):

| Token | Value | Typical Usage |
| :--- | :--- | :--- |
| `ds-1` (`1`) | `4px` | Tight icon/badge internal gaps |
| `ds-2` (`2`) | `8px` | Label-to-input gap, inline button groups |
| `ds-3` (`3`) | `12px` | Compact card/row inner gaps |
| `ds-4` (`4`) | `16px` | Standard grid gap, mobile container padding |
| `ds-5` (`5`) | `20px` | Standard card padding (`p-5`) |
| `ds-6` (`6`) | `24px` | Desktop card padding (`sm:p-6`), section spacing |
| `ds-8` (`8`) | `32px` | Major page section vertical separation |
| `ds-10` (`10`) | `40px` | Portal top/bottom breathing space |
| `ds-12` (`12`) | `48px` | Marketing section padding (mobile) |
| `ds-16` (`16`) | `64px` | Marketing section padding (tablet) |
| `ds-20` (`20`) | `80px` | Hero / major showcase vertical spacing |

---

## 4. Border Radius & Shadows

### Radius Tokens
- **Small (`rounded-sm` / `--radius-sm`):** `6px` — small buttons, compact inputs, table sort buttons, menu items.
- **Medium (`rounded-md` / `--radius-md`):** `10px` — default buttons, inputs, selects, alerts, icon containers.
- **Large (`rounded-lg` / `--radius-lg`):** `14px` — cards, tables, dropdown panels, toast notifications.
- **Extra Large (`rounded-xl` / `--radius-xl`):** `20px` — modals/dialogs, hero preview cards.
- **Pill (`rounded-pill` / `rounded-full`):** `9999px` — badges, switches, avatars, status dots.

### Shadow Tokens
All shadows automatically adapt between Light and Dark themes via CSS variables:
- `shadow-xs` (`--shadow-xs`) — Hairline depth for inputs, buttons, and pills.
- `shadow-sm` (`--shadow-sm`) — Standard resting elevation for cards and tables.
- `shadow-md` (`--shadow-md`) — Floating panels, tooltips, elevated cards.
- `shadow-lg` (`--shadow-lg`) — Dropdown menus and popovers.
- `shadow-hover` (`--shadow-hover`) — Interactive card hover elevation.
- `shadow-dialog` (`--shadow-dialog`) — Modal dialogs and command overlays.

---

## 5. Glassmorphism Utilities

Defined in `globals.css` with **automatic solid surface fallbacks** for browsers that do not support `backdrop-filter` (`@supports` progressive enhancement):

- `.glass-nav` — Sticky navigation bars & topbars (`12px` blur, hairline bottom border).
- `.glass-dropdown` — Menus & popovers (`14px` blur, `shadow-lg`).
- `.glass-modal` — Modal dialog containers (`18px` blur, `shadow-dialog`).
- `.glass-panel` — Floating notification toasts and elevated summary callouts (`12px` blur, `shadow-md`).

> **Performance & Readability Rule:** Never apply glass blur directly to dense clinical tables, lab observation grids, or long scrolling lists. Reserve glass surfaces strictly for navigation chrome, overlays, dropdowns, and floating panels.

---

## 6. Interaction States

Every interactive control implements consistent visual and accessible states:
- **Default:** Clean surface contrast with `border-border` / `shadow-xs`.
- **Hover:** Subtle surface shift (`hover:bg-primary-hover`, `hover:bg-muted/80`, `hover:shadow-hover`).
- **Focus:** Universal `:focus-visible` and `.focus-ring` (`2px` `ring-ring` + `2px` `ring-offset-background`).
- **Active:** Crisp tactile feedback (`active:scale-[0.98]` on buttons, skipped for link buttons and reduced motion).
- **Disabled:** `disabled:opacity-50` / `disabled:pointer-events-none` / `disabled:cursor-not-allowed`.
- **Loading:** Inline spinner (`Button loading`), `aria-busy="true"`, and structured `Skeleton` placeholders.
- **Success / Error:** Semantic `border-success` / `border-error`, inline status icons, and `role="alert"` validation copy.

---

## 7. Component Library Guidelines

### Core Primitives (`@/components/ui`)
Import from `@/components/ui` (barrel export in `apps/web/src/components/ui/index.ts`):
- **Buttons:** `Button` (`default`/`primary`, `secondary`, `outline`, `ghost`, `destructive`, `teal`, `link`, `gradient`, `subtleTeal`; sizes `sm`, `default`, `lg`, `xl`, `icon`, `icon-sm`, `icon-lg`; supports `loading`, `loadingText`, and working `asChild`).
- **Form Controls:** `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` / `RadioItem`, `Switch` (`Toggle`). All support `label`, `helperText`, `error`, and accessible ARIA wiring.
- **Display & Status:** `Badge`, `StatusIndicator`, `Card` (`default`, `elevated`, `glass`, `interactive`, `outline`), `StatisticCard`, `Avatar` / `AvatarGroup`.
- **Data & Navigation:** `DataTable` (sortable desktop table + automatic mobile stacked card layout), `Tabs` (`segmented`, `underline`, `pills`), `Breadcrumb`, `Pagination`.
- **Overlays & Feedback:** `Dialog` (focus-trapped, Escape-closable, focus-restoring), `Dropdown`, `Tooltip`, `Alert`, `ToastProvider` / `useToast`, `Skeleton` (`SkeletonText`, `SkeletonCard`, `SkeletonTable`, `SkeletonStatGrid`), `EmptyState`.

### Healthcare-Specific Components (`@/components/healthcare`)
Import from `@/components/healthcare` — all typed directly against `@healthbridge/shared-types` with zero fake/hardcoded patient records:
- `HealthcareStatusBadge` — Unified status badge for ABHA, appointments, prescriptions, lab reports, consents, orders, and pharmacy inventory.
- `AbhaIdentityCard` — ABHA profile card with masked/formatted 14-digit ABHA number, copyable ABHA address, and KYC verification badge.
- `MedicalRecordCard` — EHR summary card (`HealthRecordSummary`) with type badge, attachment flag, practitioner, and facility.
- `AppointmentCard` — Appointment summary card (`AppointmentSummaryDto`) supporting both patient and doctor perspectives.
- `PrescriptionCard` — e-Prescription card (`PrescriptionListItemDto`) with monospace Rx ID, refill count, and validity dates.
- `LabReportCard` — Diagnostic report card (`LabReportListItemDto`) highlighting out-of-range values and PDF availability.
- `ConsentStatusCard` — ABDM/DISHA consent card (`ConsentListItemDto`) with purpose, HI types, and expiry date.
- `DoctorProfileCard` — Verified practitioner card (`DoctorPublicDto`) with specializations, modes, and availability indicator.
- `PharmacyMedicineCard` — Medicine catalog & inventory card (`MedicineCatalogItemDto`) with Rx/Schedule badges and stock status.

---

## 8. Theme Architecture & Usage

- **Single Provider:** `ThemeProvider` (`apps/web/src/providers/theme-provider.tsx`) is mounted once in `AppProviders`. Do not introduce any second theme context.
- **Persistence:** Stored under `localStorage['healthbridge-theme']` (`'light' | 'dark' | 'system'`).
- **Zero-FOUC Boot:** Synchronous inline `<script>` in `apps/web/src/app/layout.tsx` applies `.dark` and `color-scheme` to `<html>` before hydration.
- **Toggle Control:** Use `<ThemeToggle />` (`apps/web/src/components/layout/ThemeToggle.tsx`) across public and portal headers (now present across Patient, Doctor, Pharmacy, Laboratory, and Admin portals).

---

## 9. Accessibility Rules (WCAG 2.1 AA)

1. **Keyboard Navigation:** All interactive elements must be reachable via `Tab` / `Shift+Tab`, expose a visible focus ring (`:focus-visible`), and support `Arrow` keys inside `Tabs` and `Dropdown` menus.
2. **Skip Link:** Root layout provides a `.skip-to-content` link targeting `#main-content` present across all portal layouts.
3. **Modal Focus Containment:** Always use `<Dialog>` from `@/components/ui` for new modals — it enforces `role="dialog"`, `aria-modal="true"`, keyboard focus trapping, Escape dismissal, and focus restoration to the trigger element on close.
4. **Reduced Motion:** `globals.css` includes a global `@media (prefers-reduced-motion: reduce)` rule disabling smooth scrolling, pulses, and transitions for motion-sensitive users.
5. **No Nested Interactive Elements:** Use `<Button asChild><Link ... /></Button>` (or `<a ... />`) instead of nesting links inside buttons.
6. **Minimum Legibility:** Prefer `text-xs` (`12px`) as the floor for clinical captions and labels; avoid `10px` text for clinical data.
