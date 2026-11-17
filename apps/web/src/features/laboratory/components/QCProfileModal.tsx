'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateQCProfileDto, QCProfileDto } from '@healthbridge/shared-types';

interface QCProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateQCProfileDto) => Promise<void>;
  initialData?: QCProfileDto | null;
}

export function QCProfileModal({ isOpen, onClose, onSubmit, initialData }: QCProfileModalProps) {
  const [profileName, setProfileName] = useState(initialData?.profileName || '');
  const [testCode, setTestCode] = useState(initialData?.testCode || '');
  const [testName, setTestName] = useState(initialData?.testName || '');
  const [parameterName, setParameterName] = useState(initialData?.parameterName || '');
  const [controlMaterial, setControlMaterial] = useState(initialData?.controlMaterial || '');
  const [controlLevel, setControlLevel] = useState<any>(initialData?.controlLevel || 'LEVEL_1');
  const [dataType, setDataType] = useState<any>(initialData?.dataType || 'NUMERIC');
  const [targetValue, setTargetValue] = useState<string>(initialData?.targetValue?.toString() || '');
  const [acceptableMin, setAcceptableMin] = useState<string>(initialData?.acceptableMin?.toString() || '');
  const [acceptableMax, setAcceptableMax] = useState<string>(initialData?.acceptableMax?.toString() || '');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [runFrequency, setRunFrequency] = useState<any>(initialData?.runFrequency || 'DAILY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const dto: CreateQCProfileDto = {
        profileName,
        testCode: testCode.toUpperCase(),
        testName,
        parameterName: parameterName || testName || 'Analyte',
        controlMaterial,
        controlLevel,
        dataType,
        targetValue: targetValue ? Number(targetValue) : undefined,
        acceptableMin: acceptableMin ? Number(acceptableMin) : undefined,
        acceptableMax: acceptableMax ? Number(acceptableMax) : undefined,
        unit,
        runFrequency,
      };

      if (dataType === 'NUMERIC') {
        if (dto.acceptableMin !== undefined && dto.acceptableMax !== undefined) {
          if (dto.acceptableMin > dto.acceptableMax) {
            throw new Error('Acceptable Minimum must be less than or equal to Acceptable Maximum');
          }
        }
      }

      await onSubmit(dto);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save QC profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit QC Profile Version' : 'Create Quality Control Profile'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Name *</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Bio-Rad Glucose Normal Level 1"
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Code *</label>
              <input
                type="text"
                required
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                placeholder="e.g. GLUC"
                className="w-full text-sm font-mono uppercase px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name *</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Fasting Blood Glucose"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parameter Name</label>
              <input
                type="text"
                value={parameterName}
                onChange={(e) => setParameterName(e.target.value)}
                placeholder="e.g. Glucose"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data Type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NUMERIC">Numeric</option>
                <option value="QUALITATIVE">Qualitative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Control Material *</label>
              <input
                type="text"
                required
                value={controlMaterial}
                onChange={(e) => setControlMaterial(e.target.value)}
                placeholder="e.g. Liquichek Level 1"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Control Level *</label>
              <select
                value={controlLevel}
                onChange={(e) => setControlLevel(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LEVEL_1">Level 1 (Low / Normal)</option>
                <option value="LEVEL_2">Level 2 (Normal / Mid)</option>
                <option value="LEVEL_3">Level 3 (High)</option>
                <option value="NORMAL">Normal</option>
                <option value="ABNORMAL_LOW">Abnormal Low</option>
                <option value="ABNORMAL_HIGH">Abnormal High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Value</label>
              <input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 95"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Acceptable Min *</label>
              <input
                type="number"
                step="any"
                required
                value={acceptableMin}
                onChange={(e) => setAcceptableMin(e.target.value)}
                placeholder="e.g. 85"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Acceptable Max *</label>
              <input
                type="number"
                step="any"
                required
                value={acceptableMax}
                onChange={(e) => setAcceptableMax(e.target.value)}
                placeholder="e.g. 105"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. mg/dL"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Run Frequency *</label>
              <select
                value={runFrequency}
                onChange={(e) => setRunFrequency(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EVERY_BATCH">Every Batch</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
