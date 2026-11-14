'use client';

import React, { useState } from 'react';
import { XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConsentDetailDto, ConsentListItemDto } from '@healthbridge/shared-types';

export interface ConsentRejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consent: ConsentDetailDto | ConsentListItemDto | null;
  onConfirmReject: (consentId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConsentRejectionDialog: React.FC<ConsentRejectionDialogProps> = ({
  isOpen,
  onClose,
  consent,
  onConfirmReject,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !consent) return null;

  const handleReject = async () => {
    try {
      setError(null);
      await onConfirmReject(consent.id, reason.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject consent request';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Decline Access Request
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Decline electronic access for{' '}
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

        <div className="space-y-3 py-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            By declining this request, the requesting healthcare provider will not receive access to view your health records.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Reason for Rejection (Optional):
            </label>
            <textarea
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="e.g. Not currently receiving treatment at this facility, or consultation completed..."
              rows={3}
              className="w-full text-xs rounded-xl border border-input bg-transparent p-3 outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
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
            disabled={isLoading}
            onClick={handleReject}
            className="text-xs rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
          >
            {isLoading ? 'Declining...' : 'Decline Request'}
          </Button>
        </div>
      </div>
    </div>
  );
};
