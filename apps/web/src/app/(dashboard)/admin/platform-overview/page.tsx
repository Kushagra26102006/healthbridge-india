'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Stethoscope,
  Building2,
  FlaskConical,
  RefreshCw,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type {
  AbdmConsentAdminAnalyticsDto,
  AdminPlatformOverviewDto,
} from '@healthbridge/shared-types';
import { platformApi } from '@/features/platform/api/platform-api';
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import {
  AnalyticsBarChart,
  AnalyticsComparisonCard,
  AnalyticsDonutChart,
  AnalyticsFilterBar,
  AnalyticsKpiCard,
  AnalyticsPieChart,
} from '@/components/analytics';
import {
  downloadAnalyticsCsv,
  triggerPrintableReport,
  type AnalyticsTimeframe,
} from '@/lib/analytics/export';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

export default function AdminPlatformOverviewPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminPlatformOverviewDto | null>(null);
  const [consentData, setConsentData] = useState<AbdmConsentAdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Filters
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, consentRes] = await Promise.allSettled([
        platformApi.getAdminPlatformOverview(),
        abdmConsentApi.getAdminAnalytics(),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setData(overviewRes.value);
      } else {
        setError('Unable to load platform overview. Ensure you are authenticated as ADMIN.');
      }

      if (consentRes.status === 'fulfilled') {
        setConsentData(consentRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roleChartData = useMemo(() => {
    if (!data) return [];
    const all = [
      { key: 'PATIENT', label: 'Registered Patients', value: data.users.registeredPatients },
      { key: 'DOCTOR', label: 'Active Doctors', value: data.users.activeDoctors },
      { key: 'PHARMACY', label: 'Active Pharmacies', value: data.users.activePharmacies },
      { key: 'LABORATORY', label: 'Active Laboratories', value: data.users.activeLaboratories },
    ];
    return roleFilter === 'ALL' ? all : all.filter((r) => r.key === roleFilter);
  }, [data, roleFilter]);

  const facilityChartData = useMemo(() => {
    if (!data) return [];
    return [
      { key: 'PHARMACY', label: 'Pharmacies', value: data.users.activePharmacies },
      { key: 'LABORATORY', label: 'Diagnostic Laboratories', value: data.users.activeLaboratories },
    ];
  }, [data]);

  const platformUsageData = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: 'appointments',
        label: 'Appointments',
        value: data.clinicalOperations.totalAppointments,
        sublabel: `${data.clinicalOperations.upcomingAppointments} upcoming`,
      },
      {
        key: 'encounters',
        label: 'Clinical Encounters',
        value: data.clinicalOperations.totalEncounters,
        sublabel: `${data.clinicalOperations.finalizedEncounters} finalized`,
      },
      {
        key: 'prescriptions',
        label: 'Prescriptions',
        value: data.clinicalOperations.totalPrescriptions,
        sublabel: `${data.clinicalOperations.activePrescriptions} active`,
      },
      {
        key: 'dispensing',
        label: 'Dispensing Records',
        value: data.clinicalOperations.dispensingRecords,
      },
      {
        key: 'labOrders',
        label: 'Lab Orders',
        value: data.clinicalOperations.totalLabOrders,
      },
      {
        key: 'labReports',
        label: 'Published Lab Reports',
        value: data.clinicalOperations.publishedLabReports,
        sublabel: `${data.clinicalOperations.amendedLabReports} amended`,
      },
    ];
  }, [data]);

  const consentChartData = useMemo(() => {
    const m = consentData?.metrics;
    if (!m) return [];
    return [
      { key: 'pending', label: 'Pending Requests', value: m.pendingRequests },
      { key: 'approved', label: 'Approved Requests', value: m.approvedRequests },
      { key: 'active', label: 'Active Artefacts', value: m.activeArtefacts },
      { key: 'expired', label: 'Expired Consents', value: m.expiredArtefacts + m.expiredRequests },
      { key: 'revoked', label: 'Revoked Artefacts', value: m.revokedArtefacts },
    ];
  }, [consentData]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows: Array<{ section: string; metric: string; value: number | string }> = [];

    if (categoryFilter === 'ALL' || categoryFilter === 'USERS') {
      roleChartData.forEach((r) =>
        rows.push({ section: 'Users & Roles', metric: r.label, value: r.value })
      );
    }
    if (categoryFilter === 'ALL' || categoryFilter === 'CLINICAL') {
      platformUsageData.forEach((u) =>
        rows.push({ section: 'Platform Usage', metric: u.label, value: u.value })
      );
    }
    if (categoryFilter === 'ALL' || categoryFilter === 'CONSENT') {
      consentChartData.forEach((c) =>
        rows.push({ section: 'Consent Activity', metric: c.label, value: c.value })
      );
    }

    downloadAnalyticsCsv({
      filename: `healthbridge-admin-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { header: 'Section', accessor: (r) => r.section },
        { header: 'Metric', accessor: (r) => r.metric },
        { header: 'Count', accessor: (r) => r.value },
      ],
      rows,
    });
    toast({
      variant: 'success',
      title: 'Analytics CSV exported',
      description: `Exported ${rows.length} aggregate metrics (zero patient PII).`,
    });
  };

  const showUsers = categoryFilter === 'ALL' || categoryFilter === 'USERS';
  const showClinical = categoryFilter === 'ALL' || categoryFilter === 'CLINICAL';
  const showConsent = categoryFilter === 'ALL' || categoryFilter === 'CONSENT';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              Zero Patient PII
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono">
              ABDM: {data?.abdm.overallStatus ?? 'Checking...'}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-secondary" aria-hidden="true" />
            <span>Global Platform Analytics</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live server-authorized aggregate visualizations across platform accounts, facilities, clinical activity, consent lifecycle, and notification delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/integrations/abdm">
              <span>ABDM Governance</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Interactive Filter & Export Bar */}
      <AnalyticsFilterBar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        showTimeframe={false}
        categoryLabel="Analytics domain"
        categoryValue={categoryFilter}
        categoryOptions={[
          { value: 'ALL', label: 'All Analytics Domains' },
          { value: 'USERS', label: 'Users & Facilities' },
          { value: 'CLINICAL', label: 'Platform Clinical Usage' },
          { value: 'CONSENT', label: 'Consent & Notifications' },
        ]}
        onCategoryChange={setCategoryFilter}
        secondaryLabel="Filter role distribution"
        secondaryValue={roleFilter}
        secondaryOptions={[
          { value: 'ALL', label: 'All Roles' },
          { value: 'PATIENT', label: 'Patients' },
          { value: 'DOCTOR', label: 'Doctors' },
          { value: 'PHARMACY', label: 'Pharmacies' },
          { value: 'LABORATORY', label: 'Laboratories' },
        ]}
        onSecondaryChange={setRoleFilter}
        onReset={() => {
          setCategoryFilter('ALL');
          setRoleFilter('ALL');
          setSelectedMetricKey(null);
        }}
        onExportCsv={handleExportCsv}
        onPrintReport={() => triggerPrintableReport()}
        exportDisabled={!data}
      />

      {error && (
        <Alert variant="error" title="Analytics Unavailable">
          {error}
        </Alert>
      )}

      {/* Top KPI Summary */}
      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AnalyticsKpiCard
            label="Registered Patients"
            value={data?.users.registeredPatients ?? 0}
            helperText={`${data?.abdm.verifiedAbhaLinks ?? 0} verified ABHA links`}
            icon={Users}
            tone="primary"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Doctors"
            value={data?.users.activeDoctors ?? 0}
            helperText="Verified clinical accounts"
            icon={Stethoscope}
            tone="secondary"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Pharmacies"
            value={data?.users.activePharmacies ?? 0}
            helperText="Connected pharmacy workspaces"
            icon={Building2}
            tone="warning"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Active Laboratories"
            value={data?.users.activeLaboratories ?? 0}
            helperText="Connected diagnostic LIMS labs"
            icon={FlaskConical}
            tone="info"
            loading={loading}
          />
        </StaggerItem>
      </StaggerList>

      {/* Users & Facilities Charts */}
      {showUsers && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsDonutChart
            title="Role & Active User Distribution"
            description="Live MongoDB account distribution by platform role"
            centerLabel="Accounts"
            data={roleChartData}
            loading={loading}
            selectedKey={selectedMetricKey}
            onSelectSlice={(slice) =>
              setSelectedMetricKey((prev) => (prev === slice.key ? null : slice.key))
            }
          />

          <AnalyticsPieChart
            title="Healthcare Facility Distribution"
            description="Active connected pharmacy & diagnostic laboratory facilities"
            variant="pie"
            data={facilityChartData}
            loading={loading}
            selectedKey={selectedMetricKey}
            onSelectSlice={(slice) =>
              setSelectedMetricKey((prev) => (prev === slice.key ? null : slice.key))
            }
          />
        </div>
      )}

      {/* Platform Clinical Usage Bar Chart */}
      {showClinical && (
        <AnalyticsBarChart
          title="Cross-Module Platform Usage & Clinical Activity"
          description="Live aggregate counts across appointments, encounters, prescriptions, dispensing, and diagnostics"
          orientation="vertical"
          data={platformUsageData}
          loading={loading}
          selectedKey={selectedMetricKey}
          onSelectBar={(bar) =>
            setSelectedMetricKey((prev) => (prev === bar.key ? null : bar.key))
          }
        />
      )}

      {/* Consent Activity & Notification Delivery */}
      {showConsent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsBarChart
            title="Consent Activity Overview"
            description="Live patient consent requests, active artefacts, expirations, and revocations"
            orientation="horizontal"
            data={consentChartData}
            loading={loading}
            badge={
              <Badge variant="teal" size="sm">
                <ShieldCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                Consent-Enforced
              </Badge>
            }
          />

          <AnalyticsComparisonCard
            title="Unified Notification Delivery"
            description="Delivery outcomes across operational and clinical notifications"
            items={[
              {
                label: 'Delivered',
                value: data?.notifications.delivered ?? 0,
                tone: 'success',
              },
              {
                label: 'Pending / Queued',
                value: data?.notifications.pending ?? 0,
                tone: 'warning',
              },
              {
                label: 'Failed Deliveries',
                value: data?.notifications.failed ?? 0,
                tone: 'error',
              },
            ]}
          />
        </div>
      )}

      {/* Honest Data Availability Disclosure */}
      <Alert variant="info" title="Point-in-Time Aggregates & Time-Series Disclosure">
        <div className="flex items-start gap-2 text-xs">
          <Info className="h-4 w-4 shrink-0 mt-0.5 hidden sm:block" aria-hidden="true" />
          <span>
            <code className="font-mono">GET /api/v1/platform/admin/overview</code> currently returns live point-in-time MongoDB aggregate totals (zero patient PII). Historical date-bucketed User Registration Trends and Appointment Time-Series endpoints are not yet exposed by the backend, so no synthetic trend curves are fabricated here.
          </span>
        </div>
      </Alert>
    </div>
  );
}
