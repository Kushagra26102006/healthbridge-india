'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDownToLine,
  AlertCircle,
  CheckCircle2,
  Receipt,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePharmacyMedicines, usePharmacyStockIn } from '@/features/pharmacy/hooks/use-pharmacy';
import type { PharmacyStockInDto } from '@healthbridge/shared-types';

export function StockInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMedId = searchParams.get('medicationId') || '';

  const { data: medicinesData } = usePharmacyMedicines({ limit: 100 });
  const stockInMutation = usePharmacyStockIn();

  const [selectedMedId, setSelectedMedId] = useState<string>(initialMedId);
  const [formData, setFormData] = useState<PharmacyStockInDto>({
    medicationCatalogId: initialMedId || undefined,
    medicationName: '',
    genericName: '',
    brandName: '',
    dosageForm: 'TABLET',
    strength: '',
    manufacturer: '',
    supplier: '',
    batchNumber: '',
    receivedQuantity: 100,
    reorderLevel: 20,
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    manufacturingDate: undefined,
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) as any,
    rackLocation: '',
    invoiceReference: '',
    notes: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync selected medicine from catalog dropdown
  useEffect(() => {
    if (selectedMedId && medicinesData?.items) {
      const found = medicinesData.items.find((m) => m.id === selectedMedId);
      if (found) {
        setFormData((prev) => ({
          ...prev,
          medicationCatalogId: found.id,
          medicationName: found.brandName || found.name,
          genericName: found.genericName,
          brandName: found.brandName,
          dosageForm: found.dosageForm,
          strength: found.strength,
          manufacturer: found.manufacturer,
        }));
      }
    }
  }, [selectedMedId, medicinesData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'batchNumber') {
      setFormData((prev) => ({ ...prev, batchNumber: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.medicationName.trim()) {
      setErrorMsg('Medication name is required');
      return;
    }
    if (!formData.batchNumber.trim()) {
      setErrorMsg('Batch number is required');
      return;
    }
    if (formData.receivedQuantity <= 0) {
      setErrorMsg('Received quantity must be at least 1 unit');
      return;
    }
    if (formData.purchasePrice < 0 || formData.sellingPrice < 0) {
      setErrorMsg('Pricing figures cannot be negative');
      return;
    }

    const expiryDateObj = new Date(formData.expiryDate);
    if (isNaN(expiryDateObj.getTime())) {
      setErrorMsg('A valid future expiry date is required');
      return;
    }
    if (expiryDateObj <= new Date()) {
      setErrorMsg('Cannot receive stock with an already expired date');
      return;
    }

    try {
      await stockInMutation.mutateAsync(formData);
      setSuccessMsg(`Successfully received ${formData.receivedQuantity} units for batch ${formData.batchNumber}`);
      setTimeout(() => {
        router.push('/pharmacy/inventory');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record stock intake');
    }
  };

  const totalCost = (formData.receivedQuantity || 0) * (formData.purchasePrice || 0);
  const totalRevenue = (formData.receivedQuantity || 0) * (formData.sellingPrice || 0);
  const estimatedProfitMargin = totalCost > 0 ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(1) : '0';

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
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
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Receive Stock (Stock-In Operation)</CardTitle>
              <CardDescription className="text-xs">
                Log goods receipt from supplier invoices with automated ledger entry and batch allocation.
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

          {/* Quick Select from Catalogue */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Link to Master Catalogue (Optional Auto-Fill)
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">-- Choose registered medicine from catalogue --</option>
              {medicinesData?.items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brandName || m.name} ({m.strength} {m.dosageForm}) - {m.manufacturer}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Selecting from master catalogue auto-populates generic name, strength, dosage form, and manufacturer.
            </p>
          </div>

          {/* Medication Specs */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Medication Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Trade Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="medicationName"
                  value={formData.medicationName}
                  onChange={handleChange}
                  placeholder="e.g. Dolo 650"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Strength <span className="text-red-500">*</span>
                </label>
                <Input
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g. 650 mg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dosage Form <span className="text-red-500">*</span>
                </label>
                <select
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="TABLET">Tablet</option>
                  <option value="CAPSULE">Capsule</option>
                  <option value="SYRUP">Syrup</option>
                  <option value="INJECTION">Injection</option>
                  <option value="OINTMENT">Ointment</option>
                  <option value="DROPS">Drops</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Generic Composition
                </label>
                <Input
                  name="genericName"
                  value={formData.genericName || ''}
                  onChange={handleChange}
                  placeholder="e.g. Paracetamol"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer
                </label>
                <Input
                  name="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={handleChange}
                  placeholder="e.g. Micro Labs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier / Vendor Name
                </label>
                <Input
                  name="supplier"
                  value={formData.supplier || ''}
                  onChange={handleChange}
                  placeholder="e.g. Apex Health Pharma Distributors"
                />
              </div>
            </div>
          </div>

          {/* Batch & Invoicing */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Batch Identification &amp; Invoice
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <Input
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="e.g. DL2026-A10"
                  className="font-mono uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Invoice / Challan Reference #
                </label>
                <Input
                  name="invoiceReference"
                  value={formData.invoiceReference || ''}
                  onChange={handleChange}
                  placeholder="e.g. INV-2026-8812"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rack / Shelf Location
                </label>
                <Input
                  name="rackLocation"
                  value={formData.rackLocation || ''}
                  onChange={handleChange}
                  placeholder="e.g. Rack A-12, Shelf 3"
                />
              </div>
            </div>
          </div>

          {/* Quantities & Dates */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Stock Quantity &amp; Critical Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Received Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="receivedQuantity"
                  min="1"
                  value={formData.receivedQuantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Low-Stock Reorder Threshold
                </label>
                <Input
                  type="number"
                  name="reorderLevel"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturing Date
                </label>
                <Input
                  type="date"
                  name="manufacturingDate"
                  value={formData.manufacturingDate ? String(formData.manufacturingDate).slice(0, 10) : ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="expiryDate"
                  value={String(formData.expiryDate).slice(0, 10)}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Commercial Valuation */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pricing &amp; Valuation (per Unit)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Purchase / Cost Price (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  MRP (Maximum Retail Price ₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="mrp"
                  value={formData.mrp || 0}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Live Financial Preview Card */}
            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
                <Receipt className="w-4 h-4 text-teal-600" />
                <span className="font-semibold">Financial Intake Calculation:</span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500 text-[11px]">Total Purchase Cost:</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">₹{totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Estimated Gross Revenue:</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Gross Margin:</span>
                  <p className="font-bold text-sm text-teal-600 dark:text-teal-400">{estimatedProfitMargin}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Inspection Notes / Verification Remarks
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Cold chain temperature verified at 4°C upon arrival. Seals intact."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={stockInMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={stockInMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5"
            >
              {stockInMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording Intake...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm Stock-In Receipt
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
export default StockInForm;
