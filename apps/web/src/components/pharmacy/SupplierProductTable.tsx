'use client';

import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  Trash2,
  CheckCircle,
  XCircle,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  SupplierProductDto,
  CreateSupplierProductDto,
  MedicineCatalogItemDto,
} from '@healthbridge/shared-types';

export interface SupplierProductTableProps {
  products: SupplierProductDto[];
  supplierId: string;
  supplierName: string;
  catalogMedicines?: MedicineCatalogItemDto[];
  isLoading?: boolean;
  onAddProduct: (dto: CreateSupplierProductDto) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
}

export function SupplierProductTable({
  products,
  supplierId,
  supplierName,
  catalogMedicines = [],
  isLoading = false,
  onAddProduct,
  onDeleteProduct,
}: SupplierProductTableProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [moq, setMoq] = useState('1');
  const [packSize, setPackSize] = useState('10 Tablets / Strip');
  const [productCode, setProductCode] = useState('');
  const [leadTime, setLeadTime] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.medicationName.toLowerCase().includes(search.toLowerCase()) ||
      p.genericName?.toLowerCase().includes(search.toLowerCase()) ||
      p.brandName?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierProductCode?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedId) {
      setError('Please select a medication from catalog');
      return;
    }
    const priceNum = parseFloat(purchasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Valid purchase price is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddProduct({
        supplierId,
        medicationCatalogId: selectedMedId,
        purchasePrice: Math.round(priceNum * 100), // in minor units / paise
        supplierProductCode: productCode.trim() || undefined,
        minimumOrderQuantity: Number(moq) || 1,
        packSize: packSize.trim() || undefined,
        leadTimeDays: Number(leadTime) || 7,
        isAvailable: true,
      });
      setShowAddForm(false);
      setSelectedMedId('');
      setPurchasePrice('');
      setProductCode('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add product mapping');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search supplier product catalogue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1.5 h-9"
        >
          <PlusCircle className="w-4 h-4" />
          Map New Medicine
        </Button>
      </div>

      {/* Quick Add Product Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4 rounded-xl space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
              Map Medication to {supplierName}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="h-7 text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </Button>
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catalogue Medicine <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              >
                <option value="">Select Medicine...</option>
                {catalogMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.strength} {m.dosageForm})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Price (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="45.50"
                className="h-8 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Code
              </label>
              <Input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="SKU-1001"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                MOQ
              </label>
              <Input
                type="number"
                min="1"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pack Size
              </label>
              <Input
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="10 Tabs / Strip"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Time (Days)
              </label>
              <Input
                type="number"
                min="1"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs px-3"
            >
              {isSubmitting ? 'Saving...' : 'Save Product Mapping'}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Purchase Price</th>
                <th className="py-3 px-4">Pack Size & MOQ</th>
                <th className="py-3 px-4">Lead Time</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading supplier catalogue...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Boxes className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                      No mapped products found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click &quot;Map New Medicine&quot; above to link catalogue items and contracted prices.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {p.medicationName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {p.strength} • {p.dosageForm} {p.brandName ? `(${p.brandName})` : ''}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {p.supplierProductCode || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{(p.purchasePrice / 100).toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <p>{p.packSize || 'Standard'}</p>
                      <p className="text-[11px] text-slate-400">MOQ: {p.minimumOrderQuantity} units</p>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {p.leadTimeDays ? `${p.leadTimeDays} days` : 'Standard'}
                    </td>

                    <td className="py-3 px-4">
                      {p.isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Out of Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteProduct(p.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        title="Remove Mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
