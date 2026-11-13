'use client';

import React from 'react';
import { ReduxProvider } from './redux-provider';
import { QueryProvider } from './query-provider';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Unified Application Client Providers
 * Composes Redux Toolkit and TanStack Query with isolated client component boundaries
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <QueryProvider>{children}</QueryProvider>
    </ReduxProvider>
  );
}

export default AppProviders;
