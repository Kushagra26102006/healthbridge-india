'use client';

import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  useCalibrations,
  useInstruments,
} from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { CalibrationModal } from '@/features/laboratory/components/CalibrationModal';

export default function CalibrationsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const { calibrations, loading, refetch } = useCalibrations({
    status: statusFilter || undefined,
    calibrationType: typeFilter || undefined,
  });
  const { instruments } = useInstruments();

  const handleRecordCalibration = async (instrumentId: string, dto: any) => {
    await laboratoryQualityApi.recordCalibration(instrumentId, dto);
    await refetch();
  };

  const handleClearRestriction = async (instrumentId: string, calId: string) => {
    const notes = prompt('Enter clearance verification notes (e.g. Authorized by Quality Manager):');
    if (!notes) return;
    try {
      await laboratoryQualityApi.clearCalibration(instrumentId, calId, { clearanceNotes: notes });
      await refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to clear calibration restriction');
    }
  };

  const filteredCalibrations = calibrations.filter((cal) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      cal.calibrationReference.toLowerCase().includes(term) ||
      cal.instrumentName.toLowerCase().includes(term) ||
      (cal.standardsUsed && cal.standardsUsed.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200/50">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Instrument Calibration Management
            </h1>
            <p className="text-xs text-slate-500">
              Traceable calibration standards, tolerance verifications, lockouts & certificates
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
            onClick={() => setIsRecordModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Calibration
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
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="ROUTINE">Routine</option>
              <option value="POST_REPAIR">Post-Repair</option>
              <option value="INITIAL">Initial</option>
              <option value="VERIFICATION">Verification</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredCalibrations.length} calibration record(s)
        </div>
      </div>

      {/* Calibrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-2"></div>
            <p className="text-sm text-slate-500">Loading calibration records...</p>
          </div>
        ) : filteredCalibrations.length === 0 ? (
          <div className="p-12 text-center">
            <Gauge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Calibration Events Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Log calibration standards, parameters, and verification tests for active laboratory analyzers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Calibration Ref</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Performed Date</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Standards / Cert</th>
                  <th className="py-3 px-4 text-right">Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCalibrations.map((cal) => (
                  <tr key={cal.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {cal.calibrationReference}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        By {cal.performedByName || 'Lab Tech'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {cal.instrumentName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {cal.calibrationType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cal.performedDate?.split('T')[0] || 'Scheduled'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {cal.dueDate.split('T')[0]}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cal.calibrationResult === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {cal.calibrationResult || cal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div>{cal.standardsUsed || 'N/A'}</div>
                      {cal.certificateNumber && (
                        <div className="font-mono text-slate-400">#{cal.certificateNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {cal.clearedAt ? (
                        <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cleared
                        </span>
                      ) : cal.calibrationResult === 'FAILED' ? (
                        <button
                          onClick={() => handleClearRestriction(cal.instrumentId, cal.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] rounded-lg transition-colors"
                        >
                          Clear Restriction
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Modal */}
      <CalibrationModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        instruments={instruments}
        onSubmit={handleRecordCalibration}
      />
    </div>
  );
}
