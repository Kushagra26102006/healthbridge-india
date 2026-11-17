'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { QualityAlertDto } from '@healthbridge/shared-types';

interface QualityAlertPanelProps {
  alerts: QualityAlertDto[];
}

export function QualityAlertPanel({ alerts }: QualityAlertPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
        <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">Zero Active Quality Alerts</h4>
          <p className="text-xs text-emerald-700 mt-0.5">
            All quality control controls, instrument calibrations, and reagent inventory reserves meet laboratory specifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alt) => {
        const isCritical = alt.severity === 'CRITICAL' || alt.severity === 'HIGH';
        return (
          <div
            key={alt.id}
            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCritical
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isCritical ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{alt.title}</h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isCritical ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                    }`}
                  >
                    {alt.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">{alt.message}</p>
              </div>
            </div>

            {alt.actionUrl && (
              <Link
                href={alt.actionUrl}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors self-end sm:self-center ${
                  isCritical
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent'
                    : 'bg-amber-600 hover:bg-amber-700 text-white border-transparent'
                }`}
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
