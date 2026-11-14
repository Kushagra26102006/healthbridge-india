'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  SupplierDto,
  MedicineCatalogItemDto,
  CreatePurchaseOrderDto,
} from '@healthbridge/shared-types';

export interface PurchaseOrderFormProps {
  suppliers: SupplierDto[];
  catalogMedicines: MedicineCatalogItemDto[];
  initialSupplierId?: string;
  onSubmit: (dto: CreatePurchaseOrderDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormItem {
  id: string;
  medicationCatalogId: string;
  orderedQuantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  packSize: string;
  supplierProductCode: string;
  notes: string;
}

export function PurchaseOrderForm({
  suppliers,
  catalogMedicines,
  initialSupplierId,
  onSubmit,
  onCancel,
  isLoading = false,
}: PurchaseOrderFormProps) {
  const [supplierId, setSupplierId] = useState(initialSupplierId || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [terms] = useState(
    'Standard pharmaceutical procurement terms. All products must have minimum 75% shelf life remaining upon delivery.'
  );

  const [items, setItems] = useState<FormItem[]>([
    {
      id: '1',
      medicationCatalogId: '',
      orderedQuantity: 10,
      unitPrice: 50,
      discountPercent: 0,
      taxPercent: 5,
      packSize: '10 Tabs / Strip',
      supplierProductCode: '',
      notes: '',
    },
  ]);

  const [error, setError] = useState<string | null>(null);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleSupplierChange = (newSupplierId: string) => {
    setSupplierId(newSupplierId);
    const sup = suppliers.find((s) => s.id === newSupplierId);
    if (sup) {
      setPaymentTermsDays(sup.paymentTermsDays?.toString() || '30');
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        medicationCatalogId: '',
        orderedQuantity: 10,
        unitPrice: 50,
        discountPercent: 0,
        taxPercent: 5,
        packSize: '10 Tabs / Strip',
        supplierProductCode: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Live calculations
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach((item) => {
    const itemSub = (item.orderedQuantity || 0) * (item.unitPrice || 0);
    const disc = itemSub * ((item.discountPercent || 0) / 100);
    const taxable = itemSub - disc;
    const tax = taxable * ((item.taxPercent || 0) / 100);

    subtotal += itemSub;
    totalDiscount += disc;
    totalTax += tax;
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      setError('At least one line item is required');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) continue;
      if (!it.medicationCatalogId) {
        setError(`Please select a medication for line item #${i + 1}`);
        return;
      }
      if (it.orderedQuantity <= 0) {
        setError(`Ordered quantity for line item #${i + 1} must be at least 1`);
        return;
      }
      if (it.unitPrice < 0) {
        setError(`Unit price for line item #${i + 1} cannot be negative`);
        return;
      }
    }

    try {
      const payload: CreatePurchaseOrderDto = {
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        paymentTermsDays: Number(paymentTermsDays) || 30,
        deliveryAddress: selectedSupplier?.address
          ? {
              line1: selectedSupplier.address.line1,
              city: selectedSupplier.address.city,
              state: selectedSupplier.address.state,
              postalCode: selectedSupplier.address.postalCode,
              country: 'India',
            }
          : undefined,
        items: items.map((it) => ({
          medicationCatalogId: it.medicationCatalogId,
          orderedQuantity: Number(it.orderedQuantity),
          unitPrice: Number(it.unitPrice),
          discountPercent: Number(it.discountPercent) || 0,
          taxPercent: Number(it.taxPercent) || 0,
          packSize: it.packSize.trim() || undefined,
          supplierProductCode: it.supplierProductCode.trim() || undefined,
          notes: it.notes.trim() || undefined,
        })),
        notes: notes.trim() || undefined,
        termsAndConditions: terms.trim() || undefined,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message || 'Failed to create purchase order');
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

      {/* Supplier & Header Parameters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          1. Supplier & Procurement Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.supplierCode}) • {s.supplierType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expected Delivery Date
            </label>
            <Input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="h-10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Terms (Days)
            </label>
            <Input
              type="number"
              min="0"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {selectedSupplier && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex flex-wrap gap-4 text-slate-600 dark:text-slate-300">
            <span>
              <strong>GSTIN:</strong> {selectedSupplier.taxId || 'N/A'}
            </span>
            <span>
              <strong>Email:</strong> {selectedSupplier.email}
            </span>
            <span>
              <strong>Phone:</strong> {selectedSupplier.phone}
            </span>
            <span>
              <strong>City:</strong> {selectedSupplier.address.city},{' '}
              {selectedSupplier.address.state}
            </span>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            2. Purchase Order Line Items
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="text-teal-600 dark:text-teal-400 gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 min-w-[220px]">Medication</th>
                <th className="py-2.5 px-3 min-w-[90px]">Ordered Qty</th>
                <th className="py-2.5 px-3 min-w-[100px]">Unit Price (₹)</th>
                <th className="py-2.5 px-3 min-w-[80px]">Disc %</th>
                <th className="py-2.5 px-3 min-w-[80px]">Tax %</th>
                <th className="py-2.5 px-3 min-w-[110px]">Total (₹)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, index) => {
                const lineSub = (item.orderedQuantity || 0) * (item.unitPrice || 0);
                const lineDisc = lineSub * ((item.discountPercent || 0) / 100);
                const lineTax = (lineSub - lineDisc) * ((item.taxPercent || 0) / 100);
                const lineTotal = lineSub - lineDisc + lineTax;

                return (
                  <tr key={item.id} className="align-middle">
                    <td className="py-2.5 px-3">
                      <select
                        value={item.medicationCatalogId}
                        onChange={(e) =>
                          handleItemChange(index, 'medicationCatalogId', e.target.value)
                        }
                        className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-teal-500"
                        required
                      >
                        <option value="">Select Medication...</option>
                        {catalogMedicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength} {m.dosageForm})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <Input
                        type="number"
                        min="1"
                        value={item.orderedQuantity}
                        onChange={(e) =>
                          handleItemChange(index, 'orderedQuantity', Number(e.target.value))
                        }
                        className="h-8 text-xs"
                        required
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', Number(e.target.value))
                        }
                        className="h-8 text-xs"
                        required
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) =>
                          handleItemChange(index, 'discountPercent', Number(e.target.value))
                        }
                        className="h-8 text-xs"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={item.taxPercent}
                        onChange={(e) =>
                          handleItemChange(index, 'taxPercent', Number(e.target.value))
                        }
                        className="w-full h-8 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="0">0%</option>
                        <option value="5">5% (GST)</option>
                        <option value="12">12% (GST)</option>
                        <option value="18">18% (GST)</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      ₹{lineTotal.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(index)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 w-full space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Procurement Notes & Delivery Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special handling, storage temperature, or delivery instructions..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="w-full sm:w-72 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 shrink-0">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Discount:</span>
                <span className="font-medium">-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>GST / Taxes:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                +₹{totalTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Creating Order...' : 'Submit Purchase Order for Approval'}
        </Button>
      </div>
    </form>
  );
}
