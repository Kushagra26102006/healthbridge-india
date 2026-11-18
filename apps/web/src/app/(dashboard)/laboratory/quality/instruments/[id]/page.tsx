'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { CalibrationModal } from '@/features/laboratory/components/CalibrationModal';
import { MaintenanceModal } from '@/features/laboratory/components/MaintenanceModal';
import type {
  LabInstrumentDto,
  InstrumentCalibrationDto,
  InstrumentMaintenanceDto,
} from '@healthbridge/shared-types';

export default function InstrumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const instrumentId = params.id as string;

  const [instrument, setInstrument] = useState<LabInstrumentDto | null>(null);
  const [calibrations, setCalibrations] = useState<InstrumentCalibrationDto[]>([]);
  const [maintenance, setMaintenance] = useState<InstrumentMaintenanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'calibrations' | 'maintenance' | 'tests'>('calibrations');

  // Modals
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [completingMaintenanceRecord, setCompletingMaintenanceRecord] = useState<InstrumentMaintenanceDto | null>(null);

  const fetchInstrumentData = useCallback(async () => {
    if (!instrumentId) return;
    try {
      setLoading(true);
      setError(null);
      const [inst, cals, maint] = await Promise.all([
        laboratoryQualityApi.getInstrumentById(instrumentId),
        laboratoryQualityApi.listCalibrations({ instrumentId }),
        laboratoryQualityApi.listMaintenance({ instrumentId }),
      ]);
      setInstrument(inst);
      setCalibrations(cals.items);
      setMaintenance(maint.items);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load instrument details');
    } finally {
      setLoading(false);
    }
  }, [instrumentId]);

  useEffect(() => {
    fetchInstrumentData();
  }, [fetchInstrumentData]);

  const handleRecordCalibration = async (_instId: string, dto: any) => {
    await laboratoryQualityApi.recordCalibration(instrumentId, dto);
    await fetchInstrumentData();
  };

  const handleScheduleMaintenance = async (_instId: string, dto: any) => {
    await laboratoryQualityApi.scheduleMaintenance(instrumentId, dto);
    await fetchInstrumentData();
  };

  const handleCompleteMaintenance = async (_instId: string, maintId: string, dto: any) => {
    await laboratoryQualityApi.completeMaintenance(instrumentId, maintId, dto);
    setCompletingMaintenanceRecord(null);
    await fetchInstrumentData();
  };

  const handleClearCalibrationRestriction = async (calibrationId: string) => {
    const notes = prompt('Enter clearance verification notes (e.g. Verified by Senior Biochemist):');
    if (!notes) return;
    try {
      await laboratoryQualityApi.clearCalibration(instrumentId, calibrationId, { clearanceNotes: notes });
      await fetchInstrumentData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to clear calibration restriction');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center max-w-5xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-cyan-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading instrument dossier...</p>
      </div>
    );
  }

  if (!instrument) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <p className="text-sm text-slate-600">Instrument not found or was removed.</p>
        <Link
          href="/laboratory/quality/instruments"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Instruments
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/laboratory/quality/instruments')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {instrument.instrumentName}
              </h1>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                {instrument.instrumentIdentifier}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  instrument.operatingStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : instrument.operatingStatus === 'IN_MAINTENANCE'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {instrument.operatingStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {instrument.manufacturer} • Model: {instrument.model} • S/N: {instrument.serialNumber} • Dept: {instrument.department || 'Central Lab'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCalibrationModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
            Record Calibration
          </button>
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            Schedule Maintenance
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Calibration Status
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`font-bold text-sm ${
                instrument.calibrationStatus === 'PASSED'
                  ? 'text-emerald-700'
                  : instrument.calibrationStatus === 'FAILED'
                  ? 'text-rose-700'
                  : 'text-amber-700'
              }`}
            >
              {instrument.calibrationStatus}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Next Due: {instrument.nextCalibrationDate?.split('T')[0] || 'Unscheduled'}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Maintenance Schedule
          </span>
          <div className="mt-1">
            <span className="font-bold text-sm text-slate-900">
              {instrument.nextMaintenanceDate?.split('T')[0] || 'Routine'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Provider: {instrument.maintenanceProvider || 'Internal Biomeds'}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Commissioning Date
          </span>
          <div className="mt-1">
            <span className="font-bold text-sm text-slate-900">
              {instrument.installationDate?.split('T')[0] || 'N/A'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Category: {instrument.category}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Associated Tests
          </span>
          <div className="mt-1">
            <span className="font-bold text-sm text-cyan-700">
              {instrument.associatedTestCodes?.length || 0} Test Mappings
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Active analyzer channels
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('calibrations')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'calibrations'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Calibration Records ({calibrations.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'maintenance'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Maintenance Dossier ({maintenance.length})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Mapped Tests ({instrument.associatedTestCodes?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'calibrations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {calibrations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No calibration events recorded for this instrument.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Reference & Type</th>
                  <th className="py-3 px-4">Performed Date</th>
                  <th className="py-3 px-4">Next Due</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Standards / Cert #</th>
                  <th className="py-3 px-4">Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {calibrations.map((cal) => (
                  <tr key={cal.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {cal.calibrationReference}
                      </span>
                      <span className="text-[11px] text-slate-500">{cal.calibrationType}</span>
                    </td>
                    <td className="py-3 px-4">{cal.performedDate?.split('T')[0] || 'Pending'}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{cal.dueDate.split('T')[0]}</td>
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
                      <div>{cal.standardsUsed || 'Internal Calibrator'}</div>
                      {cal.certificateNumber && (
                        <div className="font-mono text-slate-400">#{cal.certificateNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cal.clearedAt ? (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cleared by {cal.clearedByName}
                        </span>
                      ) : cal.calibrationResult === 'FAILED' ? (
                        <button
                          onClick={() => handleClearCalibrationRestriction(cal.id)}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] rounded-lg transition-colors"
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
      )}

      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {maintenance.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No maintenance work scheduled or performed yet.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Reference & Scope</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Scheduled / Completed</th>
                  <th className="py-3 px-4">Downtime & Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {m.maintenanceReference}
                      </span>
                      <p className="text-[11px] text-slate-600 max-w-sm truncate">{m.workDescription}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {m.maintenanceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div>Sched: {m.scheduledDate?.split('T')[0]}</div>
                      {m.completedDate && <div className="text-emerald-700">Done: {m.completedDate.split('T')[0]}</div>}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div>Downtime: {m.downtimeHours ?? 0} hrs</div>
                      {m.cost && <div>Cost: ₹{m.cost.toLocaleString('en-IN')}</div>}
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
                          onClick={() => setCompletingMaintenanceRecord(m)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] rounded-lg transition-colors"
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <span className="text-emerald-700 text-[11px] font-semibold">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Configured Diagnostic Test Mappings</h3>
          <p className="text-xs text-slate-500">
            Automated test routing maps clinical orders and QC profiles directly to this analyzer
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {instrument.associatedTestCodes && instrument.associatedTestCodes.length > 0 ? (
              instrument.associatedTestCodes.map((code) => (
                <div
                  key={code}
                  className="px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center gap-2"
                >
                  <span className="font-mono font-bold text-xs text-cyan-800">{code}</span>
                  <span className="text-[10px] text-cyan-600 uppercase font-semibold">Ready</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No test codes associated with this instrument yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        defaultInstrumentId={instrument.id}
        onSubmit={handleRecordCalibration}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        mode="schedule"
        instrumentId={instrument.id}
        instrumentName={instrument.instrumentName}
        onSchedule={handleScheduleMaintenance}
      />

      {completingMaintenanceRecord && (
        <MaintenanceModal
          isOpen={!!completingMaintenanceRecord}
          onClose={() => setCompletingMaintenanceRecord(null)}
          mode="complete"
          instrumentId={instrument.id}
          instrumentName={instrument.instrumentName}
          maintenanceRecord={completingMaintenanceRecord}
          onComplete={handleCompleteMaintenance}
        />
      )}
    </div>
  );
}
