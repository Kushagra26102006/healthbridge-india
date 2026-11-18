'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Stethoscope,
  ListOrdered,
  Pill,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import type { DoctorProfileDto } from '@healthbridge/shared-types';

export interface DoctorWelcomeProps {
  profile?: DoctorProfileDto;
  todayCount?: number;
  upcomingCount?: number;
}

export function DoctorWelcome({
  profile,
  todayCount = 0,
  upcomingCount = 0,
}: DoctorWelcomeProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const doctorName = profile?.name || 'Physician';
  const primaryFacility = profile?.facility?.name || 'Affiliated Clinical Practice';

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#080F1E] via-[#111C30] to-[#13294B] p-6 sm:p-8 text-white shadow-lg border border-slate-700/50">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute right-32 -bottom-16 h-48 w-48 rounded-full bg-secondary/15 blur-2xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge
              variant="info"
              size="sm"
              className="bg-white/10 text-blue-100 border-white/15 backdrop-blur-sm"
            >
              <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clinical Workspace</span>
            </Badge>

            <span className="text-xs text-slate-300 font-medium">{formattedDate}</span>

            {profile?.verificationStatus === 'VERIFIED' && (
              <Badge
                variant="success"
                size="sm"
                className="border-teal-400/35 text-teal-200 bg-teal-950/50"
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>Verified Clinician</span>
              </Badge>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {getGreeting()}, Dr. {doctorName}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-100">
                <Building2 className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
                <span>{primaryFacility}</span>
              </span>
              <span className="text-slate-500" aria-hidden="true">
                •
              </span>
              <span className="tabular-nums">
                {todayCount > 0 ? (
                  <>
                    <strong className="text-white font-semibold">{todayCount}</strong>{' '}
                    consultation{todayCount === 1 ? '' : 's'} scheduled today ({upcomingCount}{' '}
                    upcoming)
                  </>
                ) : (
                  `No remaining consultations today (${upcomingCount} upcoming)`
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Clinical Quick Actions + Workspace Visual */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" size="sm" asChild className="h-9 sm:h-10 px-4 font-semibold">
              <Link href="/doctor/queue">
                <ListOrdered className="h-4 w-4" aria-hidden="true" />
                <span>Patient Queue</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 sm:h-10 px-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            >
              <Link href="/doctor/encounters/new">
                <Plus className="h-4 w-4 text-teal-300" aria-hidden="true" />
                <span>New Consultation</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 sm:h-10 px-3 text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Link href="/doctor/prescriptions/new">
                <Pill className="h-4 w-4 text-teal-300" aria-hidden="true" />
                <span>New Rx</span>
              </Link>
            </Button>
          </div>

          <div className="hidden xl:block w-44 shrink-0">
            <EditorialVisual
              asset="ecosystemDoctorWorkspace"
              aspectClassName="aspect-[16/10]"
              sizes="176px"
              className="rounded-lg border-white/15 bg-white/5 shadow-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorWelcome;
