'use client';

import React, { useState } from 'react';
import { useRejectSample } from '@/features/laboratory/hooks/use-laboratory';
import { XCircle, X, AlertCircle } from 'lucide-react';
import type { SampleRejectionReason } from '@healthbridge/shared-types';

export interface RejectSampleModalProps {
  sampleId: string;
  sampleNumber: string;
  barcode: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SAMPLE_REJECTION_REASONS: { code: SampleRejectionReason; label: string }[] = [
  { code: 'UNLABELLED_SAMPLE', label: 'Unlabelled Sample or Missing Identifier' },
  { code: 'INCORRECT_SPECIMEN', label: 'Incorrect Specimen Type / Tube Container' },
  { code: 'INSUFFICIENT_QUANTITY', label: 'Quantity Not Sufficient (QNS)' },
  { code: 'DAMAGED_CONTAINER', label: 'Damaged, Cracked or Broken Container' },
  { code: 'LEAKAGE', label: 'Specimen Leakage during Transit' },
  { code: 'EXPIRED_STABILITY_WINDOW', label: 'Stability Window or Holding Time Expired' },
  { code: 'DUPLICATE_SAMPLE', label: 'Duplicate Sample Registration' },
  { code: 'TRANSPORT_CONDITION_FAILURE', label: 'Cold Chain / Temperature Failure' },
  { code: 'OTHER', label: 'Other Pre-Analytical Quality Failure' },
];

export function RejectSampleModal({
  sampleId,
  sampleNumber,
  barcode,
  isOpen,
  onClose,
  onSuccess,
}: RejectSampleModalProps) {
  const [reasonCode, setReasonCode] =
    useState<SampleRejectionReason>('INSUFFICIENT_QUANTITY');
  const [explanation, setExplanation] = useState('');
  const [requestRecollection, setRequestRecollection] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const rejectMutation = useRejectSample();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!explanation.trim()) {
      setErrorMessage('Please provide a specific clinical reason for rejecting this specimen.');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        sampleId,
        dto: {
          reasonCode,
          explanation: explanation.trim(),
          requestRecollection,
        },
      });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Sample rejection failed'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Reject Specimen
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {sampleNumber} ({barcode})
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Rejecting this specimen marks it as unacceptable for processing in the laboratory audit ledger.
            Specimens are never deleted from records.
          </p>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Statutory Rejection Reason Code <span className="text-rose-500">*</span>
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as SampleRejectionReason)}
              className="w-full text-xs rounded-xl bg-background border border-border p-2.5 focus:outline-none focus:border-rose-500"
            >
              {SAMPLE_REJECTION_REASONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Detailed Rejection Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide exact pre-analytical defect details (e.g. gross hemolysis observed, volume < 0.5 mL)..."
              required
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-3 focus:outline-none focus:border-rose-500 min-h-[90px]"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <label className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={requestRecollection}
                onChange={(e) => setRequestRecollection(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Request immediate specimen recollection for patient</span>
            </label>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 pl-6">
              When enabled, notifications and dispatch instructions will be triggered for the collection center/phlebotomist.
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RejectSampleModal;
