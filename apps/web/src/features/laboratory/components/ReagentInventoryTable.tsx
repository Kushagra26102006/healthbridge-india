'use client';

import React from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  Layers,
  Thermometer,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import type { ReagentDto } from '@healthbridge/shared-types';

interface ReagentInventoryTableProps {
  reagents: ReagentDto[];
  loading?: boolean;
  onReceiveLot: (reagent: ReagentDto) => void;
  onRecordStock: (reagent: ReagentDto) => void;
  onEditReagent: (reagent: ReagentDto) => void;
}

export function ReagentInventoryTable({
  reagents,
  loading,
  onReceiveLot,
  onRecordStock,
  onEditReagent,
}: ReagentInventoryTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-teal-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading reagent inventory...</p>
      </div>
    );
  }

  if (reagents.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Reagents Registered</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Define reagent catalog items, storage conditions, and safety thresholds to begin tracking inventory.
        </p>
      </div>
    );
  }

  const formatStorage = (cond: string) => {
    switch (cond) {
      case 'REFRIGERATED_2_8C':
        return '2°C to 8°C (Refrig)';
      case 'ROOM_TEMPERATURE':
        return '15°C to 25°C (Ambient)';
      case 'FROZEN_MINUS_20C':
        return '-20°C (Frozen)';
      case 'DEEP_FREEZE_MINUS_80C':
        return '-80°C (Deep Freeze)';
      default:
        return cond;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Item & Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Storage Condition</th>
              <th className="py-3 px-4">Stock Level</th>
              <th className="py-3 px-4">Active Lots</th>
              <th className="py-3 px-4">Associated Tests</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {reagents.map((r) => {
              const isLowStock = r.currentStock <= r.minimumStockLevel;
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{r.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
                            {r.reagentCode}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {r.manufacturer} • Cat #{r.catalogNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {r.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                      <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                      {formatStorage(r.storageConditions)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            isLowStock ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {r.currentStock} {r.unit}
                        </span>
                        {isLowStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock (Min: {r.minimumStockLevel})
                          </span>
                        )}
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isLowStock ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(10, (r.currentStock / (r.minimumStockLevel * 2 || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">
                        {r.activeLotsCount ?? 0} active
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {r.associatedTestCodes && r.associatedTestCodes.length > 0 ? (
                        r.associatedTestCodes.map((code) => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] rounded border border-slate-200"
                          >
                            {code}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">None mapped</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onReceiveLot(r)}
                        title="Receive New Lot"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200/60"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRecordStock(r)}
                        title="Record Stock Movement"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200/60"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditReagent(r)}
                        title="Edit Item Catalog"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/laboratory/inventory/reagents/${r.id}`}
                        title="View Lots & Ledger"
                        className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200/60 flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
