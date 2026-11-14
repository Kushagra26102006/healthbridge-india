'use client';

import React from 'react';
import {
  Search,
  Eye,
  Edit2,
  Package,
  PlusCircle,
  Truck,
  Building2,
  Mail,
  Phone,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { SupplierDto, SupplierFilterDto } from '@healthbridge/shared-types';

export interface SupplierTableProps {
  suppliers: SupplierDto[];
  isLoading?: boolean;
  filters: SupplierFilterDto;
  onFilterChange: (filters: SupplierFilterDto) => void;
  onViewSupplier: (supplier: SupplierDto) => void;
  onEditSupplier: (supplier: SupplierDto) => void;
  onManageProducts: (supplier: SupplierDto) => void;
  onCreatePO?: (supplier: SupplierDto) => void;
  onAddNew: () => void;
  totalPages?: number;
  totalCount?: number;
}

export function SupplierTable({
  suppliers,
  isLoading = false,
  filters,
  onFilterChange,
  onViewSupplier,
  onEditSupplier,
  onManageProducts,
  onCreatePO,
  onAddNew,
  totalPages = 1,
  totalCount = 0,
}: SupplierTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Inactive
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Suspended
          </Badge>
        );
      case 'PENDING_VERIFICATION':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending Verification
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search suppliers by name, code, GSTIN, phone..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as any,
                page: 1,
              })
            }
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
          </select>

          {/* Type filter */}
          <select
            value={filters.supplierType || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                supplierType: e.target.value as any,
                page: 1,
              })
            }
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Supplier Types</option>
            <option value="DISTRIBUTOR">Distributor</option>
            <option value="MANUFACTURER">Manufacturer</option>
            <option value="WHOLESALER">Wholesaler</option>
            <option value="IMPORTER">Importer</option>
            <option value="OTHER">Other</option>
          </select>

          <Button
            onClick={onAddNew}
            className="bg-teal-600 hover:bg-teal-700 text-white shrink-0 gap-1.5 h-9"
          >
            <PlusCircle className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Terms & Lead Time</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading registered suppliers...</span>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Truck className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">
                        No suppliers found
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {filters.search || filters.status !== 'ALL'
                          ? 'Try adjusting your search criteria or filters.'
                          : 'Add your pharmaceutical suppliers, distributors and manufacturers to start managing purchase orders.'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddNew}
                        className="mt-2 text-teal-600 hover:text-teal-700"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" />
                        Register New Supplier
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {s.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {s.supplierCode}
                            </span>
                            {s.taxId && <span>GSTIN: {s.taxId}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {s.supplierType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[160px]">{s.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {s.address.city}, {s.address.state}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <p className="text-slate-700 dark:text-slate-300">
                          Net {s.paymentTermsDays} Days
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Lead: {s.leadTimeDays} days
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {s.rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(s.status)}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewSupplier(s)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onManageProducts(s)}
                          className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700"
                          title="Catalogue & Products"
                        >
                          <Package className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSupplier(s)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {onCreatePO && s.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCreatePO(s)}
                            className="h-8 px-2 text-xs text-teal-600 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                          >
                            + Order
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing {suppliers.length} of {totalCount} registered suppliers
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={Number(filters.page || 1) <= 1}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    page: Math.max(1, Number(filters.page || 1) - 1),
                  })
                }
                className="h-7 px-2 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-medium">
                Page {filters.page || 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={Number(filters.page || 1) >= totalPages}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    page: Number(filters.page || 1) + 1,
                  })
                }
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
