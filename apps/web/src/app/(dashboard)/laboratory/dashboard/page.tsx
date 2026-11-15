'use client';

import React from 'react';
import Link from 'next/link';
import {
  useLaboratoryDashboardSummary,
  useLaboratoryProfile,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  LaboratoryStatCard,
  LabOrderStatusBadge,
} from '@/components/laboratory';
import {
  ClipboardList,
  CheckCircle2,
  PackageCheck,
  Scan,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertTriangle,
  TestTube2,
} from 'lucide-react';

export default function LaboratoryDashboardPage() {
  const { data: summary, isLoading, error, refetch } = useLaboratoryDashboardSummary();
  const { data: profile } = useLaboratoryProfile();

  if (error) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-destructive/20 my-6 shadow-xs">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Unable to Load Laboratory Dashboard
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
          An error occurred while connecting to the laboratory service. Please verify your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                {profile?.verificationStatus === 'VERIFIED'
                  ? 'NABL & ABDM Accredited'
                  : 'Accreditation Under Verification'}
              </span>
              {profile?.laboratoryLicenseNumber && (
                <span className="text-xs text-slate-300 font-mono">
                  LIC: {profile.laboratoryLicenseNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {profile?.laboratoryName || 'Diagnostic Laboratory Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Manage pre-analytical orders, assign diagnostic tests, track barcode-labeled specimen accessioning, and monitor laboratory test flows in compliance with NABL and ABDM guidelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/laboratory/samples/scan"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-xl shadow-xs transition-colors"
            >
              <Scan className="w-4 h-4" />
              Scan Barcode
            </Link>
            <Link
              href="/laboratory/orders"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Review Orders
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LaboratoryStatCard
          title="Active Test Catalogue"
          value={isLoading ? '...' : summary?.totalActiveTests ?? 0}
          subtitle="Tests available for physician ordering"
          icon={TestTube2}
          variant="teal"
        />
        <LaboratoryStatCard
          title="Orders Under Review"
          value={isLoading ? '...' : summary?.pendingOrderReviews ?? 0}
          subtitle="Pending lab review & acceptance"
          icon={Clock}
          variant="amber"
        />
        <LaboratoryStatCard
          title="Accepted Orders"
          value={isLoading ? '...' : summary?.acceptedOrders ?? 0}
          subtitle="Awaiting sample collection or transit"
          icon={CheckCircle2}
          variant="sky"
        />
        <LaboratoryStatCard
          title="Samples Accessioned"
          value={isLoading ? '...' : summary?.samplesAccessioned ?? 0}
          subtitle="Specimens verified in lab custody"
          icon={PackageCheck}
          variant="emerald"
        />
      </div>

      {/* Main Grid: Recent Orders & Catalogue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Recent Laboratory Orders
              </h2>
              <p className="text-xs text-muted-foreground">
                Physician orders requesting diagnostic evaluation
              </p>
            </div>
            <Link
              href="/laboratory/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60 overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading recent orders...
              </div>
            ) : !summary?.recentOrders || summary.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No laboratory orders received yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Order #</th>
                    <th className="py-2.5 px-4">Patient</th>
                    <th className="py-2.5 px-4">Tests</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {summary.recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground block">
                          {order.patient?.name || 'Patient'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {order.patient?.abhaAddress || order.patientId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-foreground truncate max-w-[150px] block">
                          {order.tests.map((t) => t.testName).join(', ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {order.tests.length} test(s)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.priority === 'STAT'
                              ? 'bg-rose-500/15 text-rose-600'
                              : order.priority === 'URGENT'
                              ? 'bg-amber-500/15 text-amber-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {order.priority || 'ROUTINE'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <LabOrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/laboratory/orders/${order.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors inline-block"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Catalogue Categories & Quick Links */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Diagnostic Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/laboratory/samples/scan"
                className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border text-left transition-colors flex flex-col gap-1.5"
              >
                <Scan className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-foreground">Scan Sample</span>
                <span className="text-[10px] text-muted-foreground">Instant accessioning</span>
              </Link>
              <Link
                href="/laboratory/tests/new"
                className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border text-left transition-colors flex flex-col gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-semibold text-foreground">Add Test</span>
                <span className="text-[10px] text-muted-foreground">Define parameters</span>
              </Link>
              <Link
                href="/laboratory/orders"
                className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border text-left transition-colors flex flex-col gap-1.5"
              >
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-foreground">Order Queue</span>
                <span className="text-[10px] text-muted-foreground">Review & accept</span>
              </Link>
              <Link
                href="/laboratory/collection-centers"
                className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border text-left transition-colors flex flex-col gap-1.5"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-foreground">Centers</span>
                <span className="text-[10px] text-muted-foreground">Phlebotomy network</span>
              </Link>
            </div>
          </div>

          {/* Catalogue Breakdown */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Catalogue Breakdown
              </h3>
              <Link
                href="/laboratory/tests"
                className="text-[11px] font-semibold text-teal-600 hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2">
              {summary?.testCatalogueSummary && summary.testCatalogueSummary.length > 0 ? (
                summary.testCatalogueSummary.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30 text-xs"
                  >
                    <span className="text-foreground font-medium">{cat.category}</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                      {cat.count} test(s)
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No active tests catalogued.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
