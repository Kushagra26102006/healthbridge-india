'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  Stethoscope,
  CheckCircle2,
  FlaskConical,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { StaggerList, StaggerItem } from '@/components/motion';
import { useDoctorDashboard } from '@/features/doctor/hooks/use-doctor';
import { laboratoryReportsApi } from '@/features/laboratory/api/laboratory-reports-api';
import {
  DoctorWelcome,
  DoctorProfileCard,
  ClinicalStatCard,
  TodaysAppointments,
  UpcomingAppointments,
  AssignedPatients,
  ClinicalActivity,
  DoctorDashboardSkeleton,
} from '@/components/doctor';
import { UpcomingVideoConsultations } from '@/components/doctor/UpcomingVideoConsultations';

export default function DoctorDashboardPage() {
  const { summary, isLoading, isError, error, refetch } = useDoctorDashboard();

  // Fetch real authorized diagnostic reports for pending lab review count (never hardcoded)
  const { data: doctorReportsData, isLoading: isReportsLoading } = useQuery({
    queryKey: ['doctor', 'dashboard-lab-reports-summary'],
    queryFn: () => laboratoryReportsApi.getDoctorReports({ limit: 50 }).catch(() => ({ items: [], total: 0 })),
    enabled: Boolean(summary),
    staleTime: 60 * 1000,
  });

  const labMetrics = useMemo(() => {
    const items = doctorReportsData?.items ?? [];
    const pendingReview = items.filter((r) =>
      ['PENDING', 'PENDING_REVIEW', 'UNDER_REVIEW', 'PRELIMINARY', 'DRAFT', 'GENERATED'].includes(
        String(r.status).toUpperCase()
      )
    ).length;
    const abnormalCount = items.filter((r) => r.hasAbnormalResults).length;
    return {
      total: doctorReportsData?.total ?? items.length,
      pendingReview,
      abnormalCount,
    };
  }, [doctorReportsData]);

  if (isLoading) {
    return <DoctorDashboardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Alert
          variant="error"
          title="Failed to Load Doctor Clinical Workspace"
          description={
            error?.message ||
            'Unable to retrieve clinical metrics. Please verify connectivity and retry.'
          }
          action={
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Retry</span>
            </Button>
          }
        />
      </div>
    );
  }

  const { profile, stats, todayAppointments, upcomingAppointments, recentActivities } = summary;

  const completedConsultationsToday = todayAppointments.filter(
    (apt) => apt.status === 'COMPLETED'
  ).length;

  // Derive authorized patients preview from active scheduled appointments
  const patientMap = new Map<
    string,
    {
      id: string;
      patientId: string;
      name: string;
      phone?: string;
      gender?: string;
      totalAppointments: number;
      accessStatus: 'ACTIVE_CONSENT' | 'ENCOUNTER_BOUND';
    }
  >();

  todayAppointments.concat(upcomingAppointments).forEach((apt) => {
    if (!patientMap.has(apt.patientId)) {
      patientMap.set(apt.patientId, {
        id: apt.patientId,
        patientId: apt.patientId,
        name: apt.patientName,
        phone: apt.patientPhone,
        gender: apt.patientGender,
        totalAppointments: 1,
        accessStatus: 'ENCOUNTER_BOUND',
      });
    } else {
      const existing = patientMap.get(apt.patientId);
      if (existing) existing.totalAppointments += 1;
    }
  });

  const assignedPatientsPreview = Array.from(patientMap.values());

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Clinical Welcome Section */}
      <DoctorWelcome
        profile={profile}
        todayCount={stats.todayAppointments}
        upcomingCount={stats.upcomingAppointments}
      />

      {/* 2. Clinical Overview KPI Cards (100% Real API Data) */}
      <StaggerList
        inView={false}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4"
      >
        <StaggerItem>
          <ClinicalStatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            subtitle={`${stats.upcomingAppointments} upcoming`}
            icon={Calendar}
            href="/doctor/appointments/today"
            colorScheme="blue"
          />
        </StaggerItem>

        <StaggerItem>
          <ClinicalStatCard
            title="Assigned Patients"
            value={stats.totalAssignedPatients}
            subtitle="Authorized roster"
            icon={Users}
            href="/doctor/patients"
            colorScheme="indigo"
          />
        </StaggerItem>

        <StaggerItem>
          <ClinicalStatCard
            title="Completed Today"
            value={completedConsultationsToday}
            subtitle="Consultations closed"
            icon={CheckCircle2}
            href="/doctor/appointments/history"
            colorScheme="teal"
          />
        </StaggerItem>

        <StaggerItem>
          <ClinicalStatCard
            title="Pending Consultations"
            value={stats.pendingEncounters}
            subtitle={`${stats.pendingPrescriptions} pending Rx`}
            icon={Stethoscope}
            href="/doctor/encounters"
            colorScheme="amber"
          />
        </StaggerItem>

        <StaggerItem>
          <ClinicalStatCard
            title="Pending Lab Reports"
            value={labMetrics.pendingReview}
            subtitle={
              labMetrics.abnormalCount > 0
                ? `${labMetrics.total} total • ${labMetrics.abnormalCount} flagged`
                : `${labMetrics.total} available reports`
            }
            icon={FlaskConical}
            href="/doctor/reports"
            colorScheme="purple"
            isLoading={isReportsLoading}
          />
        </StaggerItem>
      </StaggerList>

      {/* 3. Doctor Professional Profile Summary */}
      <DoctorProfileCard profile={profile} />

      {/* 4. Two-Column Clinical Schedule & Activity Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpcomingVideoConsultations />
          <TodaysAppointments appointments={todayAppointments} />
          <ClinicalActivity activities={recentActivities} />
        </div>

        <div className="space-y-6">
          <UpcomingAppointments appointments={upcomingAppointments} />
          <AssignedPatients patients={assignedPatientsPreview} />
        </div>
      </div>
    </div>
  );
}
