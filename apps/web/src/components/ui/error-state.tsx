'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock, WifiOff, RotateCw, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyIllustration } from '@/components/ui/visual-asset';
import { mapApiErrorToUserError, type NormalizedUserError } from '@/lib/errors/user-error-mapper';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  error?: unknown;
  normalized?: NormalizedUserError;
  title?: string;
  message?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Consistent accessible error recovery panel (`role="alert"`).
 * Explains errors in plain language, offers safe next actions, and never leaks stack traces.
 */
export function ErrorState({
  error,
  normalized,
  title,
  message,
  onRetry,
  backHref,
  backLabel = 'Go Back',
  compact = false,
  className,
}: ErrorStateProps) {
  const info = normalized ?? mapApiErrorToUserError(error);
  const displayTitle = title ?? info.title;
  const displayMessage = message ?? info.message;

  const Icon =
    info.category === 'NETWORK'
      ? WifiOff
      : info.category === 'FORBIDDEN' || info.category === 'SESSION_EXPIRED'
        ? Lock
        : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border border-rose-200/80 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/25 text-foreground flex flex-col items-center justify-center text-center',
        compact ? 'p-5 gap-3' : 'p-8 gap-4',
        className
      )}
    >
      {!compact && (info.category === 'NETWORK' || info.category === 'FORBIDDEN' || info.category === 'SESSION_EXPIRED') ? (
        <EmptyIllustration
          asset={info.category === 'NETWORK' ? 'connection-error' : 'unauthorized-access'}
          compact
        />
      ) : (
        <div
          className="h-11 w-11 rounded-lg bg-rose-500/15 text-error flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-semibold text-foreground">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{displayMessage}</p>
        <p className="text-xs text-muted-foreground">{info.suggestedAction}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {info.requiresReauth && (
          <Button variant="primary" size="sm" asChild>
            <Link href="/login">
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign In Again</span>
            </Link>
          </Button>
        )}
        {onRetry && info.canRetry && (
          <Button variant="primary" size="sm" onClick={onRetry}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Try Again</span>
          </Button>
        )}
        {backHref && (
          <Button variant="outline" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
