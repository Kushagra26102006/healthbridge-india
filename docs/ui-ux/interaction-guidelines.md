# HealthBridge India — Interaction, Micro-Interaction, Haptic & Sound Guidelines (Phases 03 & 10)

> Practical engineering rules governing hover states, subtle 3D showcase tilt, shadow tokens, selective glassmorphism, healthcare micro-interactions, parallax boundaries, optional haptics, and opt-in sound feedback.

---

## 1. Global Hover & Elevation Standards

Use the shared CSS utilities from `apps/web/src/app/globals.css`, `tailwind.config.ts`, or component variants to maintain restraint and clinical clarity:

| Surface / Control | Standard Hover / Elevation Behavior | Avoid |
| :--- | :--- | :--- |
| **Primary / Secondary Buttons** | `hover:-translate-y-[0.5px]`, smooth color shift (`primary-hover`), `shadow-xs → shadow-sm`, press `active:scale-[0.98]` | Bounce animations, `scale(1.05+)` |
| **Interactive Cards & Healthcare Cards** | `<Card variant="interactive">` / `.hover-card-interactive` (`-2px` vertical lift, `shadow-hover`, subtle `border-primary/35`, `2px` top gradient highlight) | Heavy zoom or tilt in clinical views |
| **Public Marketing Hero Showcase** | `<TiltCard maxTilt={3.5}>` (GPU `rotateX`/`rotateY` spring; disabled on touch devices & reduced-motion) | Applying 3D tilt to medical forms or tables |
| **Navigation Links & Sidebar Items** | `.hover-nav-item` (`bg-muted/80`, smooth foreground shift, `.hover-icon-nudge` `+2px` icon shift) | Layout shifts or font-weight jitter |
| **Data Table Rows** | `.hover-row` (`bg-muted/50`, `150ms` transition) | Row lifting or shadows inside dense tables |
| **Icon Buttons** | Soft background fill + accessible `<Tooltip>` + crisp `.focus-ring` | Unlabeled icon-only triggers |
| **Dropdowns, Search & Notifications** | `.glass-dropdown` (`shadow-dropdown`) / `.glass-modal` (`shadow-dialog`) with `dropdownEntrance` / `modalEntrance` | Slow (>300ms) or un-animated overlays |

---

## 2. Glassmorphism & Shadow Token Boundaries

- **Approved Glass Surfaces:** Sticky navigation (`.glass-nav` + `shadow-nav`), dropdowns & notification popovers (`.glass-dropdown` + `shadow-dropdown`), floating action panels (`.glass-floating` + `shadow-float`), search overlays & dialogs (`.glass-modal` + `shadow-dialog`), and subtle marketing hero accents (`.glass-panel`).
- **Mobile Performance Guard:** Below `768px`, `.glass-nav`, `.glass-panel`, and `.glass-floating` automatically reduce blur radius to `8px` for smooth 60fps scrolling.
- **Prohibited Surfaces:** Clinical lab observation tables, medication dosage forms, prescription documents, and dense patient charts — these must remain solid high-contrast `bg-card` / `bg-surface` for medical legibility.
- **Browser Fallback:** Every `.glass-*` utility defines an opaque surface color fallback first and layers `backdrop-filter` strictly inside `@supports`.

---

## 3. Micro-Interactions & Clinical Integrity

| Pattern | Component / Hook | Rule |
| :--- | :--- | :--- |
| **Checkbox & Toggle** | `Checkbox`, `Switch` (`Toggle`) | Spring thumb glide & checkmark pop + subtle `selection` haptic on click |
| **Copy Confirmation** | `CopyButton`, `AbhaIdentityCard` | Morphs Copy → Check icon (`1800ms`) + `copy` feedback only after clipboard write resolves |
| **Global Search (`⌘K`)** | `GlobalSearchCommand` | Glassmorphism modal transition (`modalBackdrop` + `modalEntrance`), keyboard arrow navigation, Escape close, debounced + `AbortController` requests |
| **Upload Progress** | `UploadProgressBar` | GPU `scaleX` progress bar with `role="progressbar"` and explicit error state |
| **Save Pending / Result** | `SaveStatusIndicator` | Transitions cleanly across `idle → saving → saved | error` strictly bound to real mutation status |
| **Tab Active Indicator** | `Tabs` / `TabsTrigger` | Smooth underline indicator + `selection` haptic on click + `150ms` tab panel fade-in |
| **Healthcare Confirmations** | `useClinicalActionFeedback()` | Callbacks (`notifyAppointmentBooked`, `notifyPrescriptionSaved`, `notifyConsentApproved`, `notifyConsentRevoked`, `notifyPharmacyStockUpdated`, `notifyMedicineDispensed`, `notifyLabReportSubmitted`, `notifyLabReportReady`, `notifyOperationError`) **MUST ONLY be called after the real backend API promise resolves or rejects**. Never fabricate optimistic success feedback. |
| **Diagnostic Report Loading** | `LabReportLoadingState` | Smooth faded skeleton structure while diagnostic observations load |

---

## 4. Parallax Boundaries

- **Allowed ONLY on public marketing surfaces:** `HeroSection` decorative backdrop & preview card, and optional public marketing introductions via `<ParallaxLayer>`.
- **Strictly forbidden on:** Patient dashboards, Doctor clinical encounter workspaces, Prescription builders, Laboratory QMS/report screens, Pharmacy dispensing screens, and Admin/SecOps tables.
- **Mobile & Accessibility:** `<ParallaxLayer>` disables scroll transforms below `768px` and whenever `prefers-reduced-motion: reduce` is active.

---

## 5. Haptic Feedback (`src/lib/motion/haptics.ts`)

- **Mechanism:** Progressive enhancement using `navigator.vibrate(...)`.
- **Patterns:** `selection` (`8ms`), `confirm` (`12ms`), `success` (`[10, 28, 12]`), `warning` (`[16, 36, 16]`), `error` (`[22, 40, 22]`).
- **Safeguards:**
  - Rate-limited (`120ms` cooldown) so navigation or rapid taps never buzz repeatedly.
  - Silent no-op (`return false`) on desktop browsers, iOS Safari, SSR, and when `prefers-reduced-motion` is enabled.
  - User-controllable via `<InteractionPreferencesControl />` (`localStorage['healthbridge-haptics-enabled']`).

---

## 6. Optional Sound Effects (`src/lib/motion/sound.ts`) & Limitations

- **Default State:** **Strictly OFF by default** (`localStorage['healthbridge-sound-enabled'] === 'true'` required to activate).
- **Sound Generation:** Synthesizes original, gentle low-gain sine chimes (`<110ms`, gain `0.04–0.05`) using the browser's built-in **Web Audio API** — requiring zero third-party audio files and preserving strict `default-src 'self'` CSP compliance.
- **Permitted Triggers:** Selected explicit confirmation actions only (`confirm`, `success`, `error`, `toggle`, `copy`). **Never** play sounds on hover, scroll, or page load (zero autoplay).
- **Documented Limitations:**
  - Mobile browsers (especially iOS Safari in silent switch mode) and strict enterprise browser policies may suspend `AudioContext` until a direct user tap occurs; `playUiSound()` catches and gracefully degrades to a silent no-op without throwing.
  - Users with `prefers-reduced-motion: reduce` have audio cues suppressed automatically.
