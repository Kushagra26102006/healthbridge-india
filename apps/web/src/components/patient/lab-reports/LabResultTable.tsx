'use client';

import React from 'react';
import { CheckCircle2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LabObservationDto, LabResultInterpretation } from '@healthbridge/shared-types';

export interface LabResultTableProps {
  observations: LabObservationDto[];
}

export const getInterpretationBadge = (interpretation: LabResultInterpretation) => {
  switch (interpretation) {
    case 'NORMAL':
      return {
        label: 'Normal',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'ABOVE_RANGE':
      return {
        label: 'Above Range',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: ArrowUpRight,
      };
    case 'BELOW_RANGE':
      return {
        label: 'Below Range',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: ArrowDownRight,
      };
    case 'NOT_AVAILABLE':
    default:
      return {
        label: 'N/A',
        bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
        icon: Minus,
      };
  }
};

export const LabResultTable: React.FC<LabResultTableProps> = ({ observations }) => {
  if (!observations || observations.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500">
        No test parameter observations recorded for this diagnostic report.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
          <tr>
            <th scope="col" className="px-4 py-3">
              Test Parameter
            </th>
            <th scope="col" className="px-4 py-3">
              Result Value
            </th>
            <th scope="col" className="px-4 py-3">
              Unit
            </th>
            <th scope="col" className="px-4 py-3">
              Biological Reference Range
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Evaluation
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
          {observations.map((obs, idx) => {
            const statusInfo = getInterpretationBadge(obs.interpretation);
            const StatusIcon = statusInfo.icon;
            const isOutOfRange =
              obs.interpretation === 'ABOVE_RANGE' || obs.interpretation === 'BELOW_RANGE';

            return (
              <tr
                key={idx}
                className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                  isOutOfRange ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {obs.testName}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-semibold text-sm ${
                      isOutOfRange
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {obs.value}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono">
                  {obs.unit || '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  {obs.referenceRange}
                </td>
                <td className="px-4 py-3 text-right">
                  <Badge
                    className={`${statusInfo.bg} border text-[11px] font-medium inline-flex items-center gap-1`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span>{statusInfo.label}</span>
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
