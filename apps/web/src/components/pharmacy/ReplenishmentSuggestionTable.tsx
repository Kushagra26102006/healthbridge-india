'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Search,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ReplenishmentSuggestionDto, ConvertSuggestionsToRequisitionDto } from '@healthbridge/shared-types';

export interface ReplenishmentSuggestionTableProps {
  suggestions: ReplenishmentSuggestionDto[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onConvertToRequisition: (dto: ConvertSuggestionsToRequisitionDto) => Promise<void>;
  isConverting?: boolean;
}

export function ReplenishmentSuggestionTable({
  suggestions,
  isLoading = false,
  onRefresh,
  onConvertToRequisition,
  isConverting = false,
}: ReplenishmentSuggestionTableProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = suggestions.filter(
    (s) =>
      s.medicationName.toLowerCase().includes(search.toLowerCase()) ||
      s.genericName?.toLowerCase().includes(search.toLowerCase()) ||
      s.brandName?.toLowerCase().includes(search.toLowerCase()) ||
      s.preferredSupplierName?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.medicationCatalogId)));
    }
  };

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleConvert = async () => {
    const selectedItems = suggestions
      .filter((s) => selectedIds.has(s.medicationCatalogId))
      .map((s) => ({
        medicationCatalogId: s.medicationCatalogId,
        quantity: s.suggestedOrderQuantity,
        preferredSupplierId: s.preferredSupplierId,
      }));

    if (selectedItems.length === 0) return;

    await onConvertToRequisition({
      items: selectedItems,
      priority: 'HIGH',
      notes: 'Generated from automated replenishment threshold monitor',
    });

    setSelectedIds(new Set());
  };

  const totalEstimatedSpend = suggestions
    .filter((s) => selectedIds.has(s.medicationCatalogId))
    .reduce((sum, s) => sum + s.estimatedCost, 0);

  return (
    <div className="space-y-4">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search low-stock medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-1.5 h-9 text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}

          <Button
            onClick={handleConvert}
            disabled={selectedIds.size === 0 || isConverting}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9"
          >
            <PlusCircle className="w-4 h-4" />
            {isConverting
              ? 'Converting...'
              : `Convert to Requisition (${selectedIds.size})`}
          </Button>
        </div>
      </div>

      {/* Selected Total Spend Banner */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl flex items-center justify-between text-xs text-teal-900 dark:text-teal-200 animate-fade-in">
          <span>
            <strong>{selectedIds.size}</strong> medications selected for replenishment
          </span>
          <span className="font-bold">
            Est. Order Value: ₹
            {(totalEstimatedSpend / 100).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </th>
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Available / Reserved</th>
                <th className="py-3 px-4">Net Available</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Inbound (Open PO)</th>
                <th className="py-3 px-4 font-bold text-teal-600">Suggested Order</th>
                <th className="py-3 px-4">Preferred Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Calculating inventory reorder thresholds...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      All inventory stocks are healthy
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No medications are currently below their calculated reorder threshold.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedIds.has(item.medicationCatalogId);
                  const isCritical = item.netAvailableStock <= 0;

                  return (
                    <tr
                      key={item.medicationCatalogId}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-teal-50/20 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.medicationCatalogId)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {item.medicationName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.strength} • {item.dosageForm}{' '}
                            {item.brandName ? `(${item.brandName})` : ''}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.currentStock}
                        </span>{' '}
                        <span className="text-slate-400">/ {item.reservedStock} res</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {item.netAvailableStock} units
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {item.reorderLevel} units
                      </td>

                      <td className="py-3 px-4 text-xs font-mono">
                        {item.pendingInboundQuantity > 0 ? (
                          <span className="text-blue-600 font-semibold">
                            +{item.pendingInboundQuantity} units
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-teal-600 dark:text-teal-400">
                        +{item.suggestedOrderQuantity} {item.unit}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        {item.preferredSupplierName ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {item.preferredSupplierName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No supplier mapped</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
