'use client';

import React, { useState } from 'react';
import { useCreatePharmacyInventoryItem } from '../../features/pharmacy/hooks/use-pharmacy';
import type { CreatePharmacyInventoryItemDto } from '@healthbridge/shared-types';
import {
  X,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Ointment',
  'Gel',
  'Cream',
  'Drops',
  'Inhaler',
  'Powder',
  'Solution',
];

export const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createMutation = useCreatePharmacyInventoryItem();

  const [formData, setFormData] = useState<CreatePharmacyInventoryItemDto>({
    medicationName: '',
    genericName: '',
    brandName: '',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    batchNumber: '',
    availableQuantity: 100,
    reorderLevel: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    manufacturingDate: '',
    expiryDate: '',
    rackLocation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.medicationName.trim()) {
      newErrors.medicationName = 'Medication name is required';
    }
    if (!formData.dosageForm.trim()) {
      newErrors.dosageForm = 'Dosage form is required';
    }
    if (!formData.strength.trim()) {
      newErrors.strength = 'Strength is required (e.g. 500 mg)';
    }
    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required';
    }
    if (formData.availableQuantity < 0) {
      newErrors.availableQuantity = 'Quantity cannot be negative';
    }
    if (formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0';
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const exp = new Date(formData.expiryDate);
      if (isNaN(exp.getTime())) {
        newErrors.expiryDate = 'Invalid date format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    try {
      const payload: CreatePharmacyInventoryItemDto = {
        ...formData,
        batchNumber: formData.batchNumber.trim().toUpperCase(),
        medicationName: formData.medicationName.trim(),
        availableQuantity: Number(formData.availableQuantity),
        sellingPrice: Number(formData.sellingPrice),
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        mrp: formData.mrp ? Number(formData.mrp) : undefined,
        manufacturingDate: formData.manufacturingDate || undefined,
        genericName: formData.genericName?.trim() || undefined,
        brandName: formData.brandName?.trim() || undefined,
        manufacturer: formData.manufacturer?.trim() || undefined,
        rackLocation: formData.rackLocation?.trim() || undefined,
      };

      await createMutation.mutateAsync(payload);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to add inventory item. Please verify batch details and try again.';
      setServerError(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Add Inventory Batch
              </h3>
              <p className="text-xs text-slate-500">
                Record new verified stock received into pharmacy inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Medication details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medication Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={formData.medicationName}
                onChange={(e) =>
                  setFormData({ ...formData, medicationName: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.medicationName
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-sky-200 focus:border-sky-500'
                }`}
              />
              {errors.medicationName && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.medicationName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Generic Name (Active Ingredient)
              </label>
              <input
                type="text"
                placeholder="e.g. Acetaminophen"
                value={formData.genericName}
                onChange={(e) =>
                  setFormData({ ...formData, genericName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dosage Form <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) =>
                  setFormData({ ...formData, dosageForm: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 bg-white"
              >
                {DOSAGE_FORMS.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Strength <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 500 mg, 10 mg/ml"
                value={formData.strength}
                onChange={(e) =>
                  setFormData({ ...formData, strength: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.strength
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-sky-200 focus:border-sky-500'
                }`}
              />
              {errors.strength && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.strength}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                placeholder="e.g. Cipla Ltd."
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Batch & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. BATCH-2026-A"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    batchNumber: e.target.value.toUpperCase(),
                  })
                }
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.batchNumber
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-sky-200 focus:border-sky-500'
                }`}
              />
              {errors.batchNumber && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.batchNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity in Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.availableQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availableQuantity: parseInt(e.target.value, 10) || 0,
                  })
                }
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.availableQuantity
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-sky-200 focus:border-sky-500'
                }`}
              />
              {errors.availableQuantity && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.availableQuantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reorder Alert Level
              </label>
              <input
                type="number"
                min="1"
                value={formData.reorderLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorderLevel: parseInt(e.target.value, 10) || 10,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.sellingPrice
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-sky-200 focus:border-sky-500'
                  }`}
                />
              </div>
              {errors.sellingPrice && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.sellingPrice}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MRP (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mrp || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mrp: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rack Location
              </label>
              <input
                type="text"
                placeholder="e.g. Shelf A-03"
                value={formData.rackLocation}
                onChange={(e) =>
                  setFormData({ ...formData, rackLocation: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    manufacturingDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  errors.expiryDate
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-sky-200 focus:border-sky-500'
                }`}
              />
              {errors.expiryDate && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {errors.expiryDate}
                </p>
              )}
            </div>
          </div>

          {/* Notice on CDSCO compliance */}
          <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] flex items-center gap-2 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All batches are tracked in the audit trail. CDSCO guidelines prohibit dispensing expired batches.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Batch...
                </>
              ) : (
                'Save to Inventory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
