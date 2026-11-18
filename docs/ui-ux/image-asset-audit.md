# HealthBridge India — Complete Website Image & Visual Asset Audit

## 1. Pre-Integration Repository Audit

An exhaustive audit of `apps/web/public/` and `apps/web/src/` was conducted before adding any visual assets:

- **Existing Local Images (`apps/web/public/`):** **0 image files** (`public/` directory existed but was completely empty).
- **Existing `<img>` / `next/image` References Across Codebase:** Only 2 low-level primitive usages existed (`components/ui/avatar.tsx` for optional user profile avatars and `components/documents/SecureDocumentViewer.tsx` for authenticated private clinical image previews). Zero `next/image` components were in use.
- **Broken / Hotlinked / Watermarked URLs:** `0` external hotlinks or broken URLs detected.
- **Identified Visual Gaps:**
  1. **Public Landing Page (`/`):** Hero, Platform Overview, User Ecosystem (Patient / Doctor / Pharmacy / Laboratory), Privacy & Security, ABHA/ABDM Architecture, and Final CTA sections relied exclusively on Lucide icons and CSS gradients with no editorial healthcare imagery or architectural diagrams.
  2. **Role Dashboards (5 Portals):** Patient, Doctor, Pharmacy, Laboratory, and Admin welcome banners lacked domain-grounded visual identity while clinical tables needed to remain clean and distraction-free.
  3. **ABDM / ABHA & Document Vault:** Needed neutral, original explanatory diagrams (without imitating official government emblems or certificates).
  4. **Empty States, Error Recovery & Access Guards:** Used plain icon circles across Notifications, Search, Records, Appointments, Lab Reports, `ErrorState`, and `ProtectedRoute` without a cohesive illustration family.

---

## 2. Post-Integration Summary

| Area | Visual Assets Integrated | Clinical & Design Guardrails Enforced |
| --- | --- | --- |
| **Landing Page (`/`)** | `hero-healthcare-platform.webp` (priority), `platform-digital-records.webp`, 4 ecosystem WebPs (`patient`, `doctor`, `pharmacy`, `laboratory`), `privacy-consent-shield.webp`, `abdm-ecosystem-flow.svg`, `connected-healthcare-network.svg` | Cohesive bright natural daylight + soft blue/teal aesthetic; zero text/logos/faces in photos; subtle hover & desktop parallax respecting `prefers-reduced-motion` |
| **Patient Portal** | `ecosystem-patient-care.webp` in `WelcomeSection`, `document-vault-banner.svg` in `/patient/records`, `abha-identity-flow.svg` in `/patient/abha`, unified empty-state SVGs in Records, Appointments & Lab Reports | Zero decorative images inside medical record tables, prescriptions, or lab observation rows |
| **Doctor Portal** | `ecosystem-doctor-workspace.webp` in `DoctorWelcome`, `no-appointments.svg` in Doctor `AppointmentEmptyState` | Zero fabricated doctor portraits or identities; neutral workspace visual only |
| **Pharmacy Portal** | `ecosystem-pharmacy-dispensing.webp` in Pharmacy Dashboard banner, `empty-inventory.svg` & `no-prescriptions.svg` registered in `EmptyState` | Unbranded minimalist apothecary bottles — zero fake pharma brand logos |
| **Laboratory Portal** | `ecosystem-laboratory-diagnostics.webp` in Laboratory Dashboard banner, `no-lab-orders.svg` & `no-lab-reports.svg` registered in `EmptyState` | Clean clinical bench imagery; zero clutter inside analytical tables or QMS logs |
| **Admin & ABDM Consoles** | `connected-healthcare-network.svg` in Admin Dashboard banner; `abdm-ecosystem-flow.svg` & `fhir-interoperability.svg` in `/admin/integrations/abdm` | Analytical topology diagrams only — zero decorative stock photography |
| **Search, Notifications, Errors & RBAC** | `no-search-results.svg` (`/dashboard/search`), `no-notifications.svg` & `onboarding-success.svg` (`NotificationEmptyState`), `connection-error.svg` (`ErrorState`), `unauthorized-access.svg` (`ErrorState` & `ProtectedRoute`) | Lightweight `<1.1 KB` SVGs with `alt=""` and `aria-hidden="true"` |

---

## 3. Remaining Intentional Scope Boundaries

- **Real Clinician / Facility Photographs:** Intentionally omitted unless verified institution-owned assets are uploaded in production; `Avatar` continues to fall back to neutral initials.
- **Official NHA / ABDM Logos:** Intentionally omitted until official NHA branding authorization is obtained; all ABDM/ABHA graphics are neutral original architectural diagrams.
