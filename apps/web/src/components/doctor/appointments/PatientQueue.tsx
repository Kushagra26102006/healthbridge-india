'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Timer,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QueuePatientCard } from './QueuePatientCard';
import { useDoctorQueue, useDoctorAppointmentActions } from '@/features/doctor/hooks/use-doctor';
import { cn } from '@/lib/utils';

export function PatientQueue() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('ALL');

  const { queue, isLoading, isFetching, refetch } = useDoctorQueue(activeTab);

  const {
    checkInPatient,
    isCheckingIn,
    startConsultation,
    isStarting,
    completeConsultation,
    isCompleting,
  } = useDoctorAppointmentActions();

  const waitingCount = queue.filter((i) => i.status === 'CHECKED_IN').length;
  const inConsultCount = queue.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = queue.filter((i) => i.status === 'COMPLETED').length;

  const handleCheckIn = async (id: string) => {
    await checkInPatient(id);
    refetch();
  };

  const handleStart = async (id: string) => {
    await startConsultation(id);
    refetch();
  };

  const handleComplete = async (id: string) => {
    await completeConsultation(id);
    refetch();
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Daily Patient Queue
            </h1>
            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Clinic Queue
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time patient intake, waiting room status, and in-consultation workflow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>

          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/doctor/appointments">All Appointments</Link>
          </Button>
        </div>
      </div>

      {/* Live Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            <Timer className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Waiting in Clinic
            </span>
            <span className="text-xl font-extrabold text-foreground">{waitingCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              In Consultation
            </span>
            <span className="text-xl font-extrabold text-foreground">{inConsultCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Completed Today
            </span>
            <span className="text-xl font-extrabold text-foreground">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Queue Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/80 text-xs font-semibold overflow-x-auto">
        {(['ALL', 'WAITING', 'IN_CONSULTATION', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-lg transition-all text-xs whitespace-nowrap',
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'ALL'
              ? 'All Queue'
              : tab === 'WAITING'
              ? `Waiting (${waitingCount})`
              : tab === 'IN_CONSULTATION'
              ? `In Consult (${inConsultCount})`
              : `Completed (${completedCount})`}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border/60"
            />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-bold text-foreground">No Patients in Queue</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === 'ALL'
              ? 'No consultations scheduled for today or queue is clear.'
              : `There are currently no patients in ${activeTab.toLowerCase().replace('_', ' ')} status.`}
          </p>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/doctor/appointments">View Full Schedule</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <QueuePatientCard
              key={item.id}
              item={item}
              onCheckIn={handleCheckIn}
              onStart={handleStart}
              onComplete={handleComplete}
              isBusy={isCheckingIn || isStarting || isCompleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
