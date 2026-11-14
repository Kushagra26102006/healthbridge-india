'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConsentDetailDto, ConsentListItemDto } from '@healthbridge/shared-types';

export interface ConsentRevocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consent: ConsentDetailDto | ConsentListItemDto | null;
  onConfirmRevoke: (consentId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConsentRevocationDialog: React.FC<ConsentRevocationDialogProps> = ({
  isOpen,
  onClose,
  consent,
  onConfirmRevoke,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [confirmedNotice, setConfirmedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !consent) return null;

  const handleRevoke = async () => {
    try {
      setError(null);
      await onConfirmRevoke(consent.id, reason.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke consent permission';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Revoke Health Data Permission
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Terminate ongoing electronic access permissions for{' '}
                <span className="font-semibold text-foreground">
                  {consent.organization}
                </span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5 py-4 text-xs">
          {/* Legal / Technical Revocation Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Immediate Effect Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Revocation takes effect immediately across all HealthBridge and ABDM endpoints. Future
              queries by this healthcare provider will be blocked with a 403 Forbidden response.
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 italic">
              Note: This action terminates prospective access; it does not delete clinical notes or
              copies lawfully created by the practitioner during past consultations.
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Reason for Revocation (Optional):
            </label>
            <textarea
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="e.g. Treatment episode completed, physician switch, or privacy preference..."
              rows={3}
              className="w-full text-xs rounded-xl border border-input bg-transparent p-3 outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedNotice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmedNotice(e.target.checked)}
              className="mt-0.5 rounded border-border text-destructive focus:ring-destructive h-4 w-4"
            />
            <span className="text-[11px] text-muted-foreground leading-normal">
              I understand that revoking access will immediately prevent this provider from retrieving my
              health records.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!confirmedNotice || isLoading}
            onClick={handleRevoke}
            className="text-xs rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
          >
            {isLoading ? 'Revoking...' : 'Revoke Access Immediately'}
          </Button>
        </div>
      </div>
    </div>
  );
};
