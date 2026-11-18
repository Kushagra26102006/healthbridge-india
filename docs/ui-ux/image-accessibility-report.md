# HealthBridge India — Image Accessibility & Responsive Verification Report

## 1. Automated Accessibility & Manifest Checks

### A. Unit & Manifest Accessibility Gate (`apps/web/tests/unit/ui-components-and-a11y.test.tsx`)
- **Result:** **34 / 34 frontend unit tests PASSED** (`12 / 12` in `ui-components-and-a11y.test.tsx`).
- Verified programmatically for all **24 assets** in `apps/web/src/lib/assets/image-manifest.ts`:
  - All 24 files exist on disk under `apps/web/public/images/`.
  - All 12 meaningful editorial photographs & architectural diagrams carry non-empty descriptive `alt` text (> 15 characters) explaining clinical/architectural context without repeating surrounding headings verbatim.
  - All 12 decorative empty-state SVG illustrations explicitly set `alt=""` and `aria-hidden="true"` so screen readers skip decorative graphics cleanly.
  - Every asset declares explicit positive `width` and `height` preventing layout shifts (`CLS = 0`).

### B. Live Headless Chrome CDP Verification (`scripts/qa-live-browser-audit.mjs` on Production `next start`)
Executed `2026-11-18T16:03:55Z` across 11 routes and 80 responsive viewport checks:

| Verification Check | Scope | Measured Result |
| --- | --- | --- |
| **Image Load & Decode Verification** | Full-page scroll decode of all 9 rendered `<img>` assets on `/` (7 editorial WebPs + 2 architectural SVGs) | **9 / 9 loaded (`brokenImages: []`, `naturalWidth > 0`)** |
| **Responsive Overflow Matrix** | 8 viewports (`320px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1280px`, `1440px`) × Light & Dark modes × 5 key routes | **80 / 80 PASSED (`0` horizontal overflow failures)** |
| **Image & Alt Accessibility (`axe-core@4.14.0`)** | `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` across 11 routes | **0 image / `image-alt` / SVG accessibility violations** across all 11 routes (26 passes on `/`; 1 unrelated sticky-navbar `a[aria-current="page"]` scroll-state contrast note logged for follow-up) |
| **Page Load Speed With All 9 Images (`/`)** | Headless Chrome `1440×900` production `next start` | `TTFB: 5 ms`, `FCP: 68 ms`, `Load: 70 ms` |

---

## 2. Accessibility & Motion Design Standards Enforced

- **No Text Baked Into Photographs:** All 7 editorial WebP photographs contain zero readable text, watermarks, logos, or faces; captions and headings are rendered in semantic HTML `<figcaption>`, `<h2>`, and `<p>` tags.
- **Reduced Motion Compliance:** Image hover scale (`motion-safe:group-hover:scale-[1.025]`) and desktop parallax (`ParallaxLayer`) respect `prefers-reduced-motion: reduce`.
- **Clinical Readability Preserved:** Portal header visuals hide automatically below `xl` (`hidden xl:block`) so mobile and tablet clinical dashboards keep 100% focus on actions and patient data.
- **Manual Assistive-Technology Note:** Screen-reader verification (VoiceOver / NVDA) across authenticated portal states (Patient, Doctor, Pharmacy, Laboratory, Admin empty states and ABDM diagrams) should be performed during staging sign-off.
