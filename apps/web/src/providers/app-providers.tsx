'use client';

import React from 'react';
import { ReduxProvider } from './redux-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { MotionProvider } from './motion-provider';
import { ToastProvider } from '@/components/ui/toast';
import { LiveAnnouncerProvider } from '@/components/accessibility/LiveAnnouncer';
import { HealthBridgeChatbot } from '@/components/assistant/HealthBridgeChatbot';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Unified Application Client Providers
 * Composes ThemeProvider, MotionProvider, LiveAnnouncerProvider, ToastProvider, Redux Toolkit, and TanStack Query
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <LiveAnnouncerProvider>
          <ToastProvider>
            <ReduxProvider>
              <QueryProvider>
                {children}
                <HealthBridgeChatbot />
              </QueryProvider>
            </ReduxProvider>
          </ToastProvider>
        </LiveAnnouncerProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
