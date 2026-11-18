'use client';

import * as React from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { InteractionPreferencesProvider } from '@/lib/motion/preferences';

export interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * Root Motion Provider
 * - Uses LazyMotion (domAnimation) to keep client JS lean across 207 routes.
 * - Enforces MotionConfig reducedMotion="user" globally for WCAG 2.1 AA compliance.
 * - Provides opt-in sound and optional haptic preferences.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <InteractionPreferencesProvider>{children}</InteractionPreferencesProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

export default MotionProvider;
