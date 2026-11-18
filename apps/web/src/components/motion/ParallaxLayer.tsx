'use client';

import * as React from 'react';
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ParallaxLayerProps {
  /** Maximum vertical displacement in px (kept subtle: 12..36px) */
  offset?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Lightweight GPU-only scroll parallax exclusively for public marketing hero & decorative backdrops.
 * - Automatically disabled on mobile viewports (< 768px) and when prefers-reduced-motion is active.
 * - NEVER use on medical records, clinical tables, forms, or authenticated dashboards.
 */
export function ParallaxLayer({ offset = 24, className, children }: ParallaxLayerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  const enableMotion = isDesktop && !prefersReduced;

  return (
    <div ref={ref} className={cn('relative', className)}>
      {enableMotion ? (
        <m.div style={{ y }} className="will-change-transform">
          {children}
        </m.div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
