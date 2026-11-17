'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Gauge,
  AlertTriangle,
  Cpu,
  FlaskConical,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useQualityDashboard, useQCRuns } from '@/features/laboratory/hooks/use-laboratory-quality';
import { QualityOverviewCards } from '@/features/laboratory/components/QualityOverviewCards';
import { QualityAlertPanel } from '@/features/laboratory/components/QualityAlertPanel';
import { QualityTrendCharts } from '@/features/laboratory/components/QualityTrendCharts';
import { QCRunTable } from '@/features/laboratory/components/QCRunTable';

export default function QualityDashboardPage() {
  const { data, loading, error, refetch } = useQualityDashboard();
  const { runs, loading: runsLoading, refetch: refetchRuns } = useQCRuns({ limit: 5 });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-200/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Quality Management System (QMS)
              </h1>
              <p className="text-xs text-slate-500">
                Operational quality control, instrument readiness, calibration oversight & reagent safety
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetch();
              refetchRuns();
            }}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            href="/laboratory/quality/control"
            className="px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Record QC Run
          </Link>
        </div>
      </div>

      {/* Regulatory & Accreditation Scope Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Operational Software Foundation Notice:</span>{' '}
          HealthBridge India provides an operational software foundation for tracking quality activities, instrument calibrations, and reagent lots. Use of this module does not inherently certify ISO 15189 or NABL regulatory compliance, which requires independent external accreditation audits.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <QualityOverviewCards kpis={data?.kpis} loading={loading} />

      {/* Real-time Alerts Panel */}
      <QualityAlertPanel alerts={data?.alerts || []} />

      {/* 6-Month Quality Trends */}
      {data?.monthlyTrends && data.monthlyTrends.length > 0 && (
        <QualityTrendCharts trends={data.monthlyTrends} />
      )}

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/laboratory/quality/control"
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-teal-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Gauge className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Quality Control (QC)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Westgard evaluation, Levey-Jennings profiles, and automated release gates.
          </p>
        </Link>

        <Link
          href="/laboratory/quality/incidents"
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Incidents & CAPA</h3>
          <p className="text-xs text-slate-500 mt-1">
            Automated failure logging, root-cause investigations, and preventive plans.
          </p>
        </Link>

        <Link
          href="/laboratory/quality/instruments"
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-cyan-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Cpu className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-600" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Instruments & Calibration</h3>
          <p className="text-xs text-slate-500 mt-1">
            Operational status tracking, calibration restrictions, and maintenance history.
          </p>
        </Link>

        <Link
          href="/laboratory/inventory/reagents"
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FlaskConical className="w-5 h-5" />
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Reagents & Lots</h3>
          <p className="text-xs text-slate-500 mt-1">
            FEFO lot tracking, cold-chain storage validation, and ledger deductions.
          </p>
        </Link>
      </div>

      {/* Recent QC Runs Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Quality Control Runs</h2>
            <p className="text-xs text-slate-500">Live evaluations across operational diagnostic analyzers</p>
          </div>
          <Link
            href="/laboratory/quality/control"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View All Runs <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <QCRunTable runs={runs} loading={runsLoading} onInvestigate={(_run) => {}} />
      </div>
    </div>
  );
}
