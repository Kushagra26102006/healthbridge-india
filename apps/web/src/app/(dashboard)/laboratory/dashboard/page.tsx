'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import {
  useLaboratoryDashboardSummary,
  useLaboratoryProfile,
} from '@/features/laboratory/hooks/use-laboratory';
import { laboratoryReportsApi } from '@/features/laboratory/api/laboratory-reports-api';
import { LaboratoryStatCard, LabOrderStatusBadge } from '@/components/laboratory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { Alert } from '@/components/ui/alert';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SkeletonStatGrid } from '@/components/ui/skeleton';
import { StaggerList, StaggerItem } from '@/components/motion';
import { MOTION_EASE } from '@/lib/motion/tokens';
import type { LaboratoryOrderDto } from '@healthbridge/shared-types';
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
  FlaskConical,
  Activity,
  FileText,
  BarChart3,
} from 'lucide-react';

export default function LaboratoryDashboardPage() {
  const { data: summary, isLoading, error, refetch } = useLaboratoryDashboardSummary();
  const { data: profile } = useLaboratoryProfile();

  const { data: reportsData } = useQuery({
    queryKey: ['laboratory', 'dashboard-reports-metrics'],
    queryFn: () => laboratoryReportsApi.listReports({ limit: 50 }).catch(() => ({ items: [], total: 0, page: 1, limit: 50, totalPages: 1 })),
    staleTime: 60 * 1000,
  });

  const reportMetrics = useMemo(() => {
    const items = reportsData?.items ?? [];
    const ready = items.filter((r) =>
      ['APPROVED', 'PUBLISHED', 'COMPLETED'].includes(String(r.status).toUpperCase())
    ).length;
    const pendingReview = items.filter((r) =>
      ['PENDING_REVIEW', 'UNDER_REVIEW', 'DRAFT', 'GENERATED', 'PRELIMINARY'].includes(
        String(r.status).toUpperCase()
      )
    ).length;
    return { ready, pendingReview, total: reportsData?.total ?? items.length };
  }, [reportsData]);

  const orderColumns: DataTableColumn<LaboratoryOrderDto>[] = useMemo(
    () => [
      {
        key: 'orderNumber',
        header: 'Order #',
        cell: (order) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {order.orderNumber}
          </span>
        ),
      },
      {
        key: 'patient',
        header: 'Patient',
        cell: (order) => (
          <div className="min-w-0">
            <span className="font-medium text-foreground block truncate">
              {order.patient?.name || 'Patient'}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono truncate block">
              {order.patient?.abhaAddress ||
                (typeof order.patientId === 'string' ? order.patientId : order.patient?.id || '—')}
            </span>
          </div>
        ),
      },
      {
        key: 'tests',
        header: 'Tests',
        cell: (order) => (
          <div className="min-w-0">
            <span className="text-foreground truncate max-w-[180px] block text-xs">
              {order.tests.map((t) => t.testName).join(', ')}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {order.tests.length} test(s)
            </span>
          </div>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        cell: (order) => (
          <Badge
            variant={
              order.priority === 'STAT'
                ? 'error'
                : order.priority === 'URGENT'
                  ? 'warning'
                  : 'neutral'
            }
            size="sm"
          >
            {order.priority || 'ROUTINE'}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (order) => <LabOrderStatusBadge status={order.status} />,
      },
      {
        key: 'action',
        header: 'Action',
        align: 'right',
        cell: (order) => (
          <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2.5">
            <Link href={`/laboratory/orders/${order.id}`}>Review</Link>
          </Button>
        ),
      },
    ],
    []
  );

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Alert
          variant="error"
          title="Unable to Load Laboratory Dashboard"
          description="An error occurred while connecting to the laboratory service. Please verify connectivity and retry."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry</span>
            </Button>
          }
        />
      </div>
    );
  }

  const totalOrders =
    (summary?.newOrders ?? 0) +
    (summary?.pendingOrderReviews ?? 0) +
    (summary?.acceptedOrders ?? 0) +
    (summary?.completedOrders ?? 0);
  const samplesCollected = (summary?.samplesReceived ?? 0) + (summary?.samplesAccessioned ?? 0);
  const reportsReadyCount = Math.max(reportMetrics.ready, summary?.completedOrders ?? 0);
  const reportsPendingReviewCount = Math.max(
    reportMetrics.pendingReview,
    summary?.resultsSubmittedCount ?? 0
  );

  const pipelineStages = [
    { label: 'Pending Order Reviews', value: summary?.pendingOrderReviews ?? 0 },
    { label: 'Awaiting Sample Collection', value: summary?.samplesAwaitingCollection ?? 0 },
    { label: 'Samples Accessioned', value: summary?.samplesAccessioned ?? 0 },
    { label: 'Active Processing Worklist', value: summary?.activeWorklistItems ?? 0 },
    { label: 'Submitted for Authorization', value: reportsPendingReviewCount },
    { label: 'Completed / Ready', value: reportsReadyCount },
  ];
  const maxPipeline = Math.max(1, ...pipelineStages.map((s) => s.value));
  const maxCategoryCount = Math.max(
    1,
    ...(summary?.testCatalogueSummary?.map((c) => c.count) ?? [1])
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Welcome Banner (Accurate Verification Status — Zero Fabricated Accreditations) */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#080F1E] via-[#111C30] to-[#0D3B4C] p-6 sm:p-8 text-white shadow-lg border border-slate-700/50">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none"
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant={profile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                size="sm"
                className="bg-white/10 text-teal-200 border-white/15"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {profile?.verificationStatus === 'VERIFIED'
                    ? 'Verified Diagnostic Laboratory'
                    : `Status: ${profile?.verificationStatus || 'VERIFICATION PENDING'}`}
                </span>
              </Badge>
              {profile?.laboratoryLicenseNumber && (
                <span className="text-xs text-slate-300 font-mono">
                  LIC: {profile.laboratoryLicenseNumber}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {profile?.laboratoryName || 'Diagnostic Laboratory Workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manage diagnostic test orders, track barcode-accessioned samples, process analytical
              worklists, and authorize diagnostic reports cleanly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="secondary" size="sm" asChild className="h-9 sm:h-10 px-4 font-semibold">
                <Link href="/laboratory/samples/scan">
                  <Scan className="w-4 h-4" aria-hidden="true" />
                  <span>Scan Barcode</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 sm:h-10 px-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                <Link href="/laboratory/orders">
                  <ClipboardList className="w-4 h-4 text-teal-300" aria-hidden="true" />
                  <span>Review Orders</span>
                </Link>
              </Button>
            </div>
            <div className="hidden xl:block w-44 shrink-0">
              <EditorialVisual
                asset="ecosystemLaboratoryDiagnostics"
                aspectClassName="aspect-[16/10]"
                sizes="176px"
                className="rounded-lg border-white/15 bg-white/5 shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Lab Alerts Banner (only when actual critical alerts exist) */}
      {(summary?.criticalAlertsCount ?? 0) > 0 && (
        <Alert
          variant="warning"
          title={`${summary?.criticalAlertsCount} Critical Diagnostic Result Alert(s) Require Attention`}
          description="Review flagged critical observations and complete pathologist verification before publishing."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/laboratory/reports">Inspect Pending Reports</Link>
            </Button>
          }
        />
      )}

      {/* 2. Primary 6 Real-Data Laboratory KPI Cards */}
      {isLoading ? (
        <SkeletonStatGrid count={6} className="lg:grid-cols-3" />
      ) : (
        <StaggerList
          inView={false}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <StaggerItem>
            <Link href="/laboratory/orders" className="block focus-ring rounded-lg h-full">
              <LaboratoryStatCard
                title="Total Test Orders"
                value={totalOrders}
                subtitle={`${summary?.pendingOrderReviews ?? 0} pending review`}
                icon={ClipboardList}
                variant="sky"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/laboratory/samples/collect" className="block focus-ring rounded-lg h-full">
              <LaboratoryStatCard
                title="Pending Samples"
                value={summary?.samplesAwaitingCollection ?? 0}
                subtitle="Awaiting collection or intake"
                icon={Clock}
                variant="amber"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/laboratory/samples" className="block focus-ring rounded-lg h-full">
              <LaboratoryStatCard
                title="Samples Collected"
                value={samplesCollected}
                subtitle={`${summary?.samplesAccessioned ?? 0} accessioned in custody`}
                icon={PackageCheck}
                variant="teal"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/laboratory/workload" className="block focus-ring rounded-lg h-full">
              <LaboratoryStatCard
                title="Tests Processing"
                value={summary?.activeWorklistItems ?? 0}
                subtitle={`${summary?.resultsDraftCount ?? 0} draft results in progress`}
                icon={Activity}
                variant="indigo"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/laboratory/reports" className="block focus-ring rounded-lg h-full">
              <LaboratoryStatCard
                title="Reports Ready"
                value={reportsReadyCount}
                subtitle="Authorized & published reports"
                icon={CheckCircle2}
                variant="emerald"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/laboratory/reports" className="block focus-ring rounded-lg h-full">
              <LaboratoryStatCard
                title="Reports Pending Review"
                value={reportsPendingReviewCount}
                subtitle="Awaiting formal verification"
                icon={FileText}
                variant="rose"
              />
            </Link>
          </StaggerItem>
        </StaggerList>
      )}

      {/* 3. Main Two-Column Diagnostic Operations Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Responsive Recent Orders Table + Live Pipeline Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-card-heading">Recent Laboratory Orders</h3>
                <p className="text-xs text-muted-foreground">
                  Physician diagnostic orders queued for intake and analytical processing
                </p>
              </div>
              <Link
                href="/laboratory/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <DataTable
              data={(summary?.recentOrders ?? []).slice(0, 6)}
              columns={orderColumns}
              getRowId={(order) => order.id}
              loading={isLoading}
              skeletonRows={4}
              caption="Recent laboratory diagnostic orders"
              emptyState={
                <p className="text-xs text-muted-foreground">
                  No laboratory orders received yet.
                </p>
              }
            />
          </div>

          {/* Live Diagnostic Pipeline & Category Analytics */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-card-heading flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-secondary" aria-hidden="true" />
                  <span>Diagnostic Pipeline &amp; Category Analytics</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time operational volumes derived from active orders and catalogued tests
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/laboratory/quality/analytics">Full QMS Analytics</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Workflow Pipeline Distribution */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Workflow Stage Distribution
                </p>
                <div className="space-y-2.5">
                  {pipelineStages.map((stage) => (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate">{stage.label}</span>
                        <span className="tabular-nums text-muted-foreground">{stage.value}</span>
                      </div>
                      <div className="h-2 rounded-pill bg-muted overflow-hidden">
                        <m.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: stage.value > 0 ? Math.max(0.06, stage.value / maxPipeline) : 0 }}
                          transition={{ duration: 0.35, ease: MOTION_EASE.standard }}
                          style={{ transformOrigin: 'left' }}
                          className="h-full w-full rounded-pill bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Category Distribution */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Test Catalogue by Category ({summary?.totalActiveTests ?? 0})
                </p>
                {summary?.testCatalogueSummary && summary.testCatalogueSummary.length > 0 ? (
                  <div className="space-y-2.5">
                    {summary.testCatalogueSummary.slice(0, 6).map((cat) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground truncate">
                            {cat.category.replace(/_/g, ' ')}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {cat.count} test(s)
                          </span>
                        </div>
                        <div className="h-2 rounded-pill bg-muted overflow-hidden">
                          <m.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: Math.max(0.06, cat.count / maxCategoryCount) }}
                            transition={{ duration: 0.35, ease: MOTION_EASE.standard }}
                            style={{ transformOrigin: 'left' }}
                            className="h-full w-full rounded-pill bg-secondary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No active diagnostic tests catalogued yet.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Diagnostic Actions & Quality Links */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h3 className="text-card-heading">Diagnostic Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/laboratory/samples/scan"
                className="p-3 rounded-md bg-muted/40 hover:bg-muted/75 border border-border text-left transition-colors flex flex-col gap-1.5 focus-ring"
              >
                <Scan className="w-4 h-4 text-secondary" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">Scan Sample</span>
                <span className="text-[11px] text-muted-foreground">Barcode accessioning</span>
              </Link>
              <Link
                href="/laboratory/tests/new"
                className="p-3 rounded-md bg-muted/40 hover:bg-muted/75 border border-border text-left transition-colors flex flex-col gap-1.5 focus-ring"
              >
                <PlusCircle className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">Add Test</span>
                <span className="text-[11px] text-muted-foreground">Define parameters</span>
              </Link>
              <Link
                href="/laboratory/quality/control"
                className="p-3 rounded-md bg-muted/40 hover:bg-muted/75 border border-border text-left transition-colors flex flex-col gap-1.5 focus-ring"
              >
                <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">Quality Control</span>
                <span className="text-[11px] text-muted-foreground">QC runs &amp; gates</span>
              </Link>
              <Link
                href="/laboratory/collection-centers"
                className="p-3 rounded-md bg-muted/40 hover:bg-muted/75 border border-border text-left transition-colors flex flex-col gap-1.5 focus-ring"
              >
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">Centers</span>
                <span className="text-[11px] text-muted-foreground">Collection network</span>
              </Link>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-card-heading">Quality &amp; Verification Gates</h3>
              <Link
                href="/laboratory/quality"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open QMS
              </Link>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Diagnostic reports remain unverified drafts until QC release gates pass and an
              authorized reviewing professional formally approves and publishes the report.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" asChild>
                <Link href="/laboratory/quality/instruments">Equipment &amp; Calibration</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/laboratory/staff">Staff &amp; Roster</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
