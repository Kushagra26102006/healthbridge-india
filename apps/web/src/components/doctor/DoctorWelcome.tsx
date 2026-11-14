'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  UserCheck,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const primaryFacility = profile?.facility?.name || 'AIIMS New Delhi — Main Hospital';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20">
      {/* Decorative background glow */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute right-32 -bottom-16 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge className="bg-blue-600/60 hover:bg-blue-600 text-blue-100 border-none font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1.5 backdrop-blur-md">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Doctor Portal</span>
            </Badge>

            <span className="text-xs text-blue-200/80 font-medium">
              {formattedDate}
            </span>

            {profile?.verificationStatus === 'VERIFIED' && (
              <Badge variant="outline" className="border-teal-400/40 text-teal-300 bg-teal-950/30 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                ABDM Verified
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()}, Dr. {doctorName}
            </h1>
            <p className="mt-1 text-sm text-blue-100/90 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-medium">
                <Building2 className="h-3.5 w-3.5 text-blue-300" />
                {primaryFacility}
              </span>
              <span className="text-blue-300/40">•</span>
              <span>
                {todayCount > 0 ? (
                  <>
                    You have <strong className="text-white font-semibold">{todayCount}</strong> consultation{todayCount === 1 ? '' : 's'} scheduled today ({upcomingCount} upcoming this week).
                  </>
                ) : (
                  'No consultations remaining for today.'
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="bg-white text-blue-950 hover:bg-blue-50 font-semibold shadow-md shadow-black/20"
          >
            <Link href="/doctor/appointments">
              <Calendar className="mr-2 h-4 w-4 text-blue-600" />
              Today&apos;s Schedule
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
          >
            <Link href="/doctor/schedule">
              <Clock className="mr-2 h-4 w-4" />
              Manage Availability
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
          >
            <Link href="/doctor/profile">
              <UserCheck className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
