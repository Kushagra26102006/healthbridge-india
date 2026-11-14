'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowDownToLine,
  SlidersHorizontal,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PharmacyAlertsSummaryDto } from '@healthbridge/shared-types';

export interface LowStockAlertProps {
  alerts: PharmacyAlertsSummaryDto | null;
  isLoading?: boolean;
}

export function LowStockAlert({ alerts, isLoading = false }: LowStockAlertProps) {
  const [activeTab, setActiveTab] = useState<'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEAR_EXPIRY' | 'QUARANTINED'>('LOW_STOCK');

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs">Aggregating inventory alert conditions...</p>
      </div>
    );
  }

  const lowCount = alerts?.lowStockAlerts.length || 0;
  const oosCount = alerts?.outOfStockAlerts.length || 0;
  const expiryCount = alerts?.nearExpiryAlerts.length || 0;
  const quarantinedCount = alerts?.quarantinedAlerts.length || 0;

  return (
    <div className="space-y-4">
      {/* Alert Category Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'LOW_STOCK'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Low Stock ({lowCount})
        </button>

        <button
          onClick={() => setActiveTab('OUT_OF_STOCK')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'OUT_OF_STOCK'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Out of Stock ({oosCount})
        </button>

        <button
          onClick={() => setActiveTab('NEAR_EXPIRY')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'NEAR_EXPIRY'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Near Expiry ({expiryCount})
        </button>

        <button
          onClick={() => setActiveTab('QUARANTINED')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'QUARANTINED'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Quarantined ({quarantinedCount})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {activeTab === 'LOW_STOCK' && (
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Medicines at or below reorder threshold ({lowCount})
              </span>
              <Link href="/pharmacy/inventory/stock-in">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 gap-1">
                  <ArrowDownToLine className="w-3 h-3" /> Reorder Stock
                </Button>
              </Link>
            </div>
            {lowCount === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                All inventory batches have healthy stock levels above reorder threshold.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts?.lowStockAlerts.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.medicationName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                        <span>Batch: {item.batchNumber}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.rackLocation || 'Rack unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                          {item.availableQuantity} units left
                        </span>
                        <div className="text-[10px] text-slate-400">Reorder at: {item.reorderLevel}</div>
                      </div>

                      <Link href={`/pharmacy/inventory/stock-in`}>
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Replenish
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'OUT_OF_STOCK' && (
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                Exhausted Inventory Batches (0 available units)
              </span>
              <Link href="/pharmacy/inventory/stock-in">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 gap-1">
                  <ArrowDownToLine className="w-3 h-3" /> Urgent Reorder
                </Button>
              </Link>
            </div>
            {oosCount === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No medicines are currently out of stock.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts?.outOfStockAlerts.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.medicationName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Batch: {item.batchNumber} • {item.rackLocation || 'Unassigned'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-800">
                        0 Units Available
                      </span>
                      <Link href="/pharmacy/inventory/stock-in">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8">
                          Restock Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'NEAR_EXPIRY' && (
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                Batches expiring within 30 days ({expiryCount})
              </span>
              <Link href="/pharmacy/inventory/expiry">
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                  View Full Expiry Report <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            {expiryCount === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No batches are expiring within the next 30 days.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts?.nearExpiryAlerts.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.medicationName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Batch: {item.batchNumber} • Expiry: {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {item.daysRemaining} days left ({item.availableQuantity} units)
                      </span>
                      <Link href={`/pharmacy/inventory/stock-adjustment?inventoryId=${item.inventoryId}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                          <SlidersHorizontal className="w-3 h-3" /> Adjust
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'QUARANTINED' && (
          <div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20">
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                Batches in Quality Investigation / Quarantine Hold ({quarantinedCount})
              </span>
            </div>
            {quarantinedCount === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No inventory batches are currently quarantined.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts?.quarantinedAlerts.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.medicationName}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                        Reason: {item.reason}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Batch: {item.batchNumber} • Units: {item.availableQuantity}
                      </div>
                    </div>

                    <Link href={`/pharmacy/inventory/batches`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        Inspect in Batches
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default LowStockAlert;
