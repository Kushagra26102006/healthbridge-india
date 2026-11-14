'use client';

import React from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Star,
  Edit2,
  Package,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SupplierDto } from '@healthbridge/shared-types';

export interface SupplierDetailsModalProps {
  supplier: SupplierDto | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (supplier: SupplierDto) => void;
  onManageProducts?: (supplier: SupplierDto) => void;
  onCreatePO?: (supplier: SupplierDto) => void;
}

export function SupplierDetailsModal({
  supplier,
  isOpen,
  onClose,
  onEdit,
  onManageProducts,
  onCreatePO,
}: SupplierDetailsModalProps) {
  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {supplier.name}
                </h2>
                <Badge
                  className={
                    supplier.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                  }
                >
                  {supplier.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Code: {supplier.supplierCode} • Type: {supplier.supplierType}
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm">
          {/* Business & Tax Identity */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Tax & Regulatory Compliance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">GSTIN / Tax ID</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {supplier.taxId || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">PAN</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {supplier.panNumber || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Drug License</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {supplier.drugLicenseNumber || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Verification Status</span>
                <span className="inline-flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {supplier.verificationStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Supplier Rating</span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {supplier.rating?.toFixed(1) || '5.0'} / 5.0
                </span>
              </div>
            </div>
          </div>

          {/* Contact and Address */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Contact & Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>
                  {supplier.phone} {supplier.alternatePhone ? `/ ${supplier.alternatePhone}` : ''}
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {supplier.address.line1 ? `${supplier.address.line1}, ` : ''}
                  {supplier.address.city}, {supplier.address.state} - {supplier.address.postalCode},{' '}
                  {supplier.address.country}
                </span>
              </div>
            </div>
          </div>

          {/* Commercial Terms & Banking */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Commercial & Bank Settlement
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <span className="text-slate-400 block">Payment Terms</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Net {supplier.paymentTermsDays} Days
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Lead Time</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {supplier.leadTimeDays} Days
                </span>
              </div>
            </div>

            {supplier.bankDetails ? (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Bank Name</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {supplier.bankDetails.bankName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Account Number</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {supplier.bankDetails.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">IFSC Code</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {supplier.bankDetails.ifscCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Branch</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {supplier.bankDetails.branchName || 'Main Branch'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No bank settlement details configured.</p>
            )}
          </div>

          {supplier.notes && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">Notes / Instructions</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                {supplier.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {onManageProducts && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onManageProducts(supplier);
                }}
                className="gap-1.5 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Package className="w-3.5 h-3.5" />
                Product Catalogue
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(supplier);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCreatePO && supplier.status === 'ACTIVE' && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onCreatePO(supplier);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create Purchase Order
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
