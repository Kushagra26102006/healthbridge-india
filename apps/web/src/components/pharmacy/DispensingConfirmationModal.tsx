'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, ShieldCheck, Loader2, X } from 'lucide-react';

export interface DispensingConfirmationItem {
  medicationName: string;
  strength?: string;
  batchNumber: string;
  quantityToDispense: number;
  sellingPrice: number;
  itemTotal: number;
}

export interface DispensingConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescriptionNumber: string;
  patientName: string;
  items: DispensingConfirmationItem[];
  totalQuantity: number;
  totalAmount: number;
  notes?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function DispensingConfirmationModal({
  open,
  onOpenChange,
  prescriptionNumber,
  patientName,
  items,
  totalQuantity,
  totalAmount,
  notes,
  onConfirm,
  loading = false,
}: DispensingConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirm Prescription Dispensing
              </h3>
              <p className="text-xs text-slate-500">
                Review dispensed batches, quantities and prices prior to stock deduction
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Irreversible Ledger Transaction Warning</p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                Confirming will deduct batch inventory immediately and log an immutable{' '}
                <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px] font-mono">
                  STOCK_DISPENSED
                </code>{' '}
                entry in your pharmacy transaction ledger.
              </p>
            </div>
          </div>

          {/* Prescription Metadata Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Prescription</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {prescriptionNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Patient Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {patientName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Items Dispensed</span>
              <Badge variant="secondary" className="font-bold text-xs mt-0.5">
                {items.length} item{items.length > 1 ? 's' : ''} ({totalQuantity} units)
              </Badge>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-left">Medicine</th>
                  <th className="py-2.5 px-3 text-left">Batch No.</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {it.medicationName}
                      {it.strength && (
                        <span className="text-slate-500 ml-1 font-normal">
                          ({it.strength})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {it.batchNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {it.quantityToDispense}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      ₹{it.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ₹{it.itemTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-left text-slate-700 dark:text-slate-300">
                    Grand Total
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                    {totalQuantity}
                  </td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right font-bold text-sm text-slate-900 dark:text-slate-100">
                    ₹{totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {notes && (
            <div className="text-xs bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium block">Pharmacist Dispensing Remarks:</span>
              <span className="text-slate-800 dark:text-slate-200">{notes}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading || items.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Dispensing Stock...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Dispense ({totalQuantity} units)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DispensingConfirmationModal;
