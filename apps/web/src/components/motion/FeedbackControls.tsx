'use client';

import * as React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import {
  Check,
  Copy,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  Smartphone,
  Search,
} from 'lucide-react';
import { useInteractionPreferences } from '@/lib/motion/preferences';
import { Switch } from '@/components/ui/switch';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Copy-to-clipboard button with crisp check micro-interaction + optional haptic/sound confirmation.
 */
export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string;
  label?: string;
  copiedLabel?: string;
  onCopied?: () => void;
}

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  onCopied,
  variant = 'outline',
  size = 'sm',
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const { triggerFeedback } = useInteractionPreferences();

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      triggerFeedback('copy');
      onCopied?.();
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      triggerFeedback('error');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-live="polite"
      className={cn('gap-1.5', className)}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <m.span
            key="copied"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center gap-1.5 text-success"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{copiedLabel}</span>
          </m.span>
        ) : (
          <m.span
            key="copy"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{label}</span>
          </m.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

/**
 * Upload progress indicator for medical documents and lab attachments.
 */
export interface UploadProgressBarProps {
  fileName?: string;
  /** Percentage 0..100; omit for indeterminate */
  progress?: number;
  status?: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  className?: string;
}

export function UploadProgressBar({
  fileName,
  progress,
  status = 'uploading',
  errorMessage,
  className,
}: UploadProgressBarProps) {
  const clamped = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-md border border-border bg-card p-3.5 shadow-xs flex flex-col gap-2',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground truncate">
          {fileName || 'Uploading document'}
        </span>
        <span
          className={cn(
            'font-semibold tabular-nums shrink-0',
            status === 'completed'
              ? 'text-success'
              : status === 'error'
                ? 'text-error'
                : 'text-primary'
          )}
        >
          {status === 'completed'
            ? 'Uploaded'
            : status === 'error'
              ? 'Failed'
              : clamped !== undefined
                ? `${Math.round(clamped)}%`
                : 'Uploading...'}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-pill bg-muted"
      >
        <m.div
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: status === 'completed' ? 1 : clamped !== undefined ? clamped / 100 : 0.45,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
          className={cn(
            'h-full w-full rounded-pill',
            status === 'completed'
              ? 'bg-success'
              : status === 'error'
                ? 'bg-error'
                : 'bg-primary'
          )}
        />
      </div>

      {status === 'error' && errorMessage && (
        <p className="text-xs text-error font-medium">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * Save state micro-indicator strictly driven by real backend mutation status.
 */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function SaveStatusIndicator({
  state,
  savedLabel = 'Saved',
  savingLabel = 'Saving changes...',
  errorLabel = 'Unable to save',
  className,
}: {
  state: SaveState;
  savedLabel?: string;
  savingLabel?: string;
  errorLabel?: string;
  className?: string;
}) {
  if (state === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <m.span
        key={state}
        role={state === 'error' ? 'alert' : 'status'}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16 }}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium',
          state === 'saving' && 'text-muted-foreground',
          state === 'saved' && 'text-success',
          state === 'error' && 'text-error',
          className
        )}
      >
        {state === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        {state === 'saved' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
        {state === 'error' && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
        <span>
          {state === 'saving' ? savingLabel : state === 'saved' ? savedLabel : errorLabel}
        </span>
      </m.span>
    </AnimatePresence>
  );
}

/**
 * Compact search loading state indicator.
 */
export function SearchLoadingIndicator({
  loading,
  label = 'Searching records...',
  className,
}: {
  loading: boolean;
  label?: string;
  className?: string;
}) {
  if (!loading) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2 text-xs text-muted-foreground', className)}
    >
      <Search className="h-3.5 w-3.5 text-primary animate-pulse" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/**
 * User-controlled preferences panel for optional Sound Effects (default OFF) and Haptic Feedback.
 */
export function InteractionPreferencesControl({ className }: { className?: string }) {
  const {
    soundEnabled,
    setSoundEnabled,
    soundSupported,
    hapticsEnabled,
    setHapticsEnabled,
    hapticsSupported,
    reducedMotion,
  } = useInteractionPreferences();

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col gap-4',
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-card-heading">Interaction Feedback Preferences</h3>
        <p className="text-xs text-muted-foreground">
          Optional tactile and audio confirmations for completed clinical actions.
          {reducedMotion ? ' Suppressed automatically because Reduced Motion is enabled.' : ''}
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Confirmation Sound Effects</span>
              <span className="text-xs text-muted-foreground">
                {soundSupported
                  ? 'Off by default. Plays a subtle chime only on explicit confirmation actions.'
                  : 'Web Audio API is unavailable in this browser.'}
              </span>
            </div>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            disabled={!soundSupported || reducedMotion}
            aria-label="Enable confirmation sound effects"
          />
        </div>

        <div className="flex items-start justify-between gap-3 pt-3 border-t border-border/70">
          <div className="flex items-start gap-2.5">
            <Smartphone className="h-4 w-4 text-secondary mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Haptic Feedback</span>
              <span className="text-xs text-muted-foreground">
                {hapticsSupported
                  ? 'Subtle vibration feedback on supported touch devices after explicit actions.'
                  : 'Gracefully inactive on desktop and unsupported browsers.'}
              </span>
            </div>
          </div>
          <Switch
            checked={hapticsEnabled}
            onCheckedChange={setHapticsEnabled}
            disabled={!hapticsSupported || reducedMotion}
            aria-label="Enable haptic feedback"
          />
        </div>
      </div>
    </div>
  );
}
