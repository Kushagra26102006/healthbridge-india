'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Search,
  Stethoscope,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoctorTodayAppointments, useDoctorUpcomingAppointments } from '@/features/doctor/hooks/use-doctor';
import { cn } from '@/lib/utils';

export default function DoctorAppointmentsPage() {
  const [filterTab, setFilterTab] = useState<'TODAY' | 'UPCOMING'>('TODAY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    appointments: todayAppointments,
    isLoading: todayLoading,
    refetch: refetchToday,
  } = useDoctorTodayAppointments(statusFilter === 'ALL' ? undefined : statusFilter);

  const {
    appointments: upcomingAppointments,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useDoctorUpcomingAppointments(20);

  const activeAppointments = filterTab === 'TODAY' ? todayAppointments : upcomingAppointments;
  const isLoading = filterTab === 'TODAY' ? todayLoading : upcomingLoading;

  const filteredAppointments = activeAppointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.reason && apt.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterTab === 'UPCOMING' && statusFilter !== 'ALL') {
      return matchesSearch && apt.status === statusFilter;
    }
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs">
            Confirmed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs animate-pulse">
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs">
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="text-xs">
            Cancelled
          </Badge>
        );
      case 'SCHEDULED':
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Consultations & Appointments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your daily clinical appointment schedule and patient consultations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => (filterTab === 'TODAY' ? refetchToday() : refetchUpcoming())}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
            <Link href="/doctor/schedule">
              <Calendar className="h-3.5 w-3.5" />
              Manage Availability
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-sm">
        {/* Main Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab('TODAY')}
            className={cn(
              'px-4 py-1.5 rounded-lg transition-all',
              filterTab === 'TODAY'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Today&apos;s Schedule ({todayAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('UPCOMING')}
            className={cn(
              'px-4 py-1.5 rounded-lg transition-all',
              filterTab === 'UPCOMING'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Upcoming (Next 7 Days)
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name or reason..."
              className="w-full bg-muted/40 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted/40 text-xs rounded-xl px-3 py-1.5 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  No appointments found
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? `No appointments match "${searchQuery}".`
                    : `No ${filterTab.toLowerCase()} appointments scheduled matching the selected filters.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredAppointments.map((apt) => {
                const isTele = apt.consultationType === 'TELECONSULTATION';

                return (
                  <div
                    key={apt.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Time Slot Badge */}
                      <div className="w-24 shrink-0 text-center py-2 px-2.5 bg-muted/60 rounded-xl border border-border/80">
                        <span className="text-xs font-extrabold text-foreground block">
                          {apt.startTime}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {apt.endTime}
                        </span>
                        <span className="text-[9px] text-muted-foreground block mt-0.5 uppercase">
                          {new Date(apt.scheduledAt).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Patient & Details */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {apt.patientName}
                          </span>
                          {apt.patientAge && (
                            <span className="text-xs text-muted-foreground">
                              ({apt.patientAge}y{apt.patientGender ? ` / ${apt.patientGender}` : ''})
                            </span>
                          )}
                          {getStatusBadge(apt.status)}
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 py-0 flex items-center gap-1',
                              isTele
                                ? 'border-indigo-400/40 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                                : 'border-emerald-400/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                            )}
                          >
                            {isTele ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                            {isTele ? 'Teleconsultation' : 'In-Person Visit'}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          <strong className="text-foreground/90">Chief Complaint:</strong> {apt.reason || 'Routine consultation'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          {apt.patientPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.patientPhone}
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Facility: {apt.facilityName || 'Primary Clinic'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Clinical CTA */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {(apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS') && (
                        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm">
                          <Link href={`/doctor/encounters?appointmentId=${apt.id}`}>
                            <Stethoscope className="h-3.5 w-3.5" />
                            Start Consult
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
