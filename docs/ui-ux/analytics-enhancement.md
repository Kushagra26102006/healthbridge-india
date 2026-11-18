# HealthBridge India — Advanced Analytics & Interactive Charts Enhancement (Phase 11)

> **Scope:** Implemented a zero-dependency, keyboard-accessible, Light/Dark theme-aware interactive data visualization library (`apps/web/src/components/analytics/*` + `apps/web/src/lib/analytics/export.ts`) and deployed live, role-scoped interactive analytics workspaces across all 5 HealthBridge India portals (Super Admin, Patient, Doctor, Pharmacy, Laboratory) — using 100% real backend APIs, zero fabricated statistics, safe CSV/Printable-PDF exports, and full privacy/RBAC isolation.

---

## 1. Reusable Analytics Architecture

Because `recharts` is not installed in `@healthbridge/web`, we engineered a lightweight, zero-dependency, GPU-animated SVG charting suite leveraging Framer Motion + Phase 02 `--chart-1..5` CSS variables (avoiding external bundle bloat while preserving offline/strict-CSP compatibility):

| Component / Utility | File | Capabilities |
| :--- | :--- | :--- |
| **Filtering, Time-Series & Safe Export** | `apps/web/src/lib/analytics/export.ts` | `filterByDateRange` (`all` / `weekly` / `monthly` / `yearly` + custom `from`/`to`), `bucketTimeSeries` (real chronological buckets; never fabricates empty points), `sanitizeCsvCell` (neutralizes spreadsheet formula injection `=`, `+`, `-`, `@`, `\t`, `\r` + RFC-4180 escaping), `downloadAnalyticsCsv`, `triggerPrintableReport`. |
| **Accessible Chart Wrapper** | `apps/web/src/components/analytics/ChartShell.tsx` | Unified card chrome with loading skeletons, accessible error `<Alert>`, empty states, and a 1-click **Chart / Table View** toggle providing a keyboard-accessible tabular alternative for every visualization. |
| **Line & Area Charts** | `apps/web/src/components/analytics/AnalyticsLineChart.tsx` | Exports `AnalyticsLineChart` and `AnalyticsAreaChart` — responsive SVG `viewBox`, animated `m.path`, area gradient fills, hover + keyboard-focus tooltips (`tabIndex={0}` + `aria-live`), clickable point selection, and legends. |
| **Bar Chart** | `apps/web/src/components/analytics/AnalyticsBarChart.tsx` | Vertical SVG & horizontal bar modes with GPU `scaleY`/`scaleX`, hover highlighting, keyboard focus readouts, and click selection. |
| **Pie & Donut Charts** | `apps/web/src/components/analytics/AnalyticsPieChart.tsx` | Exports `AnalyticsPieChart` and `AnalyticsDonutChart` — trigonometric SVG arc segments, center metric summary, hover expansion, keyboard-accessible slices, and interactive legend. |
| **KPI, Comparison & Progress** | `apps/web/src/components/analytics/AnalyticsMetrics.tsx` | `AnalyticsKpiCard` (`AnimatedCounter`), `AnalyticsComparisonCard`, and `AnalyticsProgressIndicator` (`role="progressbar"`). |
| **Interactive Filter & Export Bar** | `apps/web/src/components/analytics/AnalyticsFilterBar.tsx` | Segmented timeframe selector (`All` / `Weekly` / `Monthly` / `Yearly`), custom date range inputs, category/status/role dropdowns, reset action, CSV Export, and Print/PDF buttons (`@media print` chrome hiding in `globals.css`). |

---

## 2. Role-Scoped Analytics Modules Implemented

