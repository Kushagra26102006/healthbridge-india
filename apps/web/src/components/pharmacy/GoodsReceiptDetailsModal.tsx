'use client';

import React from 'react';
import { X, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GoodsReceiptDto } from '@healthbridge/shared-types';

export interface GoodsReceiptDetailsModalProps {
  receipt: GoodsReceiptDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GoodsReceiptDetailsModal({
  receipt,
  isOpen,
  onClose,
}: GoodsReceiptDetailsModalProps) {
  if (!isOpen || !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {receipt.grnNumber}
                </h2>
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {receipt.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Received against PO: {receipt.poNumber} • Supplier: {receipt.supplierName}
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

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block">Supplier Invoice #</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {receipt.supplierInvoiceNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Invoice Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {new Date(receipt.supplierInvoiceDate).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Received Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {new Date(receipt.receivedDate).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Received By</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {receipt.receiverName}
              </span>
            </div>
          </div>

          {/* Received Items */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Received Batches & Allocation
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Medication</th>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Received / Accepted</th>
                    <th className="py-2.5 px-3">Cost Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.medicationName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.strength} • {item.dosageForm}
                        </p>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.batchNumber}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-2.5 px-3 font-medium">
                        <span className="text-emerald-600">{item.acceptedQuantity} accepted</span>
                        {item.rejectedQuantity > 0 && (
                          <span className="text-rose-600 block text-[11px]">
                            ({item.rejectedQuantity} rejected)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        ₹{item.unitPurchasePrice.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹{item.itemTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Total Stock Units Received: <strong>{receipt.totalReceivedQuantity}</strong> (
              {receipt.totalAcceptedQuantity} allocated to live inventory)
            </span>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Total Invoice Value</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                ₹{receipt.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {receipt.notes && (
            <div className="text-xs text-slate-500 italic">
              <strong>Notes:</strong> {receipt.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
