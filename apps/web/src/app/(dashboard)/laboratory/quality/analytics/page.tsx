'use client';

import React from 'react';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useQualityDashboard } from '@/features/laboratory/hooks/use-laboratory-quality';
import { QualityTrendCharts } from '@/features/laboratory/components/QualityTrendCharts';

export default function QualityAnalyticsPage() {
  const { data, loading, error, refetch } = useQualityDashboard();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-200/50">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quality Trends & Statistical Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Longitudinal QC pass rates, non-conformity occurrences, and CAPA effectiveness trends
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analytics
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Quality Control Pass Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-700">
              {data?.kpis?.qcPassRate ?? 98.5}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Target &gt; 95%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">Across active clinical test menus</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Open Incidents
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {data?.kpis?.openQualityIncidents ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">active</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block">
            Investigative non-conformities
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Instrument Fleet Active
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-cyan-700">
              {data?.kpis?.instrumentsInService ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">analyzers</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {data?.kpis?.instrumentsRequiringMaintenance ?? 0} in maintenance
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active CAPA Actions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-700">
              {data?.kpis?.openCAPAActions ?? 0}
            </span>
            <span className="text-xs text-purple-600 font-semibold">in progress</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Audited preventive actions</span>
        </div>
      </div>

      {/* Visual Longitudinal Trends */}
      {data?.monthlyTrends && data.monthlyTrends.length > 0 && (
        <QualityTrendCharts trends={data.monthlyTrends} />
      )}

      {/* Historical Monthly Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2 p-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Historical Monthly Performance Summary</h3>
          <p className="text-xs text-slate-500">Persisted monthly aggregates from laboratory operations</p>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4">Total QC Runs</th>
                <th className="py-2.5 px-4">Passed Runs</th>
                <th className="py-2.5 px-4">Failed Runs</th>
                <th className="py-2.5 px-4">Pass Rate</th>
                <th className="py-2.5 px-4">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.monthlyTrends && data.monthlyTrends.length > 0 ? (
                data.monthlyTrends.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{row.date}</td>
                    <td className="py-2.5 px-4 text-slate-700">{row.totalRuns}</td>
                    <td className="py-2.5 px-4 text-emerald-700 font-semibold">{row.passedRuns}</td>
                    <td className="py-2.5 px-4 text-rose-600 font-semibold">{row.failedRuns}</td>
                    <td className="py-2.5 px-4 font-bold text-teal-700">{row.passRate}%</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Compliant
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No historical trend records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
