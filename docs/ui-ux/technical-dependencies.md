# HealthBridge India — Technology Stack, Dependencies & Animation Compatibility (Phase 01)

> **Verification Method:** Exact versions verified directly from installed `node_modules/*/package.json` and workspace manifests (`package.json`, `apps/web/package.json`, `apps/api/package.json`).

---

## 1. Exact Installed Technology Stack

### Monorepo & Tooling
| Tool / Package | Declared Range | Exact Installed Version | Location |
| :--- | :--- | :--- | :--- |
| **pnpm** | `packageManager` | `9.15.5` | Root |
| **TypeScript** | `^5.6.3` | `5.9.3` | Root / Workspaces |
| **Prettier** | `^3.3.3` | `3.x` | Root |

### Frontend (`apps/web`)
| Package | Exact Installed Version | Purpose / Current Usage |
| :--- | :--- | :--- |
| `next` | `14.2.35` | App Router framework (`reactStrictMode: true`) |
| `react` / `react-dom` | `18.3.1` | UI runtime |
| `tailwindcss` | `3.4.19` | Utility-first CSS (`darkMode: ['class']`) |
| `tailwindcss-animate` | `1.0.7` | CSS enter/exit keyframe animations (`animate-in`, `fade-in-0`, `zoom-in-95`) |
| `framer-motion` | `11.18.2` | **INSTALLED — currently imported in 0 files!** |
| `lucide-react` | `0.460.0` | Icon library across landing page and all 5 portals |
| `class-variance-authority` | `0.7.1` | Variant styling (`button.tsx`, `badge.tsx`) |
| `clsx` | `2.1.1` | Conditional class merging |
| `tailwind-merge` | `2.6.1` | Tailwind class deduplication (`cn()`) |
| `@reduxjs/toolkit` | `2.14.0` | Auth & system state store |
| `react-redux` | `^9.x` | React bindings for Redux store |
| `@tanstack/react-query` | `5.107.1` | Server state caching, mutations & SSE invalidation |
| `axios` | `1.21.1` | HTTP API client with credentials & refresh interceptor |
| `zod` | `3.25.76` | Schema validation via `@healthbridge/validation` |

### Backend (`apps/api`)
| Package | Exact Installed Version | Purpose |
| :--- | :--- | :--- |
| `express` | `4.22.3` | REST API & SSE HTTP server |
| `mongoose` | `8.24.9` | MongoDB Atlas ODM |
| `jsonwebtoken` | `9.0.3` | JWT access & refresh token signing |
| `bcryptjs` | `2.4.3` | Password hashing |
| `helmet` | `8.3.0` | HTTP security headers |
| `zod` | `3.25.76` | Request & env validation |
| `pino` | `10.4.0` | Structured JSON logging |
| `vitest` | `5.1.0` | Automated unit/integration/security test runner (798 passing tests) |

---

## 2. Packages Explicitly Checked — NOT Installed

| Package | Installed? | Impact / Recommendation |
| :--- | :---: | :--- |
| `motion` (standalone v12 package) | **No** | Not needed — `framer-motion@11.18.2` is already installed and fully compatible with React `18.3.1` and Next.js `14.2.35`. |
| `@radix-ui/*` (e.g. `react-dialog`, `react-slot`, `react-dropdown-menu`) | **No** | Currently 0 Radix packages installed (`components.json` does not exist). Either add lightweight targeted primitives (`@radix-ui/react-slot`, `@radix-ui/react-dialog`) in Phase 02 OR build zero-dependency accessible focus-trapped primitives. |
| `gsap` | **No** | **Do not install.** Unnecessary bundle weight; `framer-motion` + CSS covers all SaaS healthcare motion needs cleanly. |
| `three` / `@react-three/fiber` | **No** | **Do not install.** High GPU/bundle cost and poor ROI for clinical SaaS workflows; use crisp vector/SVG + subtle glassmorphism layers instead. |
| `sonner` / `react-hot-toast` | **No** | Optional lightweight addition in Phase 02 (or custom accessible toast region backed by existing notification system). |
| `next/font` usage | **Built into Next 14 (0 imports)** | **Zero install required!** Use `next/font/google` (`Plus_Jakarta_Sans` / `Inter` + `JetBrains_Mono`), which Next.js self-hosts at build time, keeping `font-src 'self' data:` CSP 100% intact. |

