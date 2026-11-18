'use client';

import * as React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useInteractionPreferences } from '@/lib/motion/preferences';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface CopyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  label?: string;
  copiedLabel?: string;
  showToast?: boolean;
  toastTitle?: string;
  size?: 'sm' | 'md';
}

/**
 * Accessible copy-to-clipboard micro-interaction button.
 * Fires subtle tactile/audio feedback strictly on explicit user click (never on hover).
 */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  showToast = false,
  toastTitle = 'Copied to clipboard',
  size = 'sm',
  className,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { triggerFeedback } = useInteractionPreferences();
  const { toast } = useToast();

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    onClick?.(e);
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      triggerFeedback('copy');
      if (showToast) {
        toast({ variant: 'success', title: toastTitle });
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      triggerFeedback('error');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface font-medium text-foreground transition-all duration-150 hover:bg-muted/80 hover:border-foreground/20 active:scale-[0.98] focus-ring select-none',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm',
        copied && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <m.span
            key="check"
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.65, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </m.span>
        ) : (
          <m.span
            key="copy"
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.65, opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="inline-flex items-center"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </m.span>
        )}
      </AnimatePresence>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}

export default CopyButton;
