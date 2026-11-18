'use client';

import * as React from 'react';
import { m, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  hoverLift,
  tapFeedback,
  pageEntrance,
} from '@/lib/motion/variants';
import { MOTION_VIEWPORT } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export interface MotionRevealProps extends HTMLMotionProps<'div'> {
  inView?: boolean;
  delay?: number;
}

export function FadeIn({
  inView = false,
  delay = 0,
  children,
  className,
  ...props
}: MotionRevealProps) {
  return (
    <m.div
      variants={fadeIn}
      initial="hidden"
      {...(inView
        ? { whileInView: 'visible', viewport: MOTION_VIEWPORT }
        : { animate: 'visible' })}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
}

export interface SlideInProps extends MotionRevealProps {
  direction?: 'up' | 'down' | 'left' | 'right';
}

const directionMap = {
  up: slideUp,
  down: slideDown,
  left: slideLeft,
  right: slideRight,
} as const;

export function SlideIn({
  direction = 'up',
  inView = false,
  delay = 0,
  children,
  className,
  ...props
}: SlideInProps) {
  return (
    <m.div
      variants={directionMap[direction]}
      initial="hidden"
      {...(inView
        ? { whileInView: 'visible', viewport: MOTION_VIEWPORT }
        : { animate: 'visible' })}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function ScaleIn({
  inView = false,
  delay = 0,
  children,
  className,
  ...props
}: MotionRevealProps) {
  return (
    <m.div
      variants={scaleIn}
      initial="hidden"
      {...(inView
        ? { whileInView: 'visible', viewport: MOTION_VIEWPORT }
        : { animate: 'visible' })}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function StaggerList({
  inView = true,
  children,
  className,
  ...props
}: Omit<MotionRevealProps, 'delay'>) {
  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      {...(inView
        ? { whileInView: 'visible', viewport: MOTION_VIEWPORT }
        : { animate: 'visible' })}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <m.div variants={staggerItem} className={className} {...props}>
      {children}
    </m.div>
  );
}

export interface HoverLiftProps extends HTMLMotionProps<'div'> {
  disabled?: boolean;
  pressable?: boolean;
}

export function HoverLift({
  disabled = false,
  pressable = false,
  children,
  className,
  ...props
}: HoverLiftProps) {
  const prefersReduced = useReducedMotion();

  return (
    <m.div
      whileHover={disabled || prefersReduced ? undefined : hoverLift}
      whileTap={disabled || prefersReduced || !pressable ? undefined : tapFeedback}
      className={cn('will-change-transform', className)}
      {...props}
    >
      {children}
    </m.div>
  );
}

/**
 * Lightweight, non-blocking route content entrance.
 * Never delays navigation; immediately renders new route content with a crisp 180ms entrance.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      key={pathname}
      variants={pageEntrance}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </m.div>
  );
}
