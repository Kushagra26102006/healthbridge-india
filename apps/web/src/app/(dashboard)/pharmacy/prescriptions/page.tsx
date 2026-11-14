'use client';

import React, { useState } from 'react';
import { usePharmacyPrescriptionQueue } from '@/features/pharmacy/hooks/use-pharmacy';
import {
  PrescriptionQueueTable,
  PrescriptionDetailModal,
} from '@/components/pharmacy';
import type { PharmacyPrescriptionQueueItemDto } from '@healthbridge/shared-types';
import { FileText, RefreshCw } from 'lucide-react';

export default function PharmacyPrescriptionsPage() {
  const [selectedPrescription, setSelectedPrescription] =
    useState<PharmacyPrescriptionQueueItemDto | null>(null);
  const { data: queueData, isLoading, refetch } = usePharmacyPrescriptionQueue();

  const items = queueData?.items || [];
  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const completedCount = items.filter(
    (i) => i.status === 'COMPLETED' || i.status === 'DISPENSED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>ABDM E-Prescriptions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Prescription Queue & Clinical Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access authorized doctor e-prescriptions, review medication instructions, and safeguard clinical integrity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh Prescriptions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total in Queue</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {items.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Received E-Rx</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active / Pending</div>
          <div className="text-xl font-bold text-sky-600 mt-1">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting fulfillment</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-slate-500">Completed / Dispensed</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dispensations logged</div>
        </div>
      </div>

      {/* Prescriptions Table */}
      <PrescriptionQueueTable
        items={items}
        isLoading={isLoading}
        onSelectPrescription={(prescription) => setSelectedPrescription(prescription)}
      />

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        prescription={selectedPrescription}
        isOpen={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
      />
    </div>
  );
}
