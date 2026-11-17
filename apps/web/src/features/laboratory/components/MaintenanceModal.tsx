'use client';

import React, { useState } from 'react';
import { X, Wrench, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import type {
  ScheduleMaintenanceDto,
  CompleteMaintenanceDto,
  InstrumentMaintenanceDto,
} from '@healthbridge/shared-types';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'schedule' | 'complete';
  instrumentId: string;
  instrumentName?: string;
  maintenanceRecord?: InstrumentMaintenanceDto | null;
  onSchedule?: (instrumentId: string, dto: ScheduleMaintenanceDto) => Promise<void>;
  onComplete?: (instrumentId: string, maintenanceId: string, dto: CompleteMaintenanceDto) => Promise<void>;
}

export function MaintenanceModal({
  isOpen,
  onClose,
  mode,
  instrumentId,
  instrumentName,
  maintenanceRecord,
  onSchedule,
  onComplete,
}: MaintenanceModalProps) {
  const getTodayStr = () => new Date().toISOString().split('T')[0]!;

  // Schedule state
  const [maintenanceType, setMaintenanceType] = useState<
    'PREVENTIVE' | 'CORRECTIVE' | 'BREAKDOWN'
  >('PREVENTIVE');
  const [workDescription, setWorkDescription] = useState(
    maintenanceRecord?.workDescription || ''
  );
  const [scheduledDate, setScheduledDate] = useState(
    maintenanceRecord?.scheduledDate?.split('T')[0] || getTodayStr()
  );
  const [serviceProvider, setServiceProvider] = useState(
    maintenanceRecord?.serviceProvider || ''
  );

  // Complete state
  const [completedDate, setCompletedDate] = useState(getTodayStr());
  const [technicianName, setTechnicianName] = useState(
    maintenanceRecord?.technicianName || ''
  );
  const [maintenanceNotes, setMaintenanceNotes] = useState(
    maintenanceRecord?.maintenanceNotes || ''
  );
  const [downtimeHours, setDowntimeHours] = useState<number | ''>(
    maintenanceRecord?.downtimeHours ?? 2
  );
  const [partsReplacedText, setPartsReplacedText] = useState(
    maintenanceRecord?.partsReplaced?.join(', ') || ''
  );
  const [nextScheduledDate, setNextScheduledDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0]!;
  });
  const [cost, setCost] = useState<number | ''>(maintenanceRecord?.cost ?? '');
  const [restoreToActiveStatus, setRestoreToActiveStatus] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (mode === 'schedule') {
        if (!onSchedule) return;
        await onSchedule(instrumentId, {
          maintenanceType,
          workDescription,
          scheduledDate: scheduledDate || getTodayStr(),
          serviceProvider: serviceProvider || undefined,
        });
      } else {
        if (!onComplete || !maintenanceRecord) return;
        const parts = partsReplacedText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        await onComplete(instrumentId, maintenanceRecord.id, {
          completedDate: completedDate || getTodayStr(),
          technicianName: technicianName || undefined,
          maintenanceNotes,
          downtimeHours: downtimeHours === '' ? undefined : Number(downtimeHours),
          partsReplaced: parts.length > 0 ? parts : undefined,
          nextScheduledDate: nextScheduledDate || undefined,
          cost: cost === '' ? undefined : Number(cost),
          restoreToActiveStatus,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to process maintenance action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              {mode === 'schedule' ? <Calendar className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'schedule' ? 'Schedule Maintenance' : 'Complete Maintenance Service'}
              </h3>
              <p className="text-xs text-slate-500">
                {instrumentName ? `Instrument: ${instrumentName}` : 'Manage instrument maintenance record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {mode === 'schedule' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maintenance Type *
                </label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="PREVENTIVE">Preventive Maintenance (PM)</option>
                  <option value="CORRECTIVE">Corrective Maintenance</option>
                  <option value="BREAKDOWN">Emergency Breakdown Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Scope / Description *
                </label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="e.g. 6-month preventive service: optical path cleaning, pump tubing replacement, sensor calibration"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Vendor / Provider
                  </label>
                  <input
                    type="text"
                    value={serviceProvider}
                    onChange={(e) => setServiceProvider(e.target.value)}
                    placeholder="e.g. Roche Diagnostics India"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Completed Date *
                  </label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Field Engineer / Technician
                  </label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar (Roche Rep)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maintenance Completion Notes *
                </label>
                <textarea
                  rows={3}
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Detail observations, adjustments, test calibrations and instrument operating verification"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Downtime Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={downtimeHours}
                    onChange={(e) => setDowntimeHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Cost (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={cost}
                    onChange={(e) => setCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parts / Consumables Replaced
                </label>
                <input
                  type="text"
                  value={partsReplacedText}
                  onChange={(e) => setPartsReplacedText(e.target.value)}
                  placeholder="Comma-separated (e.g. Peristaltic Pump Tubing, Lamp Assembly, Filter)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Preventive Maintenance Due
                </label>
                <input
                  type="date"
                  value={nextScheduledDate}
                  onChange={(e) => setNextScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreToActiveStatus}
                    onChange={(e) => setRestoreToActiveStatus(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-emerald-900 block">
                      Restore Instrument to ACTIVE Operational Status
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      Clears maintenance restriction if all calibrations and checks are satisfactory
                    </span>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                'Processing...'
              ) : mode === 'schedule' ? (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule Maintenance
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
