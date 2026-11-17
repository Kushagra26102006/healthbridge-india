'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Cpu,
  Wrench,
  Gauge,
  Boxes,
} from 'lucide-react';
import type { QualityKPIDto } from '@healthbridge/shared-types';

interface QualityOverviewCardsProps {
  kpis?: QualityKPIDto;
  loading?: boolean;
}

export function QualityOverviewCards({ kpis, loading }: QualityOverviewCardsProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'QC Pass Rate',
      value: `${kpis.qcPassRate}%`,
      subtitle: `${kpis.totalQCRuns} total runs recorded`,
      icon: kpis.qcPassRate >= 95 ? CheckCircle2 : AlertTriangle,
      color: kpis.qcPassRate >= 95 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
      borderColor: kpis.qcPassRate >= 95 ? 'border-emerald-200' : 'border-amber-200',
    },
    {
      title: 'QC Failures',
      value: kpis.qcFailureCount,
      subtitle: kpis.qcFailureCount === 0 ? 'All controls in specification' : 'Requires investigation',
      icon: XCircle,
      color: kpis.qcFailureCount === 0 ? 'text-slate-600 bg-slate-50' : 'text-rose-600 bg-rose-50',
      borderColor: kpis.qcFailureCount === 0 ? 'border-slate-200' : 'border-rose-200',
    },
    {
      title: 'Open Incidents',
      value: kpis.openQualityIncidents,
      subtitle: `${kpis.openCAPAActions} CAPA actions active`,
      icon: AlertTriangle,
      color: kpis.openQualityIncidents === 0 ? 'text-slate-600 bg-slate-50' : 'text-amber-600 bg-amber-50',
      borderColor: kpis.openQualityIncidents === 0 ? 'border-slate-200' : 'border-amber-200',
    },
    {
      title: 'Active CAPAs',
      value: kpis.openCAPAActions,
      subtitle: 'Corrective & preventive actions',
      icon: ClipboardList,
      color: 'text-purple-600 bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Instruments Active',
      value: kpis.instrumentsInService,
      subtitle: `${kpis.instrumentsRequiringMaintenance} in maintenance`,
      icon: Cpu,
      color: 'text-cyan-600 bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
    {
      title: 'Calibrations Due',
      value: kpis.overdueCalibrations,
      subtitle: kpis.overdueCalibrations === 0 ? 'All up to date' : 'Immediate calibration required',
      icon: Gauge,
      color: kpis.overdueCalibrations === 0 ? 'text-slate-600 bg-slate-50' : 'text-rose-600 bg-rose-50',
      borderColor: kpis.overdueCalibrations === 0 ? 'border-slate-200' : 'border-rose-200',
    },
    {
      title: 'Maintenance Due',
      value: kpis.instrumentsRequiringMaintenance,
      subtitle: 'Scheduled services pending',
      icon: Wrench,
      color: kpis.instrumentsRequiringMaintenance === 0 ? 'text-slate-600 bg-slate-50' : 'text-amber-600 bg-amber-50',
      borderColor: kpis.instrumentsRequiringMaintenance === 0 ? 'border-slate-200' : 'border-amber-200',
    },
    {
      title: 'Reagent Alerts',
      value: kpis.reagentStockAlerts,
      subtitle: `${kpis.reagentsApproachingExpiry} lots expiring soon`,
      icon: Boxes,
      color: kpis.reagentStockAlerts === 0 ? 'text-slate-600 bg-slate-50' : 'text-amber-600 bg-amber-50',
      borderColor: kpis.reagentStockAlerts === 0 ? 'border-slate-200' : 'border-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${card.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{card.value}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 truncate">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
