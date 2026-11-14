'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierType,
} from '@healthbridge/shared-types';

export interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: SupplierDto | null;
  onSubmit: (data: CreateSupplierDto | UpdateSupplierDto) => Promise<void>;
  isLoading?: boolean;
}

export function SupplierFormModal({
  isOpen,
  onClose,
  supplier,
  onSubmit,
  isLoading = false,
}: SupplierFormModalProps) {
  const isEditing = Boolean(supplier);

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    supplierType: 'DISTRIBUTOR' as SupplierType,
    taxId: '',
    panNumber: '',
    drugLicenseNumber: '',
    email: '',
    phone: '',
    alternatePhone: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    paymentTermsDays: 30,
    leadTimeDays: 7,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        legalName: supplier.legalName || '',
        supplierType: supplier.supplierType || 'DISTRIBUTOR',
        taxId: supplier.taxId || '',
        panNumber: supplier.panNumber || '',
        drugLicenseNumber: supplier.drugLicenseNumber || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        alternatePhone: supplier.alternatePhone || '',
        line1: supplier.address?.line1 || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        postalCode: supplier.address?.postalCode || '',
        country: supplier.address?.country || 'India',
        paymentTermsDays: supplier.paymentTermsDays || 30,
        leadTimeDays: supplier.leadTimeDays || 7,
        bankName: supplier.bankDetails?.bankName || '',
        accountNumber: supplier.bankDetails?.accountNumber || '',
        ifscCode: supplier.bankDetails?.ifscCode || '',
        branchName: supplier.bankDetails?.branchName || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        supplierType: 'DISTRIBUTOR',
        taxId: '',
        panNumber: '',
        drugLicenseNumber: '',
        email: '',
        phone: '',
        alternatePhone: '',
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        paymentTermsDays: 30,
        leadTimeDays: 7,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        notes: '',
      });
    }
    setError(null);
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.city.trim() || !formData.state.trim() || !formData.postalCode.trim()) {
      setError('City, State and PIN Code are required');
      return;
    }

    try {
      const payload: CreateSupplierDto = {
        name: formData.name.trim(),
        legalName: formData.legalName.trim() || undefined,
        supplierType: formData.supplierType,
        taxId: formData.taxId.trim() || undefined,
        panNumber: formData.panNumber.trim().toUpperCase() || undefined,
        drugLicenseNumber: formData.drugLicenseNumber.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        address: {
          line1: formData.line1.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim() || 'India',
        },
        paymentTermsDays: Number(formData.paymentTermsDays) || 30,
        leadTimeDays: Number(formData.leadTimeDays) || 7,
        bankDetails:
          formData.bankName.trim() && formData.accountNumber.trim() && formData.ifscCode.trim()
            ? {
                bankName: formData.bankName.trim(),
                accountNumber: formData.accountNumber.trim(),
                ifscCode: formData.ifscCode.trim().toUpperCase(),
                branchName: formData.branchName.trim() || undefined,
              }
            : undefined,
        notes: formData.notes.trim() || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save supplier');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? `Edit Supplier: ${supplier?.name}` : 'Register New Pharmaceutical Supplier'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure procurement terms, compliance licenses, and billing details
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
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* General Information */}
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                1. General & Business Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Trade / Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cipla Direct Distributors"
                    className="h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Legal Registered Entity Name
                  </label>
                  <Input
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Cipla Healthcare Ltd."
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.supplierType}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierType: e.target.value as SupplierType })
                    }
                    className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="DISTRIBUTOR">Distributor / Stockist</option>
                    <option value="MANUFACTURER">Pharmaceutical Manufacturer</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="IMPORTER">Importer</option>
                    <option value="OTHER">Other Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN / Tax Identification
                  </label>
                  <Input
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="h-9 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    PAN Number
                  </label>
                  <Input
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    placeholder="e.g. ABCDE1234F"
                    className="h-9 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Drug License Number (Form 20B/21B)
                  </label>
                  <Input
                    value={formData.drugLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                    placeholder="e.g. DL-MH-123456"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Address */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                2. Contact & Physical Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Primary Email <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alternate / Landline Phone
                  </label>
                  <Input
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="+91 22 12345678"
                    className="h-9"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Address Line
                  </label>
                  <Input
                    value={formData.line1}
                    onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    placeholder="Warehouse / Building, Street, Area"
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="400001"
                    className="h-9"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Procurement Terms & Banking */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                3. Procurement Terms & Bank Settlement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms (Days)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.paymentTermsDays}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })
                    }
                    placeholder="30"
                    className="h-9"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Credit period in days (e.g. Net 30)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expected Delivery Lead Time (Days)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.leadTimeDays}
                    onChange={(e) =>
                      setFormData({ ...formData, leadTimeDays: Number(e.target.value) })
                    }
                    placeholder="7"
                    className="h-9"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Average fulfillment turnaround
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Number
                  </label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Account Number"
                    className="h-9 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <Input
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    placeholder="e.g. HDFC0000123"
                    className="h-9 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Branch Name
                  </label>
                  <Input
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    placeholder="Branch Name"
                    className="h-9"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional commercial notes, discount contracts, or delivery terms..."
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : isEditing ? 'Update Supplier' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
