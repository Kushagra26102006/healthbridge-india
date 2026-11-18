'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

/**
 * Standardized accessible confirmation modal for sensitive and destructive healthcare actions.
 * Prevents duplicate submissions while `loading` is true and restores keyboard focus on close.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const Icon = variant === 'danger' ? ShieldAlert : variant === 'warning' ? AlertTriangle : Info;
  const iconTone =
    variant === 'danger'
      ? 'bg-rose-500/15 text-error'
      : variant === 'warning'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
        : 'bg-primary/10 text-primary';

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnBackdropClick={!loading}
      size="sm"
      title={title}
      description={description}
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconTone}`}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed flex-1">
            {details ||
              'Please verify this action carefully. Sensitive clinical, privacy, and security updates are recorded in the system audit trail.'}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            size="sm"
            loading={loading}
            loadingText="Processing..."
            onClick={() => void onConfirm()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default ConfirmDialog;