| Portal | Route & File | Real Data Sources | Charts & Controls |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/admin/platform-overview` (`apps/web/src/app/(dashboard)/admin/platform-overview/page.tsx`) | `platformApi.getAdminPlatformOverview()`, `abdmConsentApi.getAdminAnalytics()` | Role Distribution Donut, Healthcare Facility Distribution Pie, Cross-Module Platform Usage Vertical Bar, Consent Activity Horizontal Bar, Notification Delivery Comparison Card; Domain & Role filters + zero-PII CSV/Print export. |
| **Patient** | `/patient/analytics` (`apps/web/src/app/(dashboard)/patient/analytics/page.tsx`) + linked in `PatientSidebar` | `usePatientDashboard()`, `useAppointments()`, `useRecords()`, `useLabReports()` (strictly self-owned `PATIENT` JWT) | Appointment History Area Chart, Personal Health Activity Donut, Appointment Status Bar; Weekly/Monthly/Yearly + Date Range + Category filters + self-owned CSV/Print export + explicit non-diagnostic notice. |
| **Doctor** | `/doctor/analytics` (`apps/web/src/app/(dashboard)/doctor/analytics/page.tsx`) + linked in `DoctorSidebar` | `useDoctorDashboard()`, `useDoctorAppointments()`, `useDoctorEncounters()`, `useDoctorQueue()` | Appointment & Consultation Trend Area Chart, Appointment Status Donut, Completed vs. Pending Consultations Comparison Card, Live Patient Queue Bar; Weekly/Monthly/Yearly + Date Range + Status filters + de-identified CSV/Print export. |
| **Pharmacy** | `/pharmacy/analytics` (`apps/web/src/app/(dashboard)/pharmacy/analytics/page.tsx`) + upgraded `InventoryAnalyticsCharts.tsx` + linked in `PharmacySidebar` | `usePharmacyDashboardSummary()`, `usePharmacyInventoryAnalytics()`, `usePharmacyDispensingRecords()`, `usePharmacyOrders()` | Dosage Form Distribution Donut, Stock Availability & Alert Bar, Dispensing History Line Chart, Order Volume Line Chart; Weekly/Monthly/Yearly + Date Range + Dosage Category filters + CSV/Print export (zero fabricated sales/revenue). |
| **Laboratory** | `/laboratory/quality/analytics` (`apps/web/src/app/(dashboard)/laboratory/quality/analytics/page.tsx`) | `useQualityDashboard()`, `useLaboratoryDashboardSummary()`, `laboratoryReportsApi.listReports()` | Removed hardcoded `98.5%` QC fallback & Light-only `bg-white` cards; added Diagnostic Report Volume Area Chart, Sample & Processing Pipeline Bar, Report Lifecycle Donut, Test Category Pie, QC Target Progress Indicator, preserved `<QualityTrendCharts />`; Weekly/Monthly/Yearly + Date Range + Report Status filters + zero-PII CSV/Print export. |

---

## 3. Security, Privacy & Responsive Design

- **Strict Role Isolation:** Every analytics route runs inside its portal's `<ProtectedRoute allowedRoles={[...]} redirectUnauth>` boundary and queries only role-authorized backend endpoints.
- **Zero Patient PII in Aggregate Exports:** Admin, Doctor, Pharmacy, and Laboratory CSV exports strictly export aggregate counts and category/date buckets — never patient names, ABHA numbers, phone numbers, or clinical notes.
- **CSV Formula-Injection Defense:** `sanitizeCsvCell()` prefixes any cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with `'`.
- **Responsive & Printable:** All charts use fluid `viewBox` SVGs and responsive CSS grids (`1440px` / `1024px` / `768px` / `375px`) with zero horizontal overflow; `@media print` hides sidebar/topbar chrome for clean PDF/print output.

---

## 4. Executed Verification Results

- **TypeScript (`pnpm --filter @healthbridge/web type-check`):** Passed (`0` errors).
- **ESLint (`pnpm --filter @healthbridge/web lint`):** Passed (`0` errors; `0` warnings across all Phase 11 files).
- **Analytics Filter, Bucketing & CSV Security Unit Tests (`tsx`):** Passed (`15/15` assertions — verified CSV formula neutralization, RFC-4180 escaping, weekly/monthly/yearly/custom date filtering, and chronological bucketing with empty-data safety).
- **Portal Analytics Route Verification:** Confirmed `5/5` portal analytics pages exist and are wired into sidebar navigation.
- **Next.js Production Build (`rm -rf .next && pnpm --filter @healthbridge/web build`):** Passed cleanly across all `215` routes; `/admin/platform-overview` (`6.96 kB` / `158 kB`), `/doctor/analytics` (`5.78 kB` / `173 kB`), `/laboratory/quality/analytics` (`7.97 kB` / `163 kB`), `/patient/analytics` (`5.98 kB` / `173 kB`), `/pharmacy/analytics` (`5.36 kB` / `163 kB`); shared First Load JS remained flat at `87.5 kB`.

---

## 5. Remaining Limitations

- **Historical Admin Registration & Appointment Time-Series:** `GET /api/v1/platform/admin/overview` currently provides live point-in-time aggregate totals; historical date-bucketed user registration curves require a dedicated backend time-series endpoint and are intentionally not fabricated.
- **Client-Side Pagination Cap for Trend Buckets:** Patient, Doctor, Pharmacy, and Laboratory chronological trend charts aggregate up to the latest `100` authorized records returned per API request; high-volume production tenants will benefit from server-side date-bucketed aggregation endpoints.
- **Live Browser & Multi-Viewport Interactive QA:** Live Chrome DevTools verification of SVG tooltip interaction, keyboard focus traversal, print-to-PDF layout, and dark/light visual contrast should be run against the full local stack outside the sandbox.
