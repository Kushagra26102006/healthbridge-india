'use client';

import React, { useState, useEffect } from 'react';
import { X, Wrench, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { RecordCalibrationDto, CalibrationParameterResult } from '@healthbridge/shared-types';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments?: { id: string; instrumentIdentifier: string; instrumentName: string }[];
  defaultInstrumentId?: string;
  onSubmit: (instrumentId: string, dto: RecordCalibrationDto) => Promise<void>;
}

export function CalibrationModal({
  isOpen,
  onClose,
  instruments = [],
  defaultInstrumentId,
  onSubmit,
}: CalibrationModalProps) {
  const [instrumentId, setInstrumentId] = useState(defaultInstrumentId || '');
  const [calibrationType, setCalibrationType] = useState<
    'ROUTINE' | 'POST_REPAIR' | 'INITIAL' | 'VERIFICATION'
  >('ROUTINE');
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]!);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0]!;
  });
  const [standardsUsed, setStandardsUsed] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [parametersChecked, setParametersChecked] = useState<CalibrationParameterResult[]>([
    { parameter: 'Wavelength Accuracy', expectedValue: '546 nm', measuredValue: '546.1 nm', tolerance: '±1 nm', passed: true },
    { parameter: 'Absorbance Linearity', expectedValue: '1.000 Abs', measuredValue: '0.998 Abs', tolerance: '±0.010 Abs', passed: true },
  ]);
  const [calibrationResult, setCalibrationResult] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultInstrumentId) {
      setInstrumentId(defaultInstrumentId);
    } else if (instruments.length > 0 && !instrumentId && instruments[0]) {
      setInstrumentId(instruments[0].id);
    }
  }, [defaultInstrumentId, instruments, instrumentId]);

  if (!isOpen) return null;

  const handleAddParam = () => {
    setParametersChecked([
      ...parametersChecked,
      { parameter: '', expectedValue: '', measuredValue: '', tolerance: '', passed: true },
    ]);
  };

  const handleRemoveParam = (index: number) => {
    setParametersChecked(parametersChecked.filter((_, i) => i !== index));
  };

  const handleParamChange = (index: number, field: keyof CalibrationParameterResult, value: any) => {
    const updated = [...parametersChecked];
    const current = updated[index];
    if (!current) return;
    updated[index] = { ...current, [field]: value };
    // Auto-update overall result if any parameter failed
    if (field === 'passed') {
      const allPassed = updated.every((p) => p.passed);
      setCalibrationResult(allPassed ? 'PASSED' : 'FAILED');
    }
    setParametersChecked(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrumentId) {
      setError('Please select an instrument.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(instrumentId, {
        calibrationType,
        performedDate,
        dueDate,
        calibrationResult,
        standardsUsed: standardsUsed || undefined,
        certificateNumber: certificateNumber || undefined,
        notes: notes || undefined,
        parametersChecked: parametersChecked.filter((p) => p.parameter.trim() !== ''),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record calibration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Instrument Calibration</h3>
              <p className="text-xs text-slate-500">
                Log calibration standards, tolerances, parameter verifications and operational fitness
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {(!defaultInstrumentId || instruments.length > 1) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument *
              </label>
              <select
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                disabled={!!defaultInstrumentId}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                required
              >
                <option value="">Select an instrument</option>
                {instruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.instrumentName} ({inst.instrumentIdentifier})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Calibration Type *
              </label>
              <select
                value={calibrationType}
                onChange={(e) => setCalibrationType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="ROUTINE">Routine Scheduled</option>
                <option value="POST_REPAIR">Post-Repair Verification</option>
                <option value="INITIAL">Initial Commissioning</option>
                <option value="VERIFICATION">Ad-Hoc Verification</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Overall Outcome *
              </label>
              <select
                value={calibrationResult}
                onChange={(e) => setCalibrationResult(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
              >
                <option value="PASSED">Passed (Instrument Cleared)</option>
                <option value="FAILED">Failed (Instrument Restricted)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Performed Date *
              </label>
              <input
                type="date"
                value={performedDate}
                onChange={(e) => setPerformedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Calibration Due *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Calibration Standards / Calibrator Lot
              </label>
              <input
                type="text"
                value={standardsUsed}
                onChange={(e) => setStandardsUsed(e.target.value)}
                placeholder="e.g. NIST Traceable Ref Std Lot #CL-9821"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Certificate / Verification #
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g. CAL-CERT-2026-0044"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Parameters Checked Table */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800">
                Calibrated Parameters & Tolerances
              </span>
              <button
                type="button"
                onClick={handleAddParam}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Parameter
              </button>
            </div>

            <div className="space-y-2">
              {parametersChecked.map((param, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Parameter"
                      value={param.parameter}
                      onChange={(e) => handleParamChange(idx, 'parameter', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Expected"
                      value={param.expectedValue}
                      onChange={(e) => handleParamChange(idx, 'expectedValue', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Measured"
                      value={param.measuredValue}
                      onChange={(e) => handleParamChange(idx, 'measuredValue', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Tolerance"
                      value={param.tolerance}
                      onChange={(e) => handleParamChange(idx, 'tolerance', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={param.passed}
                        onChange={(e) => handleParamChange(idx, 'passed', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={param.passed ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {param.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </label>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Calibration Notes / Action Taken
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Optical alignment adjusted. Wavelength verified against Holmium oxide standard."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

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
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                calibrationResult === 'PASSED'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? (
                'Recording...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {calibrationResult === 'PASSED' ? 'Save & Clear Instrument' : 'Save & Restrict Instrument'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
