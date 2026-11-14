'use client';

import React, { useState } from 'react';
import {
  ArrowDownToLine,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PurchaseOrderDto, ReceiveGoodsDto } from '@healthbridge/shared-types';

export interface GoodsReceivingFormProps {
  order: PurchaseOrderDto;
  onSubmit: (dto: ReceiveGoodsDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ReceivingItemState {
  purchaseOrderItemId: string;
  medicationName: string;
  dosageForm: string;
  strength: string;
  orderedQuantity: number;
  previouslyReceived: number;
  remainingQuantity: number;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  receivedQuantity: number;
  rejectedQuantity: number;
  unitPurchasePrice: number;
  sellingPrice: number;
  storageLocation: string;
  remarks: string;
  includeInReceipt: boolean;
}

export function GoodsReceivingForm({
  order,
  onSubmit,
  onCancel,
  isLoading = false,
}: GoodsReceivingFormProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextYearStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize receiving items for each line item with remaining quantity > 0
  const [items, setItems] = useState<ReceivingItemState[]>(() =>
    order.items
      .filter((it) => it.remainingQuantity > 0)
      .map((it, idx) => ({
        purchaseOrderItemId: it.id,
        medicationName: it.medicationName,
        dosageForm: it.dosageForm,
        strength: it.strength,
        orderedQuantity: it.orderedQuantity,
        previouslyReceived: it.receivedQuantity,
        remainingQuantity: it.remainingQuantity,
        batchNumber: `B-${new Date().getFullYear()}-${Math.floor(100 + idx * 10)}`,
        manufacturingDate: todayStr,
        expiryDate: nextYearStr,
        receivedQuantity: it.remainingQuantity,
        rejectedQuantity: 0,
        unitPurchasePrice: it.unitPrice,
        sellingPrice: Math.round(it.unitPrice * 1.25),
        storageLocation: 'Main Pharmacy Bay A',
        remarks: '',
        includeInReceipt: true,
      }))
  );

  const handleItemChange = (index: number, field: keyof ReceivingItemState, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const selectedItems = items.filter((it) => it.includeInReceipt);

  const totalReceivedQty = selectedItems.reduce((s, it) => s + (Number(it.receivedQuantity) || 0), 0);
  const totalAcceptedQty = selectedItems.reduce(
    (s, it) => s + Math.max(0, (Number(it.receivedQuantity) || 0) - (Number(it.rejectedQuantity) || 0)),
    0
  );
  const totalAmount = selectedItems.reduce(
    (s, it) => s + (Number(it.receivedQuantity) || 0) * (Number(it.unitPurchasePrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!invoiceNumber.trim()) {
      setError('Supplier invoice number is required for CDSCO goods receipt audit');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please select at least one line item to receive');
      return;
    }

    for (const it of selectedItems) {
      if (!it.batchNumber.trim()) {
        setError(`Batch number is required for ${it.medicationName}`);
        return;
      }
      if (!it.expiryDate) {
        setError(`Expiry date is required for ${it.medicationName}`);
        return;
      }
      if (new Date(it.expiryDate) <= new Date()) {
        setError(`Batch expiry date for ${it.medicationName} must be in the future`);
        return;
      }
      if (it.receivedQuantity <= 0) {
        setError(`Received quantity for ${it.medicationName} must be greater than zero`);
        return;
      }
      if (it.receivedQuantity > it.remainingQuantity) {
        setError(
          `Received quantity (${it.receivedQuantity}) exceeds remaining order quantity (${it.remainingQuantity}) for ${it.medicationName}`
        );
        return;
      }
      if (it.rejectedQuantity > it.receivedQuantity) {
        setError(`Rejected quantity cannot exceed received quantity for ${it.medicationName}`);
        return;
      }
    }

    try {
      const payload: ReceiveGoodsDto = {
        supplierInvoiceNumber: invoiceNumber.trim(),
        supplierInvoiceDate: invoiceDate,
        items: selectedItems.map((it) => ({
          purchaseOrderItemId: it.purchaseOrderItemId,
          batchNumber: it.batchNumber.trim(),
          manufacturingDate: it.manufacturingDate,
          expiryDate: it.expiryDate,
          receivedQuantity: Number(it.receivedQuantity),
          rejectedQuantity: Number(it.rejectedQuantity) || 0,
          unitPurchasePrice: Number(it.unitPurchasePrice),
          sellingPrice: Number(it.sellingPrice),
          mrp: Math.round(Number(it.sellingPrice) * 1.1),
          storageLocation: it.storageLocation.trim() || undefined,
          remarks: it.remarks.trim() || undefined,
        })),
        notes: notes.trim() || undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message || 'Failed to receive goods');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PO Reference & Invoice Information */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Goods Receiving Note (GRN) Intake
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Receiving against PO: {order.poNumber} • Supplier: {order.supplierName}
            </p>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 w-fit">
            {order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier Invoice Number <span className="text-rose-500">*</span>
            </label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-9876"
              className="h-10 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier Invoice Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Delivery Challan / Gate Remarks
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Seal intact, temperature verified..."
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Batch Entry Lines */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Line Items & Batch Details
          </h3>
          <p className="text-xs text-slate-400">
            {selectedItems.length} of {items.length} lines selected for intake
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.purchaseOrderItemId}
              className={`p-4 rounded-xl border transition-all ${
                item.includeInReceipt
                  ? 'border-teal-200 dark:border-teal-800 bg-teal-50/10 dark:bg-teal-950/10'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.includeInReceipt}
                    onChange={(e) =>
                      handleItemChange(index, 'includeInReceipt', e.target.checked)
                    }
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.medicationName}
                    </span>
                    <span className="text-slate-400 ml-2">
                      ({item.strength} • {item.dosageForm})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Ordered: {item.orderedQuantity}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-emerald-600">Received: {item.previouslyReceived}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-amber-600 font-bold">
                    Remaining: {item.remainingQuantity}
                  </span>
                </div>
              </div>

              {item.includeInReceipt && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Batch Number <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={item.batchNumber}
                      onChange={(e) =>
                        handleItemChange(index, 'batchNumber', e.target.value)
                      }
                      placeholder="e.g. B-2026-01"
                      className="h-8 font-mono text-xs uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Mfg Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={item.manufacturingDate}
                      onChange={(e) =>
                        handleItemChange(index, 'manufacturingDate', e.target.value)
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) =>
                        handleItemChange(index, 'expiryDate', e.target.value)
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Receive Qty <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={item.remainingQuantity}
                      value={item.receivedQuantity}
                      onChange={(e) =>
                        handleItemChange(index, 'receivedQuantity', Number(e.target.value))
                      }
                      className="h-8 text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Rejected Qty
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={item.receivedQuantity}
                      value={item.rejectedQuantity}
                      onChange={(e) =>
                        handleItemChange(index, 'rejectedQuantity', Number(e.target.value))
                      }
                      className="h-8 text-xs text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Cost Price (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPurchasePrice}
                      onChange={(e) =>
                        handleItemChange(index, 'unitPurchasePrice', Number(e.target.value))
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Selling Price (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.sellingPrice}
                      onChange={(e) =>
                        handleItemChange(index, 'sellingPrice', Number(e.target.value))
                      }
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Goods Receiving Summary Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 block">Total Received:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {totalReceivedQty} units
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Accepted to Stock:</span>
              <span className="font-bold text-emerald-600 text-sm">{totalAcceptedQty} units</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Invoiced:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedItems.length === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Allocating Inventory...' : 'Confirm Goods Receipt & Allocate Inventory'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
