'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import type { QCRunDto } from '@healthbridge/shared-types';

interface QCRunTableProps {
  runs: QCRunDto[];
  loading?: boolean;
  onInvestigate?: (run: QCRunDto) => void;
  onView?: (run: QCRunDto) => void;
}

export function QCRunTable({ runs, loading, onInvestigate, onView }: QCRunTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-teal-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading QC runs...</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No Quality Control runs recorded matching current filters.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      case 'UNDER_INVESTIGATION':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            INVESTIGATING
          </span>
        );
      case 'INVALIDATED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            INVALIDATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Run ID & Date</th>
            <th className="py-3 px-4">QC Profile / Test</th>
            <th className="py-3 px-4">Control Lot</th>
            <th className="py-3 px-4">Measured Value</th>
            <th className="py-3 px-4">Target / Limits</th>
            <th className="py-3 px-4">Outcome</th>
            <th className="py-3 px-4">Operator</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-normal">
          {runs.map((r) => {
            const dateStr = new Date(r.runDate).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            const limits =
              r.acceptableMin !== undefined && r.acceptableMax !== undefined
                ? `[${r.acceptableMin} - ${r.acceptableMax}]`
                : 'N/A';

            return (
              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{r.runIdentifier}</div>
                  <div className="text-xs text-slate-500">{dateStr}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{r.qcProfileName}</div>
                  <div className="text-xs text-slate-500">
                    <span className="font-mono font-semibold text-indigo-600">{r.testCode}</span> • v
                    {r.profileVersion}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600">{r.controlLotNumber}</td>
                <td className="py-3 px-4">
                  <span
                    className={`font-bold font-mono ${
                      r.qcStatus === 'FAILED' ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {r.measuredNumericValue !== undefined
                      ? `${r.measuredNumericValue} ${r.unit || ''}`
                      : r.measuredQualitativeValue}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs font-mono text-slate-600">
                  Target: {r.targetValue ?? r.qualitativeExpected ?? 'N/A'}
                  <div className="text-slate-400">{limits}</div>
                </td>
                <td className="py-3 px-4">{getStatusBadge(r.qcStatus)}</td>
                <td className="py-3 px-4 text-xs text-slate-600">{r.operatorName}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(r)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View QC Run Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {r.qcStatus === 'FAILED' && onInvestigate && (
                    <button
                      onClick={() => onInvestigate(r)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Investigate
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
