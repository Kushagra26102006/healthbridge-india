'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  FileText,
  FlaskConical,
} from 'lucide-react';
import { useQualityDashboard } from '@/features/laboratory/hooks/use-laboratory-quality';
import { useLaboratoryDashboardSummary } from '@/features/laboratory/hooks/use-laboratory';
import { laboratoryReportsApi } from '@/features/laboratory/api/laboratory-reports-api';
import { QualityTrendCharts } from '@/features/laboratory/components/QualityTrendCharts';
import type { LabReportListItemDto } from '@healthbridge/shared-types';
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsFilterBar,
  AnalyticsKpiCard,
  AnalyticsPieChart,
  AnalyticsProgressIndicator,
} from '@/components/analytics';
import {
  bucketTimeSeries,
  downloadAnalyticsCsv,
  filterByDateRange,
  triggerPrintableReport,
  type AnalyticsTimeframe,
} from '@/lib/analytics/export';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

export default function QualityAnalyticsPage() {
  const { toast } = useToast();
  const { data: qualityData, loading: qualityLoading, error, refetch: refetchQuality } =
    useQualityDashboard();
  const { data: labSummary, isLoading: summaryLoading, refetch: refetchSummary } =
    useLaboratoryDashboardSummary();

  const [reports, setReports] = useState<LabReportListItemDto[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Interactive Filters
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await laboratoryReportsApi.listReports({ page: 1, limit: 100 });
      setReports(res?.items || []);
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const dated = filterByDateRange(
      reports,
      (r) => r.reportDate,
      timeframe,
      fromDate,
      toDate
    );
    return statusFilter ? dated.filter((r) => r.status === statusFilter) : dated;
  }, [reports, timeframe, fromDate, toDate, statusFilter]);

  const reportTrendSeries = useMemo(
    () => bucketTimeSeries(filteredReports, (r) => r.reportDate, timeframe),
    [filteredReports, timeframe]
  );

  const reportStatusDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    filteredReports.forEach((r) => {
      counts.set(r.status, (counts.get(r.status) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([status, value]) => ({
      key: status,
      label: status.replace(/_/g, ' '),
      value,
    }));
  }, [filteredReports]);

  const samplePipelineData = useMemo(() => {
    const s = labSummary;
    if (!s) return [];
    return [
      { key: 'newOrders', label: 'New Orders', value: s.newOrders ?? 0 },
      { key: 'awaiting', label: 'Samples Awaiting Collection', value: s.samplesAwaitingCollection ?? 0 },
      { key: 'received', label: 'Samples Received', value: s.samplesReceived ?? 0 },
      { key: 'worklist', label: 'Active Worklist', value: s.activeWorklistItems ?? 0 },
      { key: 'completed', label: 'Completed Orders', value: s.completedOrders ?? 0 },
    ];
  }, [labSummary]);

  const categoryDistribution = useMemo(() => {
    const cats = labSummary?.testCatalogueSummary ?? [];
    return cats.map((c) => ({
      key: c.category,
      label: c.category,
      value: c.count,
    }));
  }, [labSummary]);

  const qcPassRate = qualityData?.kpis?.qcPassRate;
  const isBusy = qualityLoading || summaryLoading || reportsLoading;

  const handleRefresh = () => {
    void refetchQuality();
    void refetchSummary();
    void loadReports();
  };

  const handleExportCsv = () => {
    const rows = [
      ...samplePipelineData.map((d) => ({ group: 'Sample & Test Pipeline', metric: d.label, value: d.value })),
      ...reportStatusDistribution.map((d) => ({ group: 'Filtered Report Status', metric: d.label, value: d.value })),
      ...categoryDistribution.map((d) => ({ group: 'Test Categories', metric: d.label, value: d.value })),
    ];
    downloadAnalyticsCsv({
      filename: `healthbridge-lab-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { header: 'Group', accessor: (r) => r.group },
        { header: 'Metric', accessor: (r) => r.metric },
        { header: 'Count', accessor: (r) => r.value },
      ],
      rows,
    });
    toast({
      variant: 'success',
      title: 'Laboratory analytics exported',
      description: `Exported ${rows.length} de-identified diagnostic metrics to CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">
              De-Identified Diagnostic Telemetry
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-secondary" aria-hidden="true" />
            <span>Laboratory &amp; Quality Analytics</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live sample processing pipeline, report completion trends, test category distribution, and QMS pass rates (zero patient identifiers).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isBusy}
          className="self-start md:self-auto print:hidden"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh Analytics</span>
        </Button>
      </div>

      {/* Filter & Export Toolbar */}
      <AnalyticsFilterBar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        categoryLabel="Report status filter"
        categoryValue={statusFilter}
        categoryOptions={[
          { value: '', label: 'All Report Statuses' },
          { value: 'DRAFT', label: 'Draft' },
          { value: 'PENDING_REVIEW', label: 'Pending Review' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'PUBLISHED', label: 'Published' },
          { value: 'AMENDED', label: 'Amended' },
        ]}
        onCategoryChange={setStatusFilter}
        onReset={() => {
          setTimeframe('all');
          setFromDate('');
          setToDate('');
          setStatusFilter('');
        }}
        onExportCsv={handleExportCsv}
        onPrintReport={() => triggerPrintableReport()}
      />

      {error && (
        <Alert variant="error" title="Quality Telemetry Error">
          {error}
        </Alert>
      )}

      {/* Top KPI Cards (Real Data Only — Zero Hardcoded Fallback Rates) */}
      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AnalyticsKpiCard
            label="QC Pass Rate"
            value={qcPassRate !== undefined && qcPassRate !== null ? `${qcPassRate}%` : 'N/A'}
            helperText="Computed from recorded QC runs (target > 95%)"
            icon={CheckCircle2}
            tone="success"
            loading={qualityLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Filtered Reports"
            value={filteredReports.length}
            helperText={`${filteredReports.filter((r) => r.status === 'PENDING_REVIEW').length} pending review`}
            icon={FileText}
            tone="primary"
            loading={reportsLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Worklist"
            value={labSummary?.activeWorklistItems ?? 0}
            helperText={`${labSummary?.samplesAwaitingCollection ?? 0} awaiting collection`}
            icon={FlaskConical}
            tone="info"
            loading={summaryLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Analyzers"
            value={qualityData?.kpis?.instrumentsInService ?? 0}
            helperText={`${qualityData?.kpis?.instrumentsRequiringMaintenance ?? 0} requiring maintenance · ${qualityData?.kpis?.openQualityIncidents ?? 0} open incidents`}
            icon={Cpu}
            tone="secondary"
            loading={qualityLoading}
          />
        </StaggerItem>
      </StaggerList>

      {/* Primary Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsAreaChart
          title="Diagnostic Report Volume Trend"
          description="Chronological trend computed from real laboratory report timestamps"
          seriesLabel="Reports"
          colorVar="hsl(var(--chart-2))"
          data={reportTrendSeries}
          loading={reportsLoading}
          emptyTitle="No dated laboratory reports in selected range"
          emptyDescription="Reports generated within the selected timeframe will appear here automatically."
        />

        <AnalyticsBarChart
          title="Sample & Diagnostic Processing Pipeline"
          description="Live counts from order intake through sample processing and report readiness"
          orientation="horizontal"
          data={samplePipelineData}
          loading={summaryLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsDonutChart
          title="Report Lifecycle Distribution"
          description="Filtered laboratory reports grouped by workflow status"
          centerLabel="Reports"
          data={reportStatusDistribution}
          loading={reportsLoading}
        />

        <AnalyticsPieChart
          title="Test Category Distribution"
          description="Diagnostic volume across laboratory test categories"
          variant="pie"
          data={categoryDistribution}
          loading={summaryLoading}
          emptyTitle="No category breakdown recorded yet"
        />
      </div>

      {/* QC Target Progress Card */}
      {qcPassRate !== undefined && qcPassRate !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quality Control Compliance Target</CardTitle>
            <CardDescription>Live QC pass rate compared against 95% internal benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsProgressIndicator
              label="Recorded QC Run Pass Rate"
              value={qcPassRate}
              max={100}
              unit="%"
              targetLabel="Target >= 95%"
              tone={qcPassRate >= 95 ? 'success' : 'warning'}
            />
          </CardContent>
        </Card>
      )}

      {/* Preserved QMS Trend Charts */}
      {qualityData?.monthlyTrends && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Detailed QMS Statistical Charts</span>
          </div>
          <QualityTrendCharts trends={qualityData.monthlyTrends} />
        </div>
      )}
    </div>
  );
}
