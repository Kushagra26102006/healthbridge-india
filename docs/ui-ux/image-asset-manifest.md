# HealthBridge India — Visual Asset Manifest

Centralized TypeScript registry: `apps/web/src/lib/assets/image-manifest.ts` (automatically verified on disk by `apps/web/tests/unit/ui-components-and-a11y.test.tsx`).

**Total Integrated Assets:** **30** (13 optimized WebP editorial photographs + 5 original SVG architectural diagrams + 12 unified SVG empty-state illustrations).

| # | Filename (`public/images/...`) | Category | Intended Page(s) / Component(s) | Dimensions | Format | Size | Source / License | Alt Text / A11y |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `landing/hero-healthcare-platform.webp` | `landing` | `/` (`HeroSection`, `priority`) | 1200×806 | WebP | 34 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 2 | `landing/platform-digital-records.webp` | `landing` | `/` (`PlatformOverview`), `/patient/records` | 960×536 | WebP | 22 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 3 | `landing/ecosystem-patient-care.webp` | `patient` | `/` (`UserEcosystem`), `/patient/dashboard` | 880×492 | WebP | 48 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 4 | `landing/ecosystem-doctor-workspace.webp` | `doctor` | `/` (`UserEcosystem`), `/doctor/dashboard` | 880×492 | WebP | 23 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 5 | `landing/ecosystem-pharmacy-dispensing.webp` | `pharmacy` | `/` (`UserEcosystem`), `/pharmacy/dashboard` | 880×492 | WebP | 22 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 6 | `landing/ecosystem-laboratory-diagnostics.webp` | `laboratory` | `/` (`UserEcosystem`), `/laboratory/dashboard` | 880×492 | WebP | 33 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 7 | `security/privacy-consent-shield.webp` | `security` | `/` (`PrivacySection`), `/admin/security/overview` | 960×536 | WebP | 11 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 8 | `landing/service-appointments-booking.webp` | `landing` | `/` (`ServicesSection`), `/patient/appointments/book` | 880×492 | WebP | 28 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 9 | `landing/service-digital-prescriptions.webp` | `landing` | `/` (`ServicesSection`), `/patient/prescriptions` | 880×492 | WebP | 16 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 10 | `landing/service-lab-reports.webp` | `laboratory` | `/` (`ServicesSection`), `/patient/lab-reports` | 880×492 | WebP | 26 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 11 | `security/service-consent-control.webp` | `security` | `/` (`ServicesSection`), `/patient/consent` | 880×492 | WebP | 19 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 12 | `landing/how-it-works-telehealth.webp` | `doctor` | `/` (`HowItWorks`) | 960×536 | WebP | 37 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 13 | `landing/auth-portal-clinic.webp` | `landing` | `/` (`PlatformOverview`), `/login`, `/register`, `/forgot-password` | 960×536 | WebP | 61 KB | Original AI-generated asset (HealthBridge India) | Descriptive alt |
| 8 | `abdm/abdm-ecosystem-flow.svg` | `abdm` | `/` (`AbhaInformation`), `/admin/integrations/abdm` | 680×240 | SVG | 4.4 KB | Original vector diagram (HealthBridge India) | Descriptive alt |
| 9 | `abdm/abha-identity-flow.svg` | `abdm` | `/patient/abha` | 640×190 | SVG | 3.2 KB | Original vector diagram (HealthBridge India) | Descriptive alt |
| 10 | `abdm/fhir-interoperability.svg` | `abdm` | `/admin/integrations/abdm` | 640×180 | SVG | 2.8 KB | Original vector diagram (HealthBridge India) | Descriptive alt |
| 11 | `documents/document-vault-banner.svg` | `documents` | `/patient/records` | 420×200 | SVG | 1.9 KB | Original vector illustration (HealthBridge India) | Descriptive alt |
| 12 | `admin/connected-healthcare-network.svg` | `admin` | `/` (`FinalCTA`), `/admin/dashboard` | 680×220 | SVG | 2.4 KB | Original vector diagram (HealthBridge India) | Descriptive alt |
| 13 | `empty-states/no-appointments.svg` | `empty-states` | Patient & Doctor `AppointmentEmptyState` | 200×140 | SVG | 1.1 KB | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 14 | `empty-states/no-records.svg` | `empty-states` | `RecordsEmptyState`, `EmptyState` | 200×140 | SVG | 743 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 15 | `empty-states/no-prescriptions.svg` | `empty-states` | `EmptyState` (Patient / Pharmacy Rx) | 200×140 | SVG | 811 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 16 | `empty-states/no-lab-reports.svg` | `empty-states` | `LabReportsEmptyState`, `EmptyState` | 200×140 | SVG | 598 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 17 | `empty-states/no-notifications.svg` | `empty-states` | `NotificationEmptyState` | 200×140 | SVG | 685 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 18 | `empty-states/no-search-results.svg` | `empty-states` | `/dashboard/search`, `RecordsEmptyState` | 200×140 | SVG | 516 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 19 | `empty-states/empty-inventory.svg` | `empty-states` | `EmptyState` (Pharmacy Inventory) | 200×140 | SVG | 673 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 20 | `empty-states/no-lab-orders.svg` | `empty-states` | `EmptyState` (Laboratory Orders) | 200×140 | SVG | 680 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 21 | `empty-states/upload-documents.svg` | `empty-states` | `RecordsEmptyState` (First Upload) | 200×140 | SVG | 697 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 22 | `empty-states/unauthorized-access.svg` | `empty-states` | `ProtectedRoute`, `ErrorState` (401/403) | 200×140 | SVG | 614 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 23 | `empty-states/connection-error.svg` | `empty-states` | `ErrorState` (Network failures) | 200×140 | SVG | 683 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
| 24 | `empty-states/onboarding-success.svg` | `empty-states` | `NotificationEmptyState` (All Read), Onboarding | 200×140 | SVG | 588 B | Original vector illustration (HealthBridge India) | Decorative (`alt=""`) |
