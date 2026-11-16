'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import type { RequestAmendmentDto } from '@healthbridge/shared-types';

interface ReportAmendmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportNumber: string;
  currentVersion: number;
  onSubmit: (dto: RequestAmendmentDto) => Promise<void>;
  isSubmitting?: boolean;
}

export const ReportAmendmentDialog: React.FC<ReportAmendmentDialogProps> = ({
  isOpen,
  onClose,
  reportNumber,
  currentVersion,
  onSubmit,
  isSubmitting = false,
}) => {
  const [amendmentReason, setAmendmentReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [changedResultCodes, setChangedResultCodes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim() || amendmentReason.length < 5) {
      setValidationError('Specific statutory reason is required (min 5 characters)');
      return;
    }
    if (!explanation.trim() || explanation.length < 10) {
      setValidationError('Detailed clinical explanation of changes is required (min 10 characters)');
      return;
    }

    setValidationError(null);
    const codes = changedResultCodes
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    await onSubmit({
      amendmentReason,
      explanation,
      changedResultCodes: codes.length > 0 ? codes : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Request Report Amendment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {reportNumber} • Will generate Draft v{currentVersion + 1}.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
            <strong>NABL Audit Trail Requirement:</strong> The current version (v{currentVersion}.0)
            will remain permanently archived in the immutable version ledger. An amended draft
            will be created and must undergo formal pathologist review and re-approval before publication.
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-600 dark:text-red-400">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Statutory Reason for Correction *
            </label>
            <input
              type="text"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="e.g. Reference range recalculation after clinical correlation"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Clinical Explanation *
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Detailed justification describing analytical adjustments or clerical revisions made..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Affected Test Codes (optional, comma-separated)
            </label>
            <input
              type="text"
              value={changedResultCodes}
              onChange={(e) => setChangedResultCodes(e.target.value)}
              placeholder="e.g. HB, WBC, CHOL"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Initiating Amendment...
                </>
              ) : (
                'Create Amended Version (v' + (currentVersion + 1) + ')'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportAmendmentDialog;
