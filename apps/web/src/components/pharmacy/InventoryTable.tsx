'use client';

import React, { useState, useMemo } from 'react';
import type { PharmacyInventoryItemDto, InventoryStockStatus } from '@healthbridge/shared-types';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface InventoryTableProps {
  items: PharmacyInventoryItemDto[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenCreate?: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isLoading = false,
  onOpenCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.medicationName.toLowerCase().includes(query);
        const matchesGeneric = item.genericName?.toLowerCase().includes(query) ?? false;
        const matchesBatch = item.batchNumber.toLowerCase().includes(query);
        const matchesLocation = item.rackLocation?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesGeneric && !matchesBatch && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, searchTerm]);

  const getStatusBadge = (status: InventoryStockStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Out of Stock
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-300">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            Expired
          </span>
        );
      case 'DISCONTINUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Discontinued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isExpiringSoon = (expiryDateStr: string) => {
    try {
      const expiry = new Date(expiryDateStr);
      const now = new Date();
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header controls: Search & Status Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by medicine, generic, batch or rack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          {(
            [
              { label: 'All Items', value: 'ALL' },
              { label: 'In Stock', value: 'IN_STOCK' },
              { label: 'Low Stock', value: 'LOW_STOCK' },
              { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
              { label: 'Expired', value: 'EXPIRED' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Medicine & Formulation
              </th>
              <th scope="col" className="px-4 py-3.5">
                Batch No.
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Available Stock
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Selling Price
              </th>
              <th scope="col" className="px-4 py-3.5">
                Expiry Date
              </th>
              <th scope="col" className="px-4 py-3.5">
                Rack Location
              </th>
              <th scope="col" className="px-5 py-3.5 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="h-4 bg-slate-200 rounded w-36 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div>
                  </td>
                </tr>
              ))
            ) : filteredItems.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Package className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-800 mb-1">
                      No Inventory Batches Found
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'No medicines match your current filter or search criteria.'
                        : 'Your pharmacy currently has no recorded inventory items.'}
                    </p>
                    {onOpenCreate && (
                      <button
                        onClick={onOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Add First Medication Batch
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const expiringSoon = isExpiringSoon(item.expiryDate);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Medicine details */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">
                        {item.medicationName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono text-[11px]">
                          {item.dosageForm}
                        </span>
                        <span>{item.strength}</span>
                        {item.genericName && (
                          <span className="text-slate-400 truncate max-w-[140px]" title={item.genericName}>
                            • {item.genericName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Batch Number */}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                      {item.batchNumber}
                    </td>

                    {/* Stock Quantity */}
                    <td className="px-4 py-3.5 text-right font-medium">
                      <span
                        className={
                          item.availableQuantity === 0
                            ? 'text-red-600 font-bold'
                            : item.availableQuantity <= (item.reorderLevel || 10)
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-800'
                        }
                      >
                        {item.availableQuantity.toLocaleString('en-IN')} units
                      </span>
                      {item.reservedQuantity > 0 && (
                        <div className="text-[11px] text-slate-400">
                          ({item.reservedQuantity} reserved)
                        </div>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                      ₹{item.sellingPrice.toFixed(2)}
                      {item.mrp && item.mrp > item.sellingPrice && (
                        <div className="text-[11px] text-slate-400 line-through">
                          MRP ₹{item.mrp.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Expiry Date */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.expiryDate)}</span>
                      </div>
                      {item.isExpired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium mt-0.5">
                          <AlertCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : expiringSoon ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-0.5">
                          <Clock className="w-3 h-3" /> Expiring soon
                        </span>
                      ) : null}
                    </td>

                    {/* Rack Location */}
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {item.rackLocation ? (
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.rackLocation}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count indicator */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-700">{filteredItems.length}</strong> of{' '}
            <strong className="text-slate-700">{items.length}</strong> batches
          </span>
          <span className="text-[11px] text-slate-400">
            All batches strictly verified under CDSCO statutory standards
          </span>
        </div>
      )}
    </div>
  );
};

