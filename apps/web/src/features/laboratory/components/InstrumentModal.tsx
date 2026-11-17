'use client';

import React, { useState } from 'react';
import { X, Cpu } from 'lucide-react';
import type { CreateLabInstrumentDto, LabInstrumentDto } from '@healthbridge/shared-types';

interface InstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateLabInstrumentDto) => Promise<void>;
  initialData?: LabInstrumentDto | null;
}

export function InstrumentModal({ isOpen, onClose, onSubmit, initialData }: InstrumentModalProps) {
  const [instrumentIdentifier, setInstrumentIdentifier] = useState(initialData?.instrumentIdentifier || '');
  const [instrumentName, setInstrumentName] = useState(initialData?.instrumentName || '');
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || '');
  const [category, setCategory] = useState<any>(initialData?.category || 'ANALYZER');
  const [department, setDepartment] = useState(initialData?.department || 'Biochemistry');
  const [associatedTestCodes, setAssociatedTestCodes] = useState(
    initialData?.associatedTestCodes?.join(', ') || ''
  );
  const [installationDate, setInstallationDate] = useState(
    initialData?.installationDate || new Date().toISOString().split('T')[0]!
  );
  const [maintenanceProvider, setMaintenanceProvider] = useState(initialData?.maintenanceProvider || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const testCodesArray = associatedTestCodes
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit({
        instrumentIdentifier: instrumentIdentifier.toUpperCase(),
        instrumentName,
        manufacturer,
        model,
        serialNumber,
        category,
        department,
        associatedTestCodes: testCodesArray,
        installationDate,
        maintenanceProvider: maintenanceProvider || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to register instrument');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Laboratory Instrument' : 'Register Laboratory Instrument'}
              </h3>
              <p className="text-xs text-slate-500">Track operating status, calibrations, and maintenance</p>
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
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument Identifier *
              </label>
              <input
                type="text"
                required
                value={instrumentIdentifier}
                onChange={(e) => setInstrumentIdentifier(e.target.value.toUpperCase())}
                placeholder="e.g. INST-BIO-01"
                className="w-full text-sm font-mono uppercase px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Instrument Name *</label>
              <input
                type="text"
                required
                value={instrumentName}
                onChange={(e) => setInstrumentName(e.target.value)}
                placeholder="e.g. Roche Cobas c311"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Roche"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. c311"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number *</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-8844"
                className="w-full text-sm font-mono px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ANALYZER">Automated Analyzer</option>
                <option value="CENTRIFUGE">Centrifuge</option>
                <option value="MICROSCOPE">Microscope</option>
                <option value="INCUBATOR">Incubator</option>
                <option value="REFRIGERATOR">Laboratory Refrigerator</option>
                <option value="SPECTROPHOTOMETER">Spectrophotometer</option>
                <option value="PCR_MACHINE">PCR Thermal Cycler</option>
                <option value="OTHER">Other Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Clinical Chemistry"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Test Codes (Comma separated)
            </label>
            <input
              type="text"
              value={associatedTestCodes}
              onChange={(e) => setAssociatedTestCodes(e.target.value)}
              placeholder="e.g. GLUC, LIPID, LFT, KFT"
              className="w-full text-sm font-mono uppercase px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Date *</label>
              <input
                type="date"
                required
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Provider</label>
              <input
                type="text"
                value={maintenanceProvider}
                onChange={(e) => setMaintenanceProvider(e.target.value)}
                placeholder="e.g. Roche Diagnostics India"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Register Instrument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
