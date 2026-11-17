'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, CheckCircle2, Wrench, XCircle, Gauge, Eye } from 'lucide-react';
import type { LabInstrumentDto } from '@healthbridge/shared-types';

interface InstrumentRegistryTableProps {
  instruments: LabInstrumentDto[];
  loading?: boolean;
  onCalibrate?: (instrument: LabInstrumentDto) => void;
  onMaintain?: (instrument: LabInstrumentDto) => void;
  onRecordCalibration?: (instrument: LabInstrumentDto) => void;
  onScheduleMaintenance?: (instrument: LabInstrumentDto) => void;
}

export function InstrumentRegistryTable({
  instruments,
  loading,
  onCalibrate,
  onMaintain,
  onRecordCalibration,
  onScheduleMaintenance,
}: InstrumentRegistryTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-cyan-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading instruments...</p>
      </div>
    );
  }

  if (instruments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No laboratory instruments registered in inventory.
      </div>
    );
  }

  const getOperatingStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ACTIVE
          </span>
        );
      case 'IN_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3.5 h-3.5" />
            IN MAINTENANCE
          </span>
        );
      case 'OUT_OF_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            OUT OF SERVICE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getCalibrationBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Passed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {status}
          </span>
        );
    }
  };

  const handleCalibrateAction = onRecordCalibration || onCalibrate;
  const handleMaintainAction = onScheduleMaintenance || onMaintain;

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Instrument ID & Name</th>
            <th className="py-3 px-4">Model & Make</th>
            <th className="py-3 px-4">Operating Status</th>
            <th className="py-3 px-4">Calibration Status</th>
            <th className="py-3 px-4">Next Due</th>
            <th className="py-3 px-4">Associated Tests</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-normal">
          {instruments.map((inst) => (
            <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4">
                <Link
                  href={`/laboratory/quality/instruments/${inst.id}`}
                  className="font-bold text-slate-900 hover:text-cyan-600 flex items-center gap-1.5"
                >
                  <Cpu className="w-4 h-4 text-cyan-600 shrink-0" />
                  {inst.instrumentName}
                </Link>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {inst.instrumentIdentifier} • S/N: {inst.serialNumber}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-slate-900 font-medium">{inst.model}</div>
                <div className="text-xs text-slate-500">{inst.manufacturer}</div>
              </td>
              <td className="py-3 px-4">{getOperatingStatusBadge(inst.operatingStatus)}</td>
              <td className="py-3 px-4">{getCalibrationBadge(inst.calibrationStatus)}</td>
              <td className="py-3 px-4 text-xs font-medium text-slate-600">
                {inst.nextCalibrationDate ? inst.nextCalibrationDate.split('T')[0] : 'Not scheduled'}
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {(inst.associatedTestCodes || []).slice(0, 3).map((code) => (
                    <span
                      key={code}
                      className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                    >
                      {code}
                    </span>
                  ))}
                  {(inst.associatedTestCodes?.length || 0) > 3 && (
                    <span className="text-[10px] text-slate-400">
                      +{inst.associatedTestCodes.length - 3} more
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-right space-x-1.5">
                <Link
                  href={`/laboratory/quality/instruments/${inst.id}`}
                  className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors inline-block align-middle"
                  title="View Dossier"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {handleCalibrateAction && (
                  <button
                    onClick={() => handleCalibrateAction(inst)}
                    className="text-xs font-semibold px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg transition-colors inline-flex items-center gap-1"
                    title="Record Calibration"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    Calibrate
                  </button>
                )}
                {handleMaintainAction && (
                  <button
                    onClick={() => handleMaintainAction(inst)}
                    className="text-xs font-semibold px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-colors inline-flex items-center gap-1"
                    title="Schedule Maintenance"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Maintain
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