---

## 3. Animation, Visual Effects & Progressive Enhancement Compatibility Matrix

| Capability | Compatibility with Current Stack | Recommended Simplest Implementation | Zero New Dependencies? |
| :--- | :--- | :--- | :---: |
| **Smooth Hover & Micro-Interactions** | Full (Tailwind 3.4 + `framer-motion@11.18.2`) | CSS GPU-composited transitions (`transform`, `opacity`) for buttons/cards + `motion.div` spring tap/hover on key CTAs and metric cards. | Yes |
| **Page & Section Transitions** | Full (`framer-motion@11.18.2` + App Router) | Lightweight `<PageTransition>` client wrapper (`opacity`, `y: 8 -> 0`, `180ms` ease-out) in portal layouts; avoid blocking navigation or heavy exit delays. | Yes |
| **Scroll-Triggered Reveals & Subtle Parallax** | Full (`framer-motion@11.18.2`) | `whileInView` with `viewport={{ once: true, amount: 0.2 }}` for landing sections + `useScroll` / `useTransform` on hero visual card (strictly GPU `transform` only, disabled under reduced motion). | Yes |
| **Glassmorphism & Surface Depth** | Full (Tailwind `backdrop-blur-md` / `backdrop-blur-xl` + translucent HSL tokens) | Define semantic surface tokens (`glass-card`, `glass-header`) using valid Tailwind v3 classes (`backdrop-blur-md`, `shadow-sm`/`shadow-md`, `/80` or `/90` opacity) — replacing the 270 broken Tailwind v4 classes (`shadow-xs`, `backdrop-blur-xs`, `/98`). | Yes |
| **Reduced-Motion Accessibility (`prefers-reduced-motion`)** | **Currently Missing (0 occurrences)** | Wrap `AppProviders` in `<MotionConfig reducedMotion="user">` + add `@media (prefers-reduced-motion: reduce)` rule in `globals.css` disabling `scroll-behavior: smooth`, `animate-ping`, `animate-float`, and transitions. | Yes |
| **Haptic Feedback (Mobile Touch)** | Progressive Enhancement (Web Vibration API) | Create a tiny `useHaptics()` utility checking `'vibrate' in navigator`, user preference toggle, and `!prefersReducedMotion` (`navigator.vibrate(10)` on primary confirmations, silent no-op on iOS Safari/desktop). | Yes |
| **Optional Subtle UI Sound Effects** | Progressive Enhancement (Web Audio API) | Create an **opt-in (default OFF)** `useSoundFeedback()` utility synthesizing soft <60ms Web Audio sine tones (no external MP3/WAV assets, CSP-safe, zero network requests, muted by default for clinical environments). | Yes |

---

## 4. Compatibility Warnings & Constraints

1. **Tailwind CSS v3.4.19 vs. v4 Class Drift:** Do NOT upgrade to Tailwind v4 during UI enhancement (high breaking-change risk across 500+ files). Instead, audit and replace all Tailwind v4-only classes (`shadow-xs`, `backdrop-blur-xs`, `/98`) with valid Tailwind v3.4 classes or custom utilities in `tailwind.config.ts`.
2. **React 18 + Framer Motion 11:** Fully compatible (`framer-motion@11.18.2` targets React 18). Use `LazyMotion` with `domAnimation` features to keep client JS bundle lean across 207 routes.
3. **Strict CSP (`next.config.mjs`):** `font-src 'self' data:` and `img-src 'self' data: blob:` forbid external Google Fonts `<link>` tags or external CDN scripts; `next/font/google` works cleanly because Next.js downloads and serves font files locally from `'self'`.
4. **Performance Budget:** Avoid `backdrop-blur` on large scrolling table containers or stacked cards inside long lists (causes GPU compositing jank on mid-range clinical workstations and mobile devices); reserve glassmorphism for sticky topbars, modals, command palette, and hero highlights.
