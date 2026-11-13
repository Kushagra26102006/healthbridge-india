'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Clock,
  History,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AppointmentCard,
  AppointmentSkeleton,
  AppointmentEmptyState,
  CancelAppointmentDialog,
  RescheduleAppointmentDialog,
} from '@/components/patient/appointments';
import { useAppointments } from '@/features/appointments/hooks/use-appointments';
import type { AppointmentDetailDto } from '@healthbridge/shared-types';

type TabStatus = 'UPCOMING' | 'CONFIRMED' | 'REQUESTED' | 'ALL';

export default function PatientAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('UPCOMING');
  const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] =
    useState<AppointmentDetailDto | null>(null);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] =
    useState<AppointmentDetailDto | null>(null);

  const { appointments, isLoading, refetch } = useAppointments({
    status: activeTab === 'ALL' ? undefined : activeTab,
    sortBy: 'scheduledAt',
    sortOrder: 'asc',
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Clinical Appointments</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage upcoming consultations, physical hospital visits, and teleconsultations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Link href="/patient/doctors">
              <Stethoscope className="h-3.5 w-3.5 mr-1" />
              Find Specialists
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Link href="/patient/appointments/history">
              <History className="h-3.5 w-3.5 mr-1" />
              Past History
            </Link>
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl font-medium shadow-sm"
          >
            <Link href="/patient/appointments/book">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Book Appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'UPCOMING'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Upcoming Consultations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONFIRMED')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'CONFIRMED'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Confirmed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REQUESTED')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'REQUESTED'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Requested</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'ALL'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>All Active</span>
        </button>
      </div>

      {/* Appointment Listings */}
      {isLoading ? (
        <AppointmentSkeleton count={3} />
      ) : appointments.length === 0 ? (
        <AppointmentEmptyState
          title={
            activeTab === 'UPCOMING'
              ? 'No upcoming consultations'
              : `No ${activeTab.toLowerCase()} appointments found`
          }
          description="Schedule a consultation with a verified medical specialist in your preferred hospital or clinic."
          showBookAction={true}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancelClick={setSelectedAppointmentForCancel}
              onRescheduleClick={setSelectedAppointmentForReschedule}
            />
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      <CancelAppointmentDialog
        isOpen={Boolean(selectedAppointmentForCancel)}
        appointment={selectedAppointmentForCancel}
        onClose={() => setSelectedAppointmentForCancel(null)}
        onSuccess={() => refetch()}
      />

      {/* Reschedule Dialog */}
      <RescheduleAppointmentDialog
        isOpen={Boolean(selectedAppointmentForReschedule)}
        appointment={selectedAppointmentForReschedule}
        onClose={() => setSelectedAppointmentForReschedule(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
