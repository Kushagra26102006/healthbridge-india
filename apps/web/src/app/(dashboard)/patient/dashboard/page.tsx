'use client';

import React from 'react';
import { FileText, Calendar, Pill, FlaskConical, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePatientDashboard } from '@/features/patient/hooks/use-patient-dashboard';
import { WelcomeSection } from '@/components/patient/WelcomeSection';
import { ABHAIdentityCard } from '@/components/patient/ABHAIdentityCard';
import { HealthStatCard } from '@/components/patient/HealthStatCard';
import { UpcomingAppointments } from '@/components/patient/UpcomingAppointments';
import { RecentPrescriptions } from '@/components/patient/RecentPrescriptions';
import { RecentActivity } from '@/components/patient/RecentActivity';
import { PatientDashboardSkeleton } from '@/components/patient/PatientDashboardSkeleton';
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
        </div>
      </div>
    </div>
  );
}
