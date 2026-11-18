'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileText,
  FlaskConical,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import { usePatientDashboard } from '@/features/patient/hooks/use-patient-dashboard';
import { useAppointments } from '@/features/appointments/hooks/use-appointments';
import { useRecords } from '@/features/records/hooks/use-records';
import { useLabReports } from '@/features/lab-reports/hooks/use-lab-reports';
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
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
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

export default function PatientAnalyticsPage() {
  const { toast } = useToast();
  const { summary, isLoading: summaryLoading } = usePatientDashboard();
  const { appointments, isLoading: apptLoading } = useAppointments({ page: 1, limit: 100 });
  const { records, isLoading: recLoading } = useRecords({ page: 1, limit: 100 });
  const { reports, isLoading: repLoading } = useLabReports({ page: 1, limit: 100 });

  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredAppointments = useMemo(
    () =>
      filterByDateRange(
        appointments,
        (a) => a.scheduledAt || a.createdAt,
        timeframe,
        fromDate,
        toDate
      ),
    [appointments, timeframe, fromDate, toDate]
  );

  const filteredRecords = useMemo(
    () => filterByDateRange(records, (r) => r.recordDate || r.createdAt, timeframe, fromDate, toDate),
    [records, timeframe, fromDate, toDate]
  );

  const filteredReports = useMemo(
    () => filterByDateRange(reports, (r) => r.reportDate, timeframe, fromDate, toDate),
    [reports, timeframe, fromDate, toDate]
  );

  const appointmentSeries = useMemo(
    () =>
      bucketTimeSeries(
        filteredAppointments,
        (a) => a.scheduledAt || a.createdAt,
        timeframe
      ),
    [filteredAppointments, timeframe]
  );

  const activityDistribution = useMemo(() => {
    const all = [
      { key: 'APPOINTMENTS', label: 'Appointments', value: filteredAppointments.length },
      { key: 'RECORDS', label: 'Health Records', value: filteredRecords.length },
      { key: 'LAB_REPORTS', label: 'Lab Reports', value: filteredReports.length },
      { key: 'PRESCRIPTIONS', label: 'Active Prescriptions', value: summary?.stats?.activePrescriptions ?? 0 },
    ];
    return categoryFilter === 'ALL' ? all : all.filter((i) => i.key === categoryFilter);
  }, [filteredAppointments, filteredRecords, filteredReports, summary, categoryFilter]);

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

  const handleExportCsv = () => {
    const rows = [
      ...activityDistribution.map((a) => ({ section: 'Personal Activity', label: a.label, value: a.value })),
      ...appointmentStatusData.map((s) => ({ section: 'Appointment History', label: s.label, value: s.value })),
    ];
    downloadAnalyticsCsv({
      filename: `healthbridge-personal-activity-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { header: 'Section', accessor: (r) => r.section },
        { header: 'Category', accessor: (r) => r.label },
        { header: 'Count', accessor: (r) => r.value },
      ],
      rows,
    });
    toast({
      variant: 'success',
      title: 'Personal activity exported',
      description: 'Downloaded your filtered personal activity summary as CSV.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">
            <ShieldCheck className="h-3 w-3 mr-1" aria-hidden="true" />
            Private Self-Only View
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-secondary" aria-hidden="true" />
          <span>Personal Health Activity Summary</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your appointments, health records, prescriptions, and laboratory reports. Informational activity summary only — never generates medical diagnoses.
        </p>
      </div>

      <AnalyticsFilterBar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        categoryLabel="Activity category"
        categoryValue={categoryFilter}
        categoryOptions={[
          { value: 'ALL', label: 'All Activity Categories' },
          { value: 'APPOINTMENTS', label: 'Appointments' },
          { value: 'RECORDS', label: 'Health Records' },
          { value: 'LAB_REPORTS', label: 'Laboratory Reports' },
          { value: 'PRESCRIPTIONS', label: 'Prescriptions' },
        ]}
        onCategoryChange={setCategoryFilter}
        onReset={() => {
          setTimeframe('all');
          setFromDate('');
          setToDate('');
          setCategoryFilter('ALL');
        }}
        onExportCsv={handleExportCsv}
        onPrintReport={() => triggerPrintableReport()}
      />

      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AnalyticsKpiCard
            label="Appointments (Filtered)"
            value={filteredAppointments.length}
            helperText={`Upcoming: ${summary?.stats?.upcomingAppointments ?? 0}`}
            icon={Calendar}
            tone="primary"
            loading={apptLoading || summaryLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Health Records"
            value={filteredRecords.length}
            helperText="Stored in your personal vault"
            icon={FileText}
            tone="secondary"
            loading={recLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Prescriptions"
            value={summary?.stats?.activePrescriptions ?? 0}
            helperText="Issued by your clinicians"
            icon={Pill}
            tone="info"
            loading={summaryLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Laboratory Reports"
            value={filteredReports.length}
            helperText="Authorized diagnostic reports"
            icon={FlaskConical}
            tone="success"
            loading={repLoading}
          />
        </StaggerItem>
      </StaggerList>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsAreaChart
          title="Appointment History Timeline"
          description="Chronological count of your scheduled and completed visits"
          seriesLabel="Appointments"
          colorVar="hsl(var(--chart-1))"
          data={appointmentSeries}
          loading={apptLoading}
          emptyTitle="No appointments in selected timeframe"
        />

        <AnalyticsDonutChart
          title="Personal Health Activity Distribution"
          description="Breakdown across appointments, records, prescriptions, and lab reports"
          centerLabel="Items"
          data={activityDistribution}
          loading={apptLoading || recLoading || repLoading || summaryLoading}
        />
      </div>

      <AnalyticsBarChart
        title="Appointment Status Breakdown"
        description="Summary of your appointment statuses across the selected timeframe"
        orientation="horizontal"
        data={appointmentStatusData}
        loading={apptLoading}
        emptyTitle="No appointment statuses to display"
      />

      <Alert variant="info" title="Clinical Non-Diagnostic Notice">
        This summary displays counts of your personal healthcare activity only. It does not generate automated diagnoses, risk scores, or clinical predictions—please consult your treating doctor for medical interpretation.
      </Alert>
    </div>
  );
}
