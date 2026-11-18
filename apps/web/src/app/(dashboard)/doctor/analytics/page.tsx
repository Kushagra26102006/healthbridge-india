'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import {
  useDoctorDashboard,
  useDoctorAppointments,
  useDoctorEncounters,
  useDoctorQueue,
} from '@/features/doctor/hooks/use-doctor';
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsComparisonCard,
  AnalyticsDonutChart,
  AnalyticsFilterBar,
  AnalyticsKpiCard,
} from '@/components/analytics';
import {
  bucketTimeSeries,
  downloadAnalyticsCsv,
  filterByDateRange,
  triggerPrintableReport,
  type AnalyticsTimeframe,
} from '@/lib/analytics/export';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

export default function DoctorAnalyticsPage() {
  const { toast } = useToast();
  const { summary: dashboard, isLoading: dashLoading } = useDoctorDashboard();
  const { appointments, isLoading: apptLoading } = useDoctorAppointments({
    page: 1,
    limit: 100,
  });
  const { encounters, isLoading: encLoading } = useDoctorEncounters({
    page: 1,
    limit: 100,
  });
  const { queue: queueItems, isLoading: queueLoading } = useDoctorQueue();

  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredAppointments = useMemo(() => {
    const dated = filterByDateRange(
      appointments,
      (a) => a.scheduledAt,
      timeframe,
      fromDate,
      toDate
    );
    return statusFilter ? dated.filter((a) => a.status === statusFilter) : dated;
  }, [appointments, timeframe, fromDate, toDate, statusFilter]);

  const filteredEncounters = useMemo(
    () =>
      filterByDateRange(
        encounters,
        (e) => e.createdAt,
        timeframe,
        fromDate,
        toDate
      ),
    [encounters, timeframe, fromDate, toDate]
  );

  const appointmentSeries = useMemo(
    () =>
      bucketTimeSeries(
        filteredAppointments,
        (a) => a.scheduledAt,
        timeframe
      ),
    [filteredAppointments, timeframe]
  );

  const appointmentStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    filteredAppointments.forEach((a) => {
      counts.set(a.status, (counts.get(a.status) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([status, value]) => ({
      key: status,
      label: status.replace(/_/g, ' '),
      value,
    }));
  }, [filteredAppointments]);

  const completedConsultations = filteredEncounters.filter(
    (e) => e.status === 'COMPLETED'
  ).length;
  const pendingConsultations = filteredEncounters.length - completedConsultations;

  const queueBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    queueItems.forEach((q) => {
      const st = q.status || 'WAITING';
      counts.set(st, (counts.get(st) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([status, value]) => ({
      key: status,
      label: status.replace(/_/g, ' '),
      value,
    }));
  }, [queueItems]);

  const handleExportCsv = () => {
    const rows = [
      ...appointmentStatusData.map((s) => ({ section: 'Appointment Status', label: s.label, value: s.value })),
      { section: 'Consultations', label: 'Completed / Finalized', value: completedConsultations },
      { section: 'Consultations', label: 'Pending / Draft', value: pendingConsultations },
    ];
    downloadAnalyticsCsv({
      filename: `healthbridge-doctor-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { header: 'Section', accessor: (r) => r.section },
        { header: 'Metric', accessor: (r) => r.label },
        { header: 'Count', accessor: (r) => r.value },
      ],
      rows,
    });
    toast({
      variant: 'success',
      title: 'Clinical practice summary exported',
      description: 'Exported de-identified appointment and consultation statistics (zero patient PII).',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="primary" size="sm">
            Doctor-Authorized Practice Telemetry
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-secondary" aria-hidden="true" />
          <span>Clinical Practice Analytics</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Appointment trends, completed vs. pending consultations, and live patient queue statistics scoped exclusively to your clinical practice.
        </p>
      </div>

      <AnalyticsFilterBar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        categoryLabel="Appointment status"
        categoryValue={statusFilter}
        categoryOptions={[
          { value: '', label: 'All Appointment Statuses' },
          { value: 'REQUESTED', label: 'Requested' },
          { value: 'CONFIRMED', label: 'Confirmed' },
          { value: 'SCHEDULED', label: 'Scheduled' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'CANCELLED', label: 'Cancelled' },
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

      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AnalyticsKpiCard
            label="Appointments (Filtered)"
            value={filteredAppointments.length}
            helperText={`Today: ${dashboard?.stats?.todayAppointments ?? 0}`}
            icon={Calendar}
            tone="primary"
            loading={apptLoading || dashLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Completed Consultations"
            value={completedConsultations}
            helperText="Finalized clinical encounters"
            icon={CheckCircle2}
            tone="success"
            loading={encLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Pending / Draft Consultations"
            value={pendingConsultations}
            helperText="Awaiting clinical completion"
            icon={Clock}
            tone={pendingConsultations > 0 ? 'warning' : 'success'}
            loading={encLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Queue Patients"
            value={queueItems.length}
            helperText={`Total assigned patients: ${dashboard?.stats?.totalAssignedPatients ?? 0}`}
            icon={Users}
            tone="secondary"
            loading={queueLoading || dashLoading}
          />
        </StaggerItem>
      </StaggerList>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsAreaChart
          title="Appointment & Consultation Trend"
          description="Chronological trend computed from your scheduled appointments"
          seriesLabel="Appointments"
          colorVar="hsl(var(--chart-1))"
          data={appointmentSeries}
          loading={apptLoading}
          emptyTitle="No appointments recorded in selected timeframe"
        />

        <AnalyticsDonutChart
          title="Appointment Status Breakdown"
          description="Distribution across confirmed, completed, pending, and cancelled slots"
          centerLabel="Slots"
          data={appointmentStatusData}
          loading={apptLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsComparisonCard
          title="Consultation Completion Summary"
          description="Completed vs. pending clinical encounters in selected timeframe"
          items={[
            { label: 'Completed / Finalized', value: completedConsultations, tone: 'success' },
            { label: 'Pending / Draft', value: pendingConsultations, tone: 'warning' },
          ]}
        />

        <AnalyticsBarChart
          title="Live Patient Queue Summary"
          description="Current clinic queue status distribution"
          orientation="horizontal"
          data={queueBreakdown}
          loading={queueLoading}
          emptyTitle="Queue is currently clear"
        />
      </div>
    </div>
  );
}
