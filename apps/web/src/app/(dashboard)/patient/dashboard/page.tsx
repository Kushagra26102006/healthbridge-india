'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Pill,
  FlaskConical,
  RefreshCw,
  Clock,
  ShieldCheck,
  Bell,
  Stethoscope,
  PackageCheck,
  Building2,
  Store,
  History,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePatientDashboard } from '@/features/patient/hooks/use-patient-dashboard';
import { WelcomeSection } from '@/components/patient/WelcomeSection';
import { ABHAIdentityCard } from '@/components/patient/ABHAIdentityCard';
import { HealthStatCard } from '@/components/patient/HealthStatCard';
import { UpcomingAppointments } from '@/components/patient/UpcomingAppointments';
import { RecentPrescriptions } from '@/components/patient/RecentPrescriptions';
import { RecentActivity } from '@/components/patient/RecentActivity';
import { PatientDashboardSkeleton } from '@/components/patient/PatientDashboardSkeleton';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StaggerList, StaggerItem } from '@/components/motion';
import { HealthcareStatusBadge } from '@/components/healthcare';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const { summary, isLoading, isError, error, refetch, isFetching } = usePatientDashboard();

  const pendingConsentsCount =
    (summary?.consentSummary?.pendingInternalRequests ?? 0) +
    (summary?.consentSummary?.pendingAbdmRequests ?? 0);

  const activeConsentsCount =
    (summary?.consentSummary?.activeInternalConsents ?? 0) +
    (summary?.consentSummary?.activeAbdmArtefacts ?? 0);

  const abhaLinked =
    Boolean(summary?.abhaStatus?.linked) || summary?.profile?.abhaLinkageStatus === 'LINKED';

  const abhaStatusLabel = abhaLinked
    ? 'ABHA Linked'
    : summary?.abhaStatus?.verificationStatus
      ? `ABHA: ${summary.abhaStatus.verificationStatus.replace(/_/g, ' ')}`
      : 'ABHA Not Linked';

  // Derive real connected providers strictly from actual backend summary records (never fabricated)
  const connectedProviders = useMemo(() => {
    const hospitals = new Set<string>();
    const doctors = new Set<string>();
    const labs = new Set<string>();
    const pharmacies = new Set<string>();

    (summary?.upcomingAppointments || []).forEach((apt) => {
      if (apt.doctorName) doctors.add(apt.doctorName);
      if (apt.facilityName) hospitals.add(apt.facilityName);
    });
    (summary?.recentEncounters || []).forEach((enc) => {
      if (enc.doctorName) doctors.add(enc.doctorName);
    });
    (summary?.recentLabReports || []).forEach((rep) => {
      if (rep.reportNumber) labs.add(rep.testName);
    });
    (summary?.recentDispensing || []).forEach((disp) => {
      if (disp.pharmacyName) pharmacies.add(disp.pharmacyName);
    });

    return {
      hospitals: Array.from(hospitals),
      doctors: Array.from(doctors),
      labsCount: summary?.stats.availableLabReports ?? labs.size,
      pharmacies: Array.from(pharmacies),
    };
  }, [summary]);

  if (isLoading) {
    return <PatientDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Welcome Banner */}
      <WelcomeSection
        patientName={user?.name}
        abhaLinked={abhaLinked}
        abhaStatusLabel={abhaStatusLabel}
      />

      {/* Error Banner */}
      {isError && (
        <Alert
          variant="error"
          title="Unable to sync live records"
          description={
            error?.message || 'A network issue occurred while loading your patient summary.'
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Retry Sync</span>
            </Button>
          }
        />
      )}

      {/* 2. Summary Statistic Metric Cards (Real API Counts) */}
      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <HealthStatCard
            title="Total Health Records"
            value={summary?.stats.totalRecords ?? 0}
            subtitle="Stored in personal locker"
            icon={FileText}
            href="/patient/records"
            colorScheme="blue"
            isLoading={isLoading}
          />
        </StaggerItem>

        <StaggerItem>
          <HealthStatCard
            title="Upcoming Appointments"
            value={summary?.stats.upcomingAppointments ?? 0}
            subtitle="Scheduled consultations"
            icon={Calendar}
            href="/patient/appointments"
            colorScheme="teal"
            isLoading={isLoading}
          />
        </StaggerItem>

        <StaggerItem>
          <HealthStatCard
            title="Active Prescriptions"
            value={summary?.stats.activePrescriptions ?? 0}
            subtitle="Current medication orders"
            icon={Pill}
            href="/patient/prescriptions"
            colorScheme="amber"
            isLoading={isLoading}
          />
        </StaggerItem>

        <StaggerItem>
          <HealthStatCard
            title="Pending Consent Requests"
            value={pendingConsentsCount}
            subtitle={`${activeConsentsCount} active authorizations`}
            icon={ShieldCheck}
            href="/patient/consent"
            colorScheme="emerald"
            isLoading={isLoading}
          />
        </StaggerItem>
      </StaggerList>

      {/* 3. ABHA Digital Health Card */}
      <ABHAIdentityCard profile={summary?.profile} patientName={user?.name} />

      {/* 4. Main Two-Column Healthcare Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <UpcomingAppointments
            appointments={summary?.upcomingAppointments}
            isLoading={isLoading}
          />

          <RecentPrescriptions
            prescriptions={summary?.recentPrescriptions}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <RecentActivity activities={summary?.recentActivity} isLoading={isLoading} />

          {/* Unified Health Record & Consent Governance Summary */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-card-heading flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
                <span>Unified Health Record Status</span>
              </h2>
              <Button size="sm" variant="outline" asChild className="h-7 text-xs px-2.5">
                <Link href="/patient/health-timeline">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Full Timeline</span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href="/patient/consent"
                className="rounded-md border border-border bg-surface p-3 hover-lift focus-ring"
              >
                <p className="text-muted-foreground">Active Consents</p>
                <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                  {activeConsentsCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pending: {pendingConsentsCount}
                </p>
              </Link>

              <Link
                href="/patient/notifications"
                className="rounded-md border border-border bg-surface p-3 hover-lift focus-ring"
              >
                <p className="text-muted-foreground flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Unread Alerts</span>
                </p>
                <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                  {summary?.unreadNotificationsCount ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Privacy-safe previews</p>
              </Link>
            </div>

            {summary?.abhaStatus && (
              <div className="rounded-md bg-muted/50 border border-border/70 px-3 py-2.5 text-xs flex items-center justify-between gap-2">
                <span className="truncate">
                  ABHA:{' '}
                  <strong className="font-mono text-foreground">
                    {summary.abhaStatus.abhaAddress || summary.abhaStatus.verificationStatus}
                  </strong>
                </span>
                <HealthcareStatusBadge
                  status={summary.abhaStatus.linked ? 'VERIFIED' : summary.abhaStatus.verificationStatus}
                  size="sm"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-border/70 text-xs">
              <Link
                href="/patient/data-sharing"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                <span>View Access History</span>
              </Link>
              <Link
                href="/patient/lab-reports"
                className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
              >
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{summary?.stats.availableLabReports ?? 0} Lab Reports</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Connected Healthcare Providers (Derived Strictly from Real Patient Data) */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-card-heading">Connected Healthcare Providers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registered hospitals, clinicians, diagnostic labs, and pharmacies associated with your
              records
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/patient/abdm/linked-records">Manage Linked Facilities</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-md border border-border bg-muted/30 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Hospitals &amp; Clinics</span>
              </span>
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {connectedProviders.hospitals.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {connectedProviders.hospitals.length > 0
                ? connectedProviders.hospitals.join(', ')
                : 'No linked facilities yet'}
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-secondary" aria-hidden="true" />
                <span>Doctors</span>
              </span>
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {connectedProviders.doctors.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {connectedProviders.doctors.length > 0
                ? connectedProviders.doctors.join(', ')
                : 'No recent treating doctors'}
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                <span>Diagnostic Labs</span>
              </span>
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {connectedProviders.labsCount}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {connectedProviders.labsCount > 0
                ? `${connectedProviders.labsCount} available diagnostic reports`
                : 'No diagnostic reports linked'}
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                <Store className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span>Pharmacies</span>
              </span>
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {connectedProviders.pharmacies.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {connectedProviders.pharmacies.length > 0
                ? connectedProviders.pharmacies.join(', ')
                : 'No dispensing pharmacies yet'}
            </p>
          </div>
        </div>
      </Card>

      {/* 6. Cross-Module Clinical Updates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Recent Encounters</span>
            </h3>
            <Link href="/patient/health-timeline" className="text-xs text-primary hover:underline">
              Timeline
            </Link>
          </div>
          {(summary?.recentEncounters || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No finalized clinical encounters yet.</p>
          ) : (
            <div className="space-y-2">
              {summary?.recentEncounters?.slice(0, 3).map((enc) => (
                <div key={enc.id} className="rounded-md bg-muted/40 border border-border/60 p-2.5 text-xs">
                  <div className="font-medium text-foreground">{enc.doctorName}</div>
                  <div className="text-muted-foreground tabular-nums">
                    {enc.encounterType} • {new Date(enc.startTime).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-secondary" aria-hidden="true" />
              <span>Published Lab Reports</span>
            </h3>
            <Link href="/patient/lab-reports" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>
          {(summary?.recentLabReports || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No published diagnostic reports yet.</p>
          ) : (
            <div className="space-y-2">
              {summary?.recentLabReports?.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-md bg-muted/40 border border-border/60 p-2.5 text-xs flex justify-between items-center gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{rep.testName}</div>
                    <div className="text-muted-foreground font-mono text-[11px] truncate">
                      {rep.reportNumber}
                    </div>
                  </div>
                  <HealthcareStatusBadge
                    status={rep.isAmended ? 'AMENDED' : 'PUBLISHED'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Medication Dispensing</span>
            </h3>
            <Link href="/patient/orders" className="text-xs text-primary hover:underline">
              Orders
            </Link>
          </div>
          {(summary?.recentDispensing || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No pharmacy dispensing records yet.</p>
          ) : (
            <div className="space-y-2">
              {summary?.recentDispensing?.slice(0, 3).map((disp) => (
                <div
                  key={disp.id}
                  className="rounded-md bg-muted/40 border border-border/60 p-2.5 text-xs flex justify-between items-center gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{disp.pharmacyName}</div>
                    <div className="text-muted-foreground font-mono text-[11px] truncate">
                      {disp.dispensingNumber}
                    </div>
                  </div>
                  <HealthcareStatusBadge status={disp.dispensingStatus} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
