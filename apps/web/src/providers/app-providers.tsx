'use client';

import React from 'react';
import { ReduxProvider } from './redux-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Unified Application Client Providers
 * Composes ThemeProvider, Redux Toolkit, and TanStack Query with isolated client boundaries
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <QueryProvider>{children}</QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
