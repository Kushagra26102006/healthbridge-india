'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Video,
  MapPin,
  Stethoscope,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DoctorAppointmentItemDto } from '@healthbridge/shared-types';

export interface TodaysAppointmentsProps {
  appointments: DoctorAppointmentItemDto[];
  isLoading?: boolean;
  onFilterChange?: (status: string) => void;
  className?: string;
}

type FilterTab = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export function TodaysAppointments({
  appointments,
  isLoading = false,
  onFilterChange,
  className,
}: TodaysAppointmentsProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') {
      return apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS';
    }
    if (activeTab === 'COMPLETED') return apt.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return apt.status === 'CANCELLED';
    return true;
  });

  const handleTabClick = (tab: FilterTab) => {
    setActiveTab(tab);
    if (onFilterChange) {
      onFilterChange(tab);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px]">
            Confirmed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] animate-pulse">
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px]">
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="text-[10px]">
            Cancelled
          </Badge>
        );
      case 'SCHEDULED':
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            Scheduled
          </Badge>
        );
    }
  };

  return (
    <Card className={cn('border border-border/80 bg-card shadow-sm', className)}>
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-foreground">
              Today&apos;s Consultations
            </CardTitle>
            <Badge variant="outline" className="text-xs px-2 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400">
              {appointments.length} Total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time schedule of clinic visits and teleconsultations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs overflow-x-auto">
          {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all text-xs whitespace-nowrap',
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted/50 animate-pulse rounded-xl border border-border/40"
              />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No consultations found
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {activeTab === 'ALL'
                  ? 'You have no scheduled appointments for today. Check your upcoming calendar or availability.'
                  : `There are no ${activeTab.toLowerCase()} consultations for today.`}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/doctor/schedule">View Calendar</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredAppointments.map((apt) => {
              const isTele = apt.consultationType === 'TELECONSULTATION';

              return (
                <div
                  key={apt.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Time Slot Pill */}
                    <div className="w-20 shrink-0 text-center py-1.5 px-2 bg-muted rounded-xl border border-border/80">
                      <span className="text-xs font-bold text-foreground block">
                        {apt.startTime || '09:00'}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {apt.endTime || '09:30'}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground hover:underline cursor-pointer">
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
                            'text-[10px] px-1.5 py-0 flex items-center gap-1',
                            isTele
                              ? 'border-indigo-400/40 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                              : 'border-emerald-400/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                          )}
                        >
                          {isTele ? (
                            <>
                              <Video className="h-2.5 w-2.5" />
                              Teleconsult
                            </>
                          ) : (
                            <>
                              <MapPin className="h-2.5 w-2.5" />
                              In-Person
                            </>
                          )}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-1">
                        <strong className="text-foreground/80">Reason:</strong> {apt.reason || 'General Health Consultation'}
                      </p>

                      {apt.patientPhone && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground/60" />
                          <span>{apt.patientPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED' ? (
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm">
                        <Link href={`/doctor/encounters?appointmentId=${apt.id}`}>
                          <Stethoscope className="h-3.5 w-3.5" />
                          Consult
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link href={`/doctor/appointments`}>
                          Details
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
  );
}
