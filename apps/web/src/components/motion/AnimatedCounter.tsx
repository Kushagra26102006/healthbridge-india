'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';

export interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  className?: string;
}

/**
 * Meaningful numeric count-up for dashboard KPI statistics.
 * - Runs smoothly via requestAnimationFrame and cleans up on unmount.
 * - Does not restart unnecessarily when value is unchanged.
 * - Respects prefers-reduced-motion by rendering final value immediately.
 */
export function AnimatedCounter({
  value,
  durationMs = 550,
  decimals = 0,
  prefix = '',
  suffix = '',
  locale = 'en-IN',
  className,
}: AnimatedCounterProps) {
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(value);
  const previousValueRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (prefersReduced || !Number.isFinite(value)) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const from = previousValueRef.current;
    if (from === value) {
      setDisplayValue(value);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (value - from) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
        previousValueRef.current = value;
      }
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      previousValueRef.current = value;
    };
  }, [value, durationMs, prefersReduced]);

  const formatted = React.useMemo(() => {
    if (!Number.isFinite(displayValue)) return String(value);
    return displayValue.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [displayValue, decimals, locale, value]);

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
