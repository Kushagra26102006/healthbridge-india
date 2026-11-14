'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  usePharmacyInventory,
  usePharmacyStockAdjustment,
} from '@/features/pharmacy/hooks/use-pharmacy';
import type { InventoryAdjustmentType, PharmacyStockAdjustmentDto } from '@healthbridge/shared-types';

export interface StockAdjustmentFormProps {
  initialInventoryId?: string;
  onSuccess?: () => void;
}

export function StockAdjustmentForm({ initialInventoryId, onSuccess }: StockAdjustmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryInvId = searchParams?.get('inventoryId') || '';
  const preselectedId = initialInventoryId || queryInvId;

  const { data: inventoryData } = usePharmacyInventory({ limit: 100 });
  const adjustmentMutation = usePharmacyStockAdjustment();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(preselectedId);
  const [adjustmentType, setAdjustmentType] = useState<InventoryAdjustmentType>('CORRECTION');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedBatch = inventoryData?.items.find((b) => b.id === selectedBatchId);

  // Compute resulting stock
  const currentQty = selectedBatch?.availableQuantity ?? 0;
  let delta = 0;
  if (adjustmentType === 'INCREASE') {
    delta = quantity;
  } else if (
    adjustmentType === 'DECREASE' ||
    adjustmentType === 'DAMAGE' ||
    adjustmentType === 'EXPIRED_REMOVAL' ||
    adjustmentType === 'CORRECTION'
  ) {
    delta = -quantity;
  } else {
    // QUARANTINE / RELEASE
    delta = 0;
  }

  const resultingQty = currentQty + delta;
  const isNegative = resultingQty < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedBatchId) {
      setErrorMsg('Please select an inventory batch to adjust');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg('A specific reason of at least 3 characters is mandatory for auditing');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Adjustment quantity must be at least 1 unit');
      return;
    }
    if (isNegative && (adjustmentType === 'DECREASE' || adjustmentType === 'DAMAGE' || adjustmentType === 'EXPIRED_REMOVAL')) {
      setErrorMsg(`Cannot remove ${quantity} units; only ${currentQty} units available in batch`);
      return;
    }

    try {
      const payload: PharmacyStockAdjustmentDto = {
        inventoryId: selectedBatchId,
        adjustmentType,
        quantity,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      await adjustmentMutation.mutateAsync(payload);
      setSuccessMsg(`Successfully logged stock adjustment (${adjustmentType})`);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/pharmacy/inventory');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to inventory
        </button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Inventory Stock Adjustment</CardTitle>
              <CardDescription className="text-xs">
                Log physical cycle counts, write-offs, damages, or quarantine status with an immutable audit entry.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Select Batch */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Select Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              required
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            >
              <option value="">-- Choose inventory batch --</option>
              {inventoryData?.items.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} - {b.medicationName} ({b.strength}) | Available: {b.availableQuantity} | Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Type & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Reason / Type <span className="text-red-500">*</span>
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as InventoryAdjustmentType)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="CORRECTION">Correction (Inventory Discrepancy)</option>
                <option value="INCREASE">Increase (Surplus / Found Stock)</option>
                <option value="DECREASE">Decrease (Shortage / Shrinkage)</option>
                <option value="DAMAGE">Damage (Broken / Damaged Packaging)</option>
                <option value="EXPIRED_REMOVAL">Expired Removal (Disposal / Return)</option>
                <option value="QUARANTINE">Quarantine (Quality Audit Hold)</option>
                <option value="RELEASE_QUARANTINE">Release Quarantine (Return to Stock)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Units <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Audit Reason (Mandatory) <span className="text-red-500">*</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly cycle physical audit variance, 2 vials broken during shelf reorganization"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Recorded in the immutable transaction ledger and accessible to regulatory inspectors.
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Internal Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional additional internal remarks..."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Live Preview Box */}
          {selectedBatch && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stock Balance Verification Preview
              </span>
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-slate-500">Current Available:</span>
                  <p className="font-bold text-base text-slate-800 dark:text-slate-200">{currentQty}</p>
                </div>
                <div>
                  <span className="text-slate-500">Adjustment Delta:</span>
                  <p
                    className={`font-bold text-base ${
                      delta > 0
                        ? 'text-emerald-600'
                        : delta < 0
                        ? 'text-red-600'
                        : 'text-purple-600'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : 'Status Flag'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">New Available Balance:</span>
                  <p
                    className={`font-bold text-base ${
                      isNegative ? 'text-red-600' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {resultingQty}
                  </p>
                </div>
              </div>
              {isNegative && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  Warning: Cannot reduce available stock below zero.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={adjustmentMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adjustmentMutation.isPending || isNegative}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs gap-1.5"
            >
              {adjustmentMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying Adjustment...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm Stock Adjustment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
export default StockAdjustmentForm;
