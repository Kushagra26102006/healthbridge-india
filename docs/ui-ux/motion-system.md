# HealthBridge India — Advanced Motion & Animation System (Phase 03)

> **Engine:** `framer-motion@11.18.2` (already installed; zero new dependencies added), wrapped globally in `<LazyMotion features={domAnimation}>` + `<MotionConfig reducedMotion="user">` inside `apps/web/src/providers/motion-provider.tsx`.

---

## 1. Architecture Overview

```text
apps/web/src/
├── providers/motion-provider.tsx       # LazyMotion (domAnimation) + MotionConfig(reducedMotion="user") + InteractionPreferencesProvider
├── lib/motion/
│   ├── tokens.ts                       # Duration, easing, spring & viewport tokens
│   ├── variants.ts                     # 16 reusable Framer Motion variants & gesture presets
│   ├── haptics.ts                      # Optional Web Vibration API wrapper (rate-limited, reduced-motion aware)
│   ├── sound.ts                        # Optional Web Audio API tone synthesizer (OFF by default, CSP-safe)
│   ├── preferences.tsx                 # React Context & useInteractionPreferences() hook
│   └── index.ts
└── components/motion/
    ├── MotionPrimitives.tsx            # FadeIn, SlideIn, ScaleIn, StaggerList, StaggerItem, HoverLift, PageTransition
    ├── AnimatedCounter.tsx             # Smooth tabular-nums KPI counter (runs once per change)
    ├── ParallaxLayer.tsx               # Marketing-only lightweight scroll parallax (disabled on mobile & reduced-motion)
    ├── Accordion.tsx                   # Smooth accessible collapsible accordion
    ├── FeedbackControls.tsx            # CopyButton, UploadProgressBar, SaveStatusIndicator, SearchLoadingIndicator, InteractionPreferencesControl
    ├── ClinicalActionFeedback.tsx      # useClinicalActionFeedback() + LabReportLoadingState
    └── index.ts
```

---

## 2. Duration & Easing Tokens (`src/lib/motion/tokens.ts`)

| Token | Value | Purpose |
| :--- | :--- | :--- |
| `MOTION_DURATION.instant` | `0.10s` | Button press feedback, dropdown exit |
| `MOTION_DURATION.fast` | `0.15s` | Hover lifts, dropdown/tab transitions, modal exit |
| `MOTION_DURATION.normal` | `0.22s` | Modal entrance, section reveals, accordion expand |
| `MOTION_DURATION.moderate` | `0.30s` | Chart bar entrance, larger structural panels |
| `MOTION_DURATION.slow` | `0.42s` | Marketing hero choreography (never clinical blockers) |

### Easing Curves & Springs
- **`MOTION_EASE.standard`:** `[0.22, 1, 0.36, 1]` — smooth Apple/Linear deceleration for entrances and cards.
- **`MOTION_EASE.snappy`:** `[0.2, 0, 0, 1]` — crisp feedback for tabs, dropdowns, and hover states.
- **`MOTION_EASE.exit`:** `[0.4, 0, 1, 1]` — fast, clean exits without lingering.
- **`MOTION_SPRING.snappy`:** `{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }` — switch thumbs & toast slide-ins.
- **`MOTION_SPRING.gentle`:** `{ type: 'spring', stiffness: 280, damping: 26, mass: 0.9 }` — gentle floating elements.
- **`MOTION_VIEWPORT`:** `{ once: true, amount: 0.15 }` — triggers scroll reveals once only so cards never replay distractingly.

---

## 3. Reusable Animation Variants (`src/lib/motion/variants.ts`)

| Variant | Motion Behavior (GPU `transform` / `opacity` Only) |
| :--- | :--- |
| `fadeIn` / `fadeOut` | Opacity `0 ↔ 1` (`0.22s` in / `0.15s` out) |
| `slideUp` / `slideDown` | Opacity + `±12px` vertical translate |
| `slideLeft` / `slideRight` | Opacity + `±16px` horizontal translate |
| `scaleIn` | Opacity + `scale(0.96 → 1)` |
| `staggerContainer` + `staggerItem` | `50ms` child stagger with `10px` upward reveal |
| `hoverLift` | `y: -2px` (`0.15s` snappy) |
| `tapFeedback` | `scale: 0.98` (`0.10s` snappy) |
| `modalBackdrop` + `modalEntrance` | Backdrop fade + dialog `scale(0.97 → 1)` & `y(8 → 0)` |
| `dropdownEntrance` | Origin-aware `scale(0.97 → 1)` & `y(-4 → 0)` |
| `toastSlide` | Snappy spring entrance from `y: 14px` |
| `pageEntrance` | Non-blocking `0.18s` `y(6 → 0)` + fade route content entrance |
| `chartBarEntrance` | `scaleY(0 → 1)` GPU bar entrance |

---

## 4. Performance & Bundle Discipline

1. **`LazyMotion` (`domAnimation`):** All motion components import lightweight `m` instead of full `motion`, reducing client bundle impact across 207 routes.
2. **Transform & Opacity First:** Avoids animating `width`, `top`, `left`, or expensive layout reflows (`Accordion` is the sole explicit collapsible height exception).
3. **No Navigation Delay:** `PageTransition` keys on `usePathname()` with an immediate `180ms` entrance and zero exit blocking.
4. **Scoped Parallax:** `ParallaxLayer` runs strictly on desktop marketing hero elements (`min-width: 768px`) and detaches automatically on mobile and reduced-motion devices.
5. **Listener Cleanup:** All `matchMedia`, `keydown`, `mousedown`, `setTimeout`, and `requestAnimationFrame` handles clean up deterministically on unmount.

---

## 5. Reduced-Motion Accessibility (`prefers-reduced-motion`)

Reduced motion is enforced at **three independent layers**:
1. **CSS Layer (`globals.css`):** `@media (prefers-reduced-motion: reduce)` sets `scroll-behavior: auto` and collapses CSS animations/transitions to `0.01ms`.
2. **Framer Motion Layer (`MotionProvider`):** `<MotionConfig reducedMotion="user">` disables transform motion globally while preserving clear state visibility.
3. **Hook & Feedback Layer:** `AnimatedCounter` jumps directly to the final number; `ParallaxLayer` disables scroll transforms; `triggerHaptic()` and `playUiSound()` automatically return `false`.
