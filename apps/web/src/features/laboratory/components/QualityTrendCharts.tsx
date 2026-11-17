'use client';

import React from 'react';
import type { QualityTrendPointDto } from '@healthbridge/shared-types';

interface QualityTrendChartsProps {
  trends: QualityTrendPointDto[];
}

export function QualityTrendCharts({ trends }: QualityTrendChartsProps) {
  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No monthly QC runs recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Monthly Quality Control Trends</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pass rate and execution volume across past 6 months from persisted QC logs
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-600">Passed Runs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-slate-600">Failed Runs</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {trends.map((t, idx) => {
          const passPercent = t.totalRuns > 0 ? (t.passedRuns / t.totalRuns) * 100 : 100;
          const failPercent = t.totalRuns > 0 ? (t.failedRuns / t.totalRuns) * 100 : 0;

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 w-16">{t.date}</span>
                <span className="text-slate-500 font-medium">
                  {t.totalRuns} runs ({t.passedRuns} passed, {t.failedRuns} failed)
                </span>
                <span
                  className={`font-bold ${
                    t.passRate >= 95 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {t.passRate}% pass
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                {t.totalRuns > 0 ? (
                  <>
                    <div
                      style={{ width: `${passPercent}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                      title={`${t.passedRuns} Passed`}
                    />
                    <div
                      style={{ width: `${failPercent}%` }}
                      className="bg-rose-500 h-full transition-all duration-300"
                      title={`${t.failedRuns} Failed`}
                    />
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-200" title="Zero runs" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
