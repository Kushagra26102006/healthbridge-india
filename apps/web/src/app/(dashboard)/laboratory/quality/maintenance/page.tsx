'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  useMaintenance,
  useInstruments,
} from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { MaintenanceModal } from '@/features/laboratory/components/MaintenanceModal';
import type { InstrumentMaintenanceDto } from '@healthbridge/shared-types';

export default function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState('');
  const [completingRecord, setCompletingRecord] = useState<InstrumentMaintenanceDto | null>(null);

  const { maintenance, loading, refetch } = useMaintenance({
    status: statusFilter || undefined,
    maintenanceType: typeFilter || undefined,
  });
  const { instruments } = useInstruments();

  const handleScheduleMaintenance = async (instrumentId: string, dto: any) => {
    await laboratoryQualityApi.scheduleMaintenance(instrumentId, dto);
    await refetch();
  };

  const handleCompleteMaintenance = async (instrumentId: string, maintId: string, dto: any) => {
    await laboratoryQualityApi.completeMaintenance(instrumentId, maintId, dto);
    setCompletingRecord(null);
    await refetch();
  };

  const filteredMaintenance = maintenance.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.maintenanceReference.toLowerCase().includes(term) ||
      m.instrumentName.toLowerCase().includes(term) ||
      m.workDescription.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/50">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Instrument Maintenance Oversight
            </h1>
            <p className="text-xs text-slate-500">
              Preventive maintenance plans, breakdown repairs, downtime logs & vendor service contracts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (instruments.length > 0 && instruments[0]) setSelectedInstrumentId(instruments[0].id);
              setIsScheduleModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Maintenance
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference or instrument..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="PREVENTIVE">Preventive Maintenance</option>
              <option value="CORRECTIVE">Corrective Maintenance</option>
              <option value="BREAKDOWN">Breakdown Repair</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredMaintenance.length} maintenance record(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-amber-600 mb-2"></div>
            <p className="text-sm text-slate-500">Loading maintenance records...</p>
          </div>
        ) : filteredMaintenance.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Maintenance Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Schedule preventive service visits or log corrective breakdown repairs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Maintenance Ref</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Scope & Type</th>
                  <th className="py-3 px-4">Scheduled / Done</th>
                  <th className="py-3 px-4">Downtime & Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMaintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {m.maintenanceReference}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {m.serviceProvider || 'Internal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {m.instrumentName}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 mr-1.5">
                        {m.maintenanceType}
                      </span>
                      <span className="text-[11px] text-slate-600 truncate block mt-0.5">
                        {m.workDescription}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>Sched: {m.scheduledDate?.split('T')[0]}</div>
                      {m.completedDate && (
                        <div className="text-emerald-700 font-medium">
                          Done: {m.completedDate.split('T')[0]}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div>{m.downtimeHours ?? 0} hrs downtime</div>
                      {m.cost && <div>₹{m.cost.toLocaleString('en-IN')}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => setCompletingRecord(m)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] rounded-lg transition-colors"
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && instruments.length > 0 && (
        <MaintenanceModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          mode="schedule"
          instrumentId={selectedInstrumentId || instruments[0]?.id || ''}
          instrumentName={instruments.find((i) => i.id === (selectedInstrumentId || instruments[0]?.id))?.instrumentName}
          onSchedule={handleScheduleMaintenance}
        />
      )}

      {/* Complete Modal */}
      {completingRecord && (
        <MaintenanceModal
          isOpen={!!completingRecord}
          onClose={() => setCompletingRecord(null)}
          mode="complete"
          instrumentId={completingRecord.instrumentId}
          instrumentName={completingRecord.instrumentName}
          maintenanceRecord={completingRecord}
          onComplete={handleCompleteMaintenance}
        />
      )}
    </div>
  );
}
