'use client';

import React from 'react';
import {
  Calendar,
  Users,
  Stethoscope,
  Pill,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoctorDashboard } from '@/features/doctor/hooks/use-doctor';
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

export default function DoctorDashboardPage() {
  const { summary, isLoading, isError, error, refetch } = useDoctorDashboard();

  if (isLoading) {
    return <DoctorDashboardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">
            Failed to Load Doctor Workspace
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {error?.message || 'Unable to retrieve clinical metrics. Please verify network connectivity.'}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const { profile, stats, todayAppointments, upcomingAppointments, recentActivities } = summary;

  // Derive assigned patients from appointments for the roster preview
  const patientMap = new Map<string, {
    id: string;
    patientId: string;
    name: string;
    phone?: string;
    gender?: string;
    totalAppointments: number;
    accessStatus: 'ACTIVE_CONSENT' | 'ENCOUNTER_BOUND';
  }>();

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
      const existing = patientMap.get(apt.patientId)!;
      existing.totalAppointments += 1;
    }
  });

  const assignedPatientsPreview = Array.from(patientMap.values());

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Clinical Welcome Section */}
      <DoctorWelcome
        profile={profile}
        todayCount={stats.todayAppointments}
        upcomingCount={stats.upcomingAppointments}
      />

      {/* 2. Doctor Professional Profile Card */}
      <DoctorProfileCard profile={profile} />

      {/* 3. Clinical Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <ClinicalStatCard
          title="Today's Consults"
          value={stats.todayAppointments}
          subtitle="Scheduled today"
          icon={Calendar}
          href="/doctor/appointments"
          colorScheme="blue"
        />
        <ClinicalStatCard
          title="Upcoming"
          value={stats.upcomingAppointments}
          subtitle="Next 7 days"
          icon={Clock}
          href="/doctor/appointments"
          colorScheme="teal"
        />
        <ClinicalStatCard
          title="Assigned Patients"
          value={stats.totalAssignedPatients}
          subtitle="Authorized roster"
          icon={Users}
          href="/doctor/patients"
          colorScheme="indigo"
        />
        <ClinicalStatCard
          title="Encounters"
          value={stats.pendingEncounters}
          subtitle="Pending completion"
          icon={Stethoscope}
          href="/doctor/encounters"
          colorScheme="amber"
        />
        <ClinicalStatCard
          title="Prescriptions"
          value={stats.pendingPrescriptions}
          subtitle="Pending issuance"
          icon={Pill}
          href="/doctor/prescriptions"
          colorScheme="purple"
        />
      </div>

      {/* 4. Two-Column Clinical Schedule & Activity Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Consultations + Recent Clinical Feed */}
        <div className="lg:col-span-2 space-y-6">
          <TodaysAppointments appointments={todayAppointments} />
          <ClinicalActivity activities={recentActivities} />
        </div>

        {/* Right Column: Upcoming Consultations + Compact Patient Roster */}
        <div className="space-y-6">
          <UpcomingAppointments appointments={upcomingAppointments} />
          <AssignedPatients patients={assignedPatientsPreview} />
        </div>
      </div>
    </div>
  );
}
