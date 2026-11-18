'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import {
  Users,
  Stethoscope,
  Building2,
  ShieldAlert,
  FileCheck2,
  RefreshCw,
  Activity,
  Server,
  ScrollText,
  Globe,
  DatabaseBackup,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { AdminPlatformOverviewDto, EventHealthMetricsDto } from '@healthbridge/shared-types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { platformApi } from '@/features/platform/api/platform-api';
import { privacyApi } from '@/features/privacy/api/privacy-api';
import { eventsApi } from '@/features/events/api/events-api';
import {
  securityMonitoringApi,
  type SecurityOverviewDto,
} from '@/features/security-monitoring/api/security-monitoring-api';
import { useSystemHealth } from '@/features/system/hooks/use-system-health';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DiagramVisual } from '@/components/ui/visual-asset';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { health, isLoading: healthLoading } = useSystemHealth();

  const [overview, setOverview] = useState<AdminPlatformOverviewDto | null>(null);
  const [eventHealth, setEventHealth] = useState<EventHealthMetricsDto | null>(null);
  const [pendingPrivacyCount, setPendingPrivacyCount] = useState<number>(0);
  const [secOverview, setSecOverview] = useState<SecurityOverviewDto | null>(null);
  const [secRestricted, setSecRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSecRestricted(false);

    try {
      const [overviewRes, eventHealthRes, privacyRes, secRes] = await Promise.allSettled([
        platformApi.getAdminPlatformOverview(),
        eventsApi.getHealth(),
        privacyApi.listAdminRequests({ status: 'SUBMITTED', page: 1, limit: 1 }),
        securityMonitoringApi.getOverview(),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value);
      } else {
        setError('Unable to load aggregate platform metrics. Verify administrator session.');
      }

      if (eventHealthRes.status === 'fulfilled') {
        setEventHealth(eventHealthRes.value);
      }

      if (privacyRes.status === 'fulfilled') {
        setPendingPrivacyCount(privacyRes.value.pagination?.total ?? privacyRes.value.items.length);
      }

      if (secRes.status === 'fulfilled') {
        setSecOverview(secRes.value);
      } else {
        setSecOverview(null);
        setSecRestricted(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const registeredPatients = overview?.users.registeredPatients ?? 0;
  const activeDoctors = overview?.users.activeDoctors ?? 0;
  const activePharmacies = overview?.users.activePharmacies ?? 0;
  const activeLaboratories = overview?.users.activeLaboratories ?? 0;
  const totalPlatformUsers =
    registeredPatients + activeDoctors + activePharmacies + activeLaboratories;
  const connectedFacilities = activePharmacies + activeLaboratories;
  const deadLetterCount = eventHealth?.counts.deadLetter ?? 0;
  const platformAlertsTotal = (secOverview?.openAlertCount ?? 0) + deadLetterCount;

  const roleDistribution = [
    { label: 'Patients', count: registeredPatients, color: 'bg-primary' },
    { label: 'Active Doctors', count: activeDoctors, color: 'bg-secondary' },
    { label: 'Active Pharmacies', count: activePharmacies, color: 'bg-amber-500' },
    { label: 'Active Laboratories', count: activeLaboratories, color: 'bg-sky-500' },
  ];
  const maxRoleCount = Math.max(1, ...roleDistribution.map((r) => r.count));

  const clinicalActivity = [
    {
      label: 'Appointments',
      total: overview?.clinicalOperations.totalAppointments ?? 0,
      sub: `${overview?.clinicalOperations.upcomingAppointments ?? 0} upcoming`,
    },
    {
      label: 'Clinical Encounters',
      total: overview?.clinicalOperations.totalEncounters ?? 0,
      sub: `${overview?.clinicalOperations.finalizedEncounters ?? 0} finalized`,
    },
    {
      label: 'Prescriptions',
      total: overview?.clinicalOperations.totalPrescriptions ?? 0,
      sub: `${overview?.clinicalOperations.activePrescriptions ?? 0} active`,
    },
    {
      label: 'Lab Orders',
      total: overview?.clinicalOperations.totalLabOrders ?? 0,
      sub: `${overview?.clinicalOperations.publishedLabReports ?? 0} published reports`,
    },
  ];
  const maxClinicalCount = Math.max(1, ...clinicalActivity.map((c) => c.total));

  const apiHealthy = health?.status === 'healthy';
  const dbConnected = health?.services?.database?.status === 'connected';

  return (
    <div className="space-y-6">
      {/* Executive Governance Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm" className="uppercase tracking-wider">
                Super Admin Control Center
              </Badge>
              <Badge variant={apiHealthy && dbConnected ? 'success' : 'warning'} size="sm" dot>
                {healthLoading
                  ? 'Checking API Health'
                  : apiHealthy && dbConnected
                    ? 'API & MongoDB Operational'
                    : `API Status: ${health?.status ?? 'Unknown'}`}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {user?.name || 'Platform Administrator'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Live aggregate governance telemetry across HealthBridge India. Administrative views enforce least-privilege RBAC and never expose private patient clinical records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void loadDashboard()} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Refresh</span>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/admin/security/overview">
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Security Center</span>
                </Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/admin/system-monitoring">
                  <Server className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>System Monitoring</span>
                </Link>
              </Button>
            </div>
            <div className="hidden xl:block w-52 shrink-0">
              <DiagramVisual
                asset="connectedHealthcareNetwork"
                className="bg-slate-950/90 border-slate-800 p-1"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Metrics Retrieval Error">
          {error}
        </Alert>
      )}

      {/* Platform Overview KPI Cards (100% Live Server Counts) */}
      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StaggerItem>
          <AdminStatCard
            label="Total Platform Accounts"
            value={totalPlatformUsers}
            helperText="Patients + active doctors, pharmacies & labs"
            icon={Users}
            tone="primary"
            href="/admin/platform-overview"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Registered Patients"
            value={registeredPatients}
            helperText={`${overview?.abdm.verifiedAbhaLinks ?? 0} verified ABHA links`}
            icon={Users}
            tone="info"
            href="/admin/platform-overview"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Active Doctors"
            value={activeDoctors}
            helperText="Verified clinical accounts currently active"
            icon={Stethoscope}
            tone="secondary"
            href="/admin/roles"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Connected Healthcare Facilities"
            value={connectedFacilities}
            helperText={`${activePharmacies} pharmacies · ${activeLaboratories} laboratories`}
            icon={Building2}
            tone="success"
            href="/admin/platform-overview"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Pending Privacy Reviews"
            value={pendingPrivacyCount}
            helperText="Submitted export, correction & closure requests"
            icon={FileCheck2}
            tone={pendingPrivacyCount > 0 ? 'warning' : 'success'}
            href="/admin/privacy-requests"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Platform & Security Alerts"
            value={platformAlertsTotal}
            helperText={
              secRestricted
                ? `${deadLetterCount} dead-letter events (SecOps restricted)`
                : `${secOverview?.openAlertCount ?? 0} SecOps alerts · ${deadLetterCount} dead-letter`
            }
            icon={ShieldAlert}
            tone={platformAlertsTotal > 0 ? 'error' : 'success'}
            href={secRestricted ? '/admin/platform/events' : '/admin/security/alerts'}
            loading={loading}
          />
        </StaggerItem>
      </StaggerList>

      {/* Real-Data Distribution & Clinical Operations Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Role &amp; Facility Distribution</CardTitle>
                <CardDescription>
                  Live MongoDB participant breakdown across platform roles
                </CardDescription>
              </div>
              <Link
                href="/admin/roles"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>RBAC Matrix</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleDistribution.map((row) => {
              const ratio = Math.max(0.03, row.count / maxRoleCount);
              const pct =
                totalPlatformUsers > 0 ? Math.round((row.count / totalPlatformUsers) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="font-mono text-muted-foreground tabular-nums">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-pill bg-muted overflow-hidden">
                    <m.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: ratio }}
                      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
                      style={{ transformOrigin: 'left center' }}
                      className={`h-full w-full rounded-pill ${row.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Cross-Module Clinical Activity</CardTitle>
                <CardDescription>
                  Aggregate operational volume (zero patient-identifiable data)
                </CardDescription>
              </div>
              <Link
                href="/admin/platform-overview"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Full Analytics</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {clinicalActivity.map((item) => {
              const ratio = Math.max(0.03, item.total / maxClinicalCount);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      <strong className="text-foreground">{item.total}</strong> · {item.sub}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-pill bg-muted overflow-hidden">
                    <m.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: ratio }}
                      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
                      style={{ transformOrigin: 'left center' }}
                      className="h-full w-full rounded-pill bg-gradient-to-r from-brand-blue to-brand-teal"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Live Infrastructure & Governance Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: 'Consent Oversight',
            description: `${overview?.abdm.activeAbdmArtefacts ?? 0} active ABDM artefacts · Consent analytics & sync`,
            href: '/admin/consent-oversight',
            icon: FileCheck2,
          },
          {
            title: 'Audit & Security Logs',
            description: secRestricted
              ? 'Requires explicit SECURITY_EVENTS_READ grant'
              : `${secOverview?.totalSecurityEvents ?? 0} recorded security events`,
            href: '/admin/audit-logs',
            icon: ScrollText,
          },
          {
            title: 'Data Protection & DR',
            description: 'KMS key versions, private storage AV & backup readiness',
            href: '/admin/security/data-protection',
            icon: DatabaseBackup,
          },
          {
            title: 'ABDM Governance',
            description: `Status: ${overview?.abdm.overallStatus ?? 'Checking...'} · Sandbox readiness`,
            href: '/admin/integrations/abdm',
            icon: Globe,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover-lift transition-all focus-ring flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Operational Health & Scope Transparency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {apiHealthy && dbConnected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                Backend API &amp; Transactional Outbox Status
              </p>
              <p className="text-muted-foreground mt-0.5">
                DB Latency: {health?.services?.database?.latencyMs ?? '—'} ms · Outbox Processed:{' '}
                {eventHealth?.counts.processed ?? 0} · Retrying: {eventHealth?.counts.retrying ?? 0}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/platform/events">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Outbox Monitor</span>
            </Link>
          </Button>
        </div>

        <Alert variant="info" title="Backend Capability Scope Transparency">
          <div className="flex items-start gap-2 text-xs">
            <Info className="h-4 w-4 shrink-0 mt-0.5 hidden sm:block" aria-hidden="true" />
            <span>
              Paginated User Directory CRUD (<code className="font-mono">/api/v1/users</code>), Hospital/Clinic onboarding approval endpoints, and runtime Role Mutation APIs are not yet implemented in the backend. This Control Center surfaces live aggregate counts and enforces read-only RBAC visibility without fabricated directory data.
            </span>
          </div>
        </Alert>
      </div>
    </div>
  );
}
