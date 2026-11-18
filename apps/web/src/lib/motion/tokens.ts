/**
 * HealthBridge India — Motion Design Tokens
 * Clinical-grade timing, easing, and viewport configuration.
 * All defaults prioritize GPU-composited transform & opacity animations.
 */

export const MOTION_DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.22,
  moderate: 0.3,
  slow: 0.42,
} as const;

export const MOTION_EASE = {
  /** Smooth deceleration inspired by Apple/Linear UI */
  standard: [0.22, 1, 0.36, 1] as const,
  /** Crisp response for buttons, tabs, and dropdowns */
  snappy: [0.2, 0, 0, 1] as const,
  /** Clean exit acceleration */
  exit: [0.4, 0, 1, 1] as const,
} as const;

export const MOTION_SPRING = {
  snappy: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 32,
    mass: 0.8,
  },
  gentle: {
    type: 'spring' as const,
    stiffness: 280,
    damping: 26,
    mass: 0.9,
  },
} as const;

export const MOTION_VIEWPORT = {
  once: true,
  amount: 0.15,
} as const;
