'use client';

import React from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePharmacyInventoryAlerts } from '@/features/pharmacy/hooks/use-pharmacy';

export default function PharmacyNotificationsPage() {
  const { data: alertsData, isLoading } = usePharmacyInventoryAlerts();
  const alerts = alertsData || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
          <Bell className="w-3.5 h-3.5" />
          <span>Alerts & Activity</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Pharmacy Notifications & Critical Warnings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time updates regarding inventory stock levels, upcoming batch expirations, and prescription events.
        </p>
      </div>

      {/* Notifications / Alerts list */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            System Alerts ({alerts.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Auto-refreshed with inventory state
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading notifications...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                All Good! No Pending Warnings
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No low-stock or expiring batches currently require your attention.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isExpired = alert.alertStatus === 'EXPIRED';
              const isNearExpiry = alert.alertStatus === 'NEAR_EXPIRY';

              return (
                <div
                  key={alert.id}
                  className="p-4 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isExpired
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}
                  >
                    {isExpired ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : isNearExpiry ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-semibold text-slate-900">
                        {alert.medicineName} (Batch: {alert.batchNumber})
                      </h5>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {alert.alertStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {isExpired
                        ? `Batch ${alert.batchNumber} has expired on ${new Date(
                            alert.expiryDate
                          ).toLocaleDateString(
                            'en-IN'
                          )}. Dispensation is strictly prohibited.`
                        : isNearExpiry
                        ? `Batch ${alert.batchNumber} is nearing expiry (${new Date(
                            alert.expiryDate
                          ).toLocaleDateString(
                            'en-IN'
                          )}). Available: ${alert.availableQuantity} units.`
                        : `Stock deficit: only ${alert.availableQuantity} units remain in inventory.`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
