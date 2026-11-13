'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, PlusCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface WelcomeSectionProps {
  patientName?: string;
}

export function WelcomeSection({ patientName }: WelcomeSectionProps) {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = patientName || user?.name || 'Patient';

  // Format today's date in Indian healthcare standard
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-teal-950 text-white p-6 sm:p-8 shadow-xl">
      {/* Subtle Healthcare Graphic Accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-teal-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{todayFormatted}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-teal-300 to-cyan-200 bg-clip-text text-transparent">
              {displayName}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Here&apos;s an overview of your healthcare activity across connected ABDM facilities.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link href="/patient/appointments">
            <Button
              variant="teal"
              size="sm"
              className="text-xs font-semibold shadow-md gap-1.5 h-9 sm:h-10 px-4"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Appointment</span>
            </Button>
          </Link>

          <Link href="/patient/records">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-medium text-white border-white/20 hover:bg-white/10 gap-1.5 h-9 sm:h-10 px-4"
            >
              <PlusCircle className="h-4 w-4 text-teal-400" />
              <span>View Health Records</span>
            </Button>
          </Link>

          <Link href="/patient/consent">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 gap-1 h-9 sm:h-10 px-3"
            >
              <ShieldCheck className="h-4 w-4 text-teal-300" />
              <span>Consents</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WelcomeSection;
