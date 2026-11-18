'use client';

import * as React from 'react';
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TiltCardProps {
  /** Maximum tilt rotation in degrees (kept subtle: 2..5 deg) */
  maxTilt?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Restraint-driven subtle 3D perspective card for showcase / marketing previews.
 * - Uses GPU-composited rotateX/rotateY via MotionValues (zero React re-renders on pointer move).
 * - Automatically disabled on touch devices and when `prefers-reduced-motion` is enabled.
 * - Never apply to dense clinical tables or medical data entry forms.
 */
export function TiltCard({ maxTilt = 3.5, className, children }: TiltCardProps) {
  const prefersReduced = useReducedMotion();
  const [canHover, setCanHover] = React.useState(false);

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, { stiffness: 260, damping: 24, mass: 0.6 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 260, damping: 24, mass: 0.6 });

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setCanHover(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const enabled = canHover && !prefersReduced;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateXRaw.set(-py * maxTilt * 2);
    rotateYRaw.set(px * maxTilt * 2);
  };

  const handleMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective: 1100 }} className={cn('relative', className)}>
      <m.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="will-change-transform"
      >
        {children}
      </m.div>
    </div>
  );
}

export default TiltCard;
