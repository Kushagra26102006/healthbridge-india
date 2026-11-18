'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Pill,
  FlaskConical,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Bell,
  Stethoscope,
  PackageCheck,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const { summary, isLoading, isError, error, refetch, isFetching } = usePatientDashboard();

  if (isLoading) {
    return <PatientDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
      {/* 1. Welcome Banner */}
      <WelcomeSection patientName={user?.name} />

      {/* Error Banner if API Call Encountered an Issue */}
      {isError && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Unable to sync live records ({error?.message || 'Network error'}). Showing cached or
              local view.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 text-xs border-destructive/30 hover:bg-destructive/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      )}

      {/* 2. ABHA Health Identity Card */}
      <ABHAIdentityCard profile={summary?.profile} patientName={user?.name} />

      {/* 3. Summary Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <HealthStatCard
          title="Health Records"
          value={summary?.stats.totalRecords ?? 0}
          subtitle="Available in repository"
          icon={FileText}
          href="/patient/records"
          colorScheme="blue"
          isLoading={isLoading}
        />

        <HealthStatCard
          title="Upcoming Appointments"
          value={summary?.stats.upcomingAppointments ?? 0}
          subtitle="Scheduled consultations"
          icon={Calendar}
          href="/patient/appointments"
          colorScheme="teal"
          isLoading={isLoading}
        />

        <HealthStatCard
          title="Active Prescriptions"
          value={summary?.stats.activePrescriptions ?? 0}
          subtitle="Valid medications"
          icon={Pill}
          href="/patient/prescriptions"
          colorScheme="amber"
          isLoading={isLoading}
        />

        <HealthStatCard
          title="Lab Reports"
          value={summary?.stats.availableLabReports ?? 0}
          subtitle="Diagnostic results"
          icon={FlaskConical}
          href="/patient/lab-reports"
          colorScheme="cyan"
          isLoading={isLoading}
        />
      </div>

      {/* 4. Main Two-Column Healthcare Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upcoming Consultations & Active Prescriptions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <UpcomingAppointments
            appointments={summary?.upcomingAppointments}
            isLoading={isLoading}
          />

          <RecentPrescriptions prescriptions={summary?.recentPrescriptions} isLoading={isLoading} />
        </div>

        {/* Right Column: Recent Medical Activity Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <RecentActivity activities={summary?.recentActivity} isLoading={isLoading} />

          {/* Unified Platform Quick Integration Card (Consent, ABHA, Timeline, Notifications) */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Unified Health Record Status
              </h2>
              <Link href="/patient/health-timeline">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1" /> Full Timeline
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href="/patient/consent"
                className="rounded-lg border p-3 hover:bg-muted/40 transition"
              >
                <p className="text-muted-foreground">Active Consents</p>
                <p className="text-lg font-bold mt-0.5">
                  {(summary?.consentSummary?.activeInternalConsents ?? 0) +
                    (summary?.consentSummary?.activeAbdmArtefacts ?? 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Pending:{' '}
                  {(summary?.consentSummary?.pendingInternalRequests ?? 0) +
                    (summary?.consentSummary?.pendingAbdmRequests ?? 0)}
                </p>
              </Link>

              <Link
                href="/patient/notifications"
                className="rounded-lg border p-3 hover:bg-muted/40 transition"
              >
                <p className="text-muted-foreground flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5" /> Unread Alerts
                </p>
                <p className="text-lg font-bold mt-0.5">
                  {summary?.unreadNotificationsCount ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Privacy-safe previews</p>
              </Link>
            </div>

            {summary?.abhaStatus && (
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs flex items-center justify-between">
                <span>
                  ABHA:{' '}
                  <strong className="font-mono">
                    {summary.abhaStatus.abhaAddress || summary.abhaStatus.verificationStatus}
                  </strong>
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {summary.abhaStatus.linked ? 'LINKED' : summary.abhaStatus.verificationStatus}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Cross-Module Clinical Updates: Encounters, Published Lab Reports & Pharmacy Dispensing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              Recent Encounters
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
                <div key={enc.id} className="rounded-lg bg-muted/40 p-2.5 text-xs">
                  <div className="font-medium">{enc.doctorName}</div>
                  <div className="text-muted-foreground">
                    {enc.encounterType} &bull; {new Date(enc.startTime).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-teal-600" />
              Published Lab Reports
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
                <div key={rep.id} className="rounded-lg bg-muted/40 p-2.5 text-xs flex justify-between items-center gap-2">
                  <div>
                    <div className="font-medium">{rep.testName}</div>
                    <div className="text-muted-foreground font-mono text-[11px]">{rep.reportNumber}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {rep.isAmended ? 'AMENDED' : 'PUBLISHED'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-amber-600" />
              Medication Dispensing
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
                <div key={disp.id} className="rounded-lg bg-muted/40 p-2.5 text-xs flex justify-between items-center gap-2">
                  <div>
                    <div className="font-medium">{disp.pharmacyName}</div>
                    <div className="text-muted-foreground font-mono text-[11px]">{disp.dispensingNumber}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {disp.dispensingStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
