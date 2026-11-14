'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Lock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsentPermissionList } from './ConsentPermissionList';
import type { ConsentDetailDto, ConsentListItemDto } from '@healthbridge/shared-types';

export interface ConsentApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consent: ConsentDetailDto | ConsentListItemDto | null;
  onConfirmApprove: (consentId: string, signature?: string) => Promise<void>;
  isLoading?: boolean;
}

export const ConsentApprovalDialog: React.FC<ConsentApprovalDialogProps> = ({
  isOpen,
  onClose,
  consent,
  onConfirmApprove,
  isLoading = false,
}) => {
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !consent) return null;

  const handleApprove = async () => {
    try {
      setError(null);
      await onConfirmApprove(consent.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve consent request';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Authorize Electronic Health Access
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Please review requested permissions before confirming your digital authorization.
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

        <div className="space-y-4 py-4 text-xs">
          {/* Requester Summary */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Requesting Provider</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {consent.requesterRole}
              </Badge>
            </div>
            <p className="font-semibold text-foreground text-sm">
              {consent.organization}
            </p>
            {consent.doctorName && (
              <p className="text-muted-foreground">Attending: {consent.doctorName}</p>
            )}
          </div>

          {/* Scope of Permitted Categories */}
          <div className="space-y-1.5">
            <span className="font-semibold text-foreground block">
              Permitted Data Categories:
            </span>
            <ConsentPermissionList categories={consent.requestedDataTypes} />
          </div>

          {/* Purpose & Legal Notice */}
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-900 dark:text-teal-200 text-[11px] leading-relaxed space-y-1">
            <div className="flex items-center gap-1 font-semibold text-teal-800 dark:text-teal-300">
              <Lock className="h-3.5 w-3.5" />
              <span>ABDM Sovereign Digital Authorization</span>
            </div>
            <p>
              By approving, you grant the specified provider access to read your records under the
              Ayushman Bharat Digital Mission (ABDM) framework until expiration. You may revoke this
              permission at any time.
            </p>
          </div>

          {/* Explicit Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedAccuracy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmedAccuracy(e.target.checked)}
              className="mt-0.5 rounded border-border text-teal-600 focus:ring-teal-500 h-4 w-4"
            />
            <span className="text-[11px] text-muted-foreground leading-normal">
              I have reviewed the requesting party, purpose, and requested categories, and explicitly
              grant electronic consent.
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
            disabled={!confirmedAccuracy || isLoading}
            onClick={handleApprove}
            className="text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            {isLoading ? 'Authorizing...' : 'Confirm & Approve Access'}
          </Button>
        </div>
      </div>
    </div>
  );
};
