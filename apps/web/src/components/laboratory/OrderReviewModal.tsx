'use client';

import React, { useState } from 'react';
import {
  useAcceptLabOrder,
  useRejectLabOrder,
  useClarificationLabOrder,
} from '@/features/laboratory/hooks/use-laboratory';
import { CheckCircle2, XCircle, HelpCircle, X, AlertCircle } from 'lucide-react';
import type { LaboratoryOrderDto, OrderRejectionReason } from '@healthbridge/shared-types';

export interface OrderReviewModalProps {
  order: LaboratoryOrderDto;
  mode: 'ACCEPT' | 'REJECT' | 'CLARIFY';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REJECTION_REASONS: { code: OrderRejectionReason; label: string }[] = [
  { code: 'TEST_NOT_AVAILABLE', label: 'Test Not Available in Current Catalogue' },
  { code: 'INVALID_ORDER', label: 'Invalid or Ambiguous Order Instructions' },
  { code: 'INSUFFICIENT_INFORMATION', label: 'Insufficient Clinical/Patient Information' },
  { code: 'FACILITY_UNAVAILABLE', label: 'Laboratory Facility or Instrument Unavailable' },
  { code: 'SPECIMEN_REQUIREMENT_UNSUPPORTED', label: 'Unsupported Specimen Requirement' },
  { code: 'OTHER', label: 'Other Operational or Statutory Reason' },
];

export function OrderReviewModal({
  order,
  mode,
  isOpen,
  onClose,
  onSuccess,
}: OrderReviewModalProps) {
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectionReasonCode, setRejectionReasonCode] =
    useState<OrderRejectionReason>('TEST_NOT_AVAILABLE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const acceptMutation = useAcceptLabOrder();
  const rejectMutation = useRejectLabOrder();
  const clarifyMutation = useClarificationLabOrder();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      if (mode === 'ACCEPT') {
        await acceptMutation.mutateAsync({
          orderId: order.id,
          dto: { notes: acceptNotes.trim() || undefined },
        });
      } else if (mode === 'REJECT') {
        if (!rejectionReason.trim()) {
          setErrorMessage('Please provide a detailed explanation for order rejection.');
          return;
        }
        await rejectMutation.mutateAsync({
          orderId: order.id,
          dto: {
            reasonCode: rejectionReasonCode,
            reason: rejectionReason.trim(),
          },
        });
      } else if (mode === 'CLARIFY') {
        if (!clarificationNotes.trim()) {
          setErrorMessage('Please state the clarification required from the ordering physician.');
          return;
        }
        await clarifyMutation.mutateAsync({
          orderId: order.id,
          dto: { notes: clarificationNotes.trim() },
        });
      }
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Operation failed');
    }
  };

  const isPending =
    acceptMutation.isPending || rejectMutation.isPending || clarifyMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode === 'ACCEPT' && (
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {mode === 'REJECT' && (
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600">
                <XCircle className="w-4 h-4" />
              </div>
            )}
            {mode === 'CLARIFY' && (
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <HelpCircle className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-foreground">
                {mode === 'ACCEPT' && 'Accept Laboratory Order'}
                {mode === 'REJECT' && 'Reject Laboratory Order'}
                {mode === 'CLARIFY' && 'Request Clinical Clarification'}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode-specific forms */}
          {mode === 'ACCEPT' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Accepting this order confirms that your diagnostic facility can fulfill all ordered tests
                and initiates the specimen collection and accessioning workflow.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Accessioning Notes (Optional)
                </label>
                <textarea
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  placeholder="e.g. Expedite sample collection; patient is fasting."
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-3 focus:outline-none focus:border-teal-500 min-h-[80px]"
                />
              </div>
            </div>
          )}

          {mode === 'REJECT' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Rejection requires a standardized statutory reason code and an audit log explanation. The ordering physician will be notified immediately.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Rejection Reason Code <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectionReasonCode}
                  onChange={(e) => setRejectionReasonCode(e.target.value as OrderRejectionReason)}
                  className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-rose-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Explanation / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide specific justification for rejection to the ordering physician..."
                  required
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-3 focus:outline-none focus:border-rose-500 min-h-[90px]"
                />
              </div>
            </div>
          )}

          {mode === 'CLARIFY' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Send a clarification request to the ordering physician. The order will remain in clarification status until addressed.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Clarification Required <span className="text-amber-500">*</span>
                </label>
                <textarea
                  value={clarificationNotes}
                  onChange={(e) => setClarificationNotes(e.target.value)}
                  placeholder="Specify what clinical information or specimen clarification is required..."
                  required
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-3 focus:outline-none focus:border-amber-500 min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                mode === 'ACCEPT'
                  ? 'bg-teal-600 hover:bg-teal-500'
                  : mode === 'REJECT'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              } disabled:opacity-50`}
            >
              {isPending ? 'Processing...' : mode === 'ACCEPT' ? 'Confirm Acceptance' : mode === 'REJECT' ? 'Reject Order' : 'Send Clarification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderReviewModal;
