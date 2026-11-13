'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  History,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AppointmentCard,
  AppointmentSkeleton,
  AppointmentEmptyState,
} from '@/components/patient/appointments';
import { useAppointments } from '@/features/appointments/hooks/use-appointments';

export default function PatientAppointmentsHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const { appointments, isLoading } = useAppointments({
    status: statusFilter === 'ALL' ? 'HISTORY' : statusFilter,
    sortBy: 'scheduledAt',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span>Consultation History</span>
            </h1>
            <p className="text-xs text-slate-500">
              Review completed clinical consultations and past appointment records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            asChild
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl font-medium shadow-sm"
          >
            <Link href="/patient/appointments/book">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Book New Appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Past Records
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 ${
            statusFilter === 'COMPLETED'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Completed Only</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('CANCELLED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 ${
            statusFilter === 'CANCELLED'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Cancelled Only</span>
        </button>
      </div>

      {/* Appointment History List */}
      {isLoading ? (
        <AppointmentSkeleton count={3} />
      ) : appointments.length === 0 ? (
        <AppointmentEmptyState
          title="No past consultation records"
          description="You do not have any past completed or cancelled appointments matching the selected filter."
          showBookAction={true}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
    </div>
  );
}
