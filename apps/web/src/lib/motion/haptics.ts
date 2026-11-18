/**
 * HealthBridge India — Optional Haptic Feedback (Web Vibration API)
 *
 * Rules:
 * - Strictly optional progressive enhancement; silent no-op on unsupported devices (desktop, iOS Safari).
 * - Only triggered after explicit user interactions (never during passive scroll/navigation).
 * - Automatically suppressed when prefers-reduced-motion is enabled or user disables haptics.
 * - Rate-limited to prevent repetitive vibrations.
 */

export type HapticPattern = 'selection' | 'confirm' | 'success' | 'warning' | 'error';

export const HAPTICS_STORAGE_KEY = 'healthbridge-haptics-enabled';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 8,
  confirm: 12,
  success: [10, 28, 12],
  warning: [16, 36, 16],
  error: [22, 40, 22],
};

let lastVibrateTimestamp = 0;
const MIN_INTERVAL_MS = 120;

export function isHapticsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getHapticsPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(HAPTICS_STORAGE_KEY);
    if (stored === null) return true; // Enabled gracefully on supported touch devices
    return stored === 'true';
  } catch {
    return true;
  }
}

export function setHapticsPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage errors in private mode
  }
}

export function triggerHaptic(pattern: HapticPattern = 'selection'): boolean {
  if (!isHapticsSupported()) return false;
  if (prefersReducedMotion()) return false;
  if (!getHapticsPreference()) return false;

  const now = Date.now();
  if (now - lastVibrateTimestamp < MIN_INTERVAL_MS) {
    return false;
  }
  lastVibrateTimestamp = now;

  try {
    return navigator.vibrate(PATTERNS[pattern]);
  } catch {
    return false;
  }
}

export function resetHapticThrottleForTesting(): void {
  lastVibrateTimestamp = 0;
}
