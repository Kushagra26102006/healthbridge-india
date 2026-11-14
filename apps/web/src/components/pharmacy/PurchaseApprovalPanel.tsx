'use client';

import React, { useState } from 'react';
import { X, XCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PurchaseOrderDto } from '@healthbridge/shared-types';

export interface PurchaseApprovalPanelProps {
  order: PurchaseOrderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, comments?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function PurchaseApprovalPanel({
  order,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: PurchaseApprovalPanelProps) {
  const [mode, setMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'APPROVE') {
        await onApprove(order.id, comments.trim() || undefined);
      } else {
        if (!rejectionReason.trim()) {
          setError('A rejection reason is required');
          return;
        }
        await onReject(order.id, rejectionReason.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                mode === 'APPROVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {mode === 'APPROVE' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'APPROVE' ? 'Approve Purchase Order' : 'Reject Purchase Order'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {order.poNumber} • {order.supplierName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PO Summary Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Items:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.items.length} medications
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Units:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.items.reduce((s, it) => s + it.orderedQuantity, 0)} units
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Order Value:</span>
              <span>₹{order.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('APPROVE');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-colors ${
                mode === 'APPROVE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Approve Order
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REJECT');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-colors ${
                mode === 'REJECT'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Reject Order
            </button>
          </div>

          {mode === 'APPROVE' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Approval Notes / Commercial Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g. Budget authorized under Monthly Pharmacy Replenishment Allocation..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for rejecting order (e.g. Price higher than contracted quotation, over-budget)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={
                mode === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
            >
              {isLoading
                ? 'Processing...'
                : mode === 'APPROVE'
                ? 'Confirm Approval'
                : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
