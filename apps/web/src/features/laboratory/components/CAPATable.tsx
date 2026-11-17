'use client';

import React from 'react';
import { CheckCircle2, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import type { CAPADto } from '@healthbridge/shared-types';

interface CAPATableProps {
  capas: CAPADto[];
  loading?: boolean;
  onView?: (capa: CAPADto) => void;
  onReview?: (capa: CAPADto) => void;
  onReviewEffectiveness?: (capa: CAPADto) => void;
  onReopen?: (capa: CAPADto) => void;
}

export function CAPATable({
  capas,
  loading,
  onView,
  onReview,
  onReviewEffectiveness,
  onReopen,
}: CAPATableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-purple-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading CAPA plans...</p>
      </div>
    );
  }

  if (capas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No Corrective & Preventive Action (CAPA) plans found.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLOSED':
      case 'EFFECTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'INEFFECTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            INEFFECTIVE
          </span>
        );
      case 'OPEN':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const handleReviewAction = onReviewEffectiveness || onReview;

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">CAPA Reference</th>
            <th className="py-3 px-4">Problem Statement</th>
            <th className="py-3 px-4">Root Cause</th>
            <th className="py-3 px-4">Owner & Due Date</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Actions / Items</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-normal">
          {capas.map((c) => {
            const dueDateStr = new Date(c.dueDate).toLocaleDateString('en-IN', {
              dateStyle: 'medium',
            });
            const completedActions = (c.actions || []).filter((a) => a.status === 'COMPLETED').length;
            const totalActions = (c.actions || []).length;

            return (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 font-mono">{c.capaReference}</div>
                  <div className="text-xs text-slate-400">Ref: {c.incidentReference}</div>
                </td>
                <td className="py-3 px-4 max-w-xs">
                  <div className="font-medium text-slate-900 line-clamp-1">{c.problemStatement}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{c.correctiveAction}</div>
                </td>
                <td className="py-3 px-4 text-xs font-medium text-slate-700">{c.rootCauseCategory}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{c.assignedOwnerName}</div>
                  <div className="text-xs text-slate-500">Due: {dueDateStr}</div>
                </td>
                <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                <td className="py-3 px-4 text-xs text-slate-600">
                  <div className="font-medium">
                    {completedActions}/{totalActions} items
                  </div>
                  {c.effectivenessResult && (
                    <div
                      className={`text-[11px] font-semibold ${
                        c.effectivenessResult === 'EFFECTIVE' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {c.effectivenessResult}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(c)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View CAPA"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {c.status !== 'CLOSED' && handleReviewAction && (
                    <button
                      onClick={() => handleReviewAction(c)}
                      className="text-xs font-semibold px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {c.status === 'INEFFECTIVE' && onReopen && (
                    <button
                      onClick={() => onReopen(c)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reopen
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
