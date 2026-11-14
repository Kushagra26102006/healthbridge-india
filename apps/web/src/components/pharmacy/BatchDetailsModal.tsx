'use client';

import React from 'react';
import {
  X,
  Boxes,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PharmacyInventoryItemDto } from '@healthbridge/shared-types';

export interface BatchDetailsModalProps {
  batch: PharmacyInventoryItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust?: (batch: PharmacyInventoryItemDto) => void;
  onQuarantine?: (batch: PharmacyInventoryItemDto) => void;
  onRelease?: (batch: PharmacyInventoryItemDto) => void;
}

export function BatchDetailsModal({
  batch,
  isOpen,
  onClose,
  onAdjust,
  onQuarantine,
  onRelease,
}: BatchDetailsModalProps) {
  if (!isOpen || !batch) return null;

  const now = new Date();
  const expiry = new Date(batch.expiryDate);
  const isExpired = expiry < now;
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  Batch: {batch.batchNumber}
                </span>
                {batch.isQuarantined || batch.status === 'QUARANTINED' ? (
                  <Badge variant="outline" className="border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 text-[10px]">
                    QUARANTINED
                  </Badge>
                ) : isExpired || batch.status === 'EXPIRED' ? (
                  <Badge variant="outline" className="border-red-500/30 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 text-[10px]">
                    EXPIRED
                  </Badge>
                ) : batch.availableQuantity === 0 ? (
                  <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px]">
                    OUT OF STOCK
                  </Badge>
                ) : batch.availableQuantity <= batch.reorderLevel ? (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 text-[10px]">
                    LOW STOCK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 text-[10px]">
                    IN STOCK
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {batch.medicationName} ({batch.strength} {batch.dosageForm})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Quarantine Alert Banner */}
          {(batch.isQuarantined || batch.status === 'QUARANTINED') && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Quarantined Stock (Non-Dispensable)</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {batch.quarantineReason || 'Quarantined for quality audit. Excluded from dispensing and valuation.'}
                </p>
              </div>
            </div>
          )}

          {/* Expiry Banner if Near Expiry or Expired */}
          {isExpired ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-900 dark:text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Expired Batch (Strictly Non-Dispensable)</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Expired on {new Date(batch.expiryDate).toLocaleDateString('en-IN')}. Please write off via Stock Adjustment.
                </p>
              </div>
            </div>
          ) : daysUntilExpiry <= 30 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Near Expiry Alert ({daysUntilExpiry} days remaining)</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Batch expires on {new Date(batch.expiryDate).toLocaleDateString('en-IN')}. Prioritize dispensing or return to supplier.
                </p>
              </div>
            </div>
          ) : null}

          {/* Stock Metrics */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500">Available Stock</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {batch.availableQuantity}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Reserved</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {batch.reservedQuantity || 0}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Received Total</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {batch.receivedQuantity || batch.availableQuantity}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Reorder Threshold</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {batch.reorderLevel}
              </p>
            </div>
          </div>

          {/* Pricing & Commercial */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Purchase Cost</span>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                ₹{Number(batch.purchasePrice || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Selling Price</span>
              <p className="font-semibold text-sm text-teal-600 dark:text-teal-400 mt-0.5">
                ₹{Number(batch.sellingPrice || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Maximum Retail (MRP)</span>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                ₹{Number(batch.mrp || batch.sellingPrice).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Traceability & Dates */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> Traceability &amp; Logistics
            </h4>
            <div className="grid grid-cols-2 gap-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-500">Storage Rack / Shelf:</span>{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {batch.rackLocation || 'Not Assigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Supplier Name:</span>{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {batch.supplier || 'Standard Distributor'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Invoice / PO #:</span>{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {batch.invoiceNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Manufacturer:</span>{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {batch.manufacturer || 'Approved Pharma Mfr'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Mfg Date:</span>{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {batch.manufacturingDate
                    ? new Date(batch.manufacturingDate).toLocaleDateString('en-IN')
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Expiry Date:</span>{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(batch.expiryDate).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {batch.isQuarantined || batch.status === 'QUARANTINED' ? (
              onRelease && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onRelease(batch);
                  }}
                  className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Release Batch
                </Button>
              )
            ) : (
              onQuarantine && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onQuarantine(batch);
                  }}
                  className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Quarantine Batch
                </Button>
              )
            )}

            {onAdjust && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose();
                  onAdjust(batch);
                }}
                className="text-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Adjust Stock
              </Button>
            )}
          </div>

          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
export default BatchDetailsModal;
