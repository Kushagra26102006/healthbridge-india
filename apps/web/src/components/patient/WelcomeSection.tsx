'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, FileText, ShieldCheck, ArrowUpRight, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface WelcomeSectionProps {
  patientName?: string;
  abhaLinked?: boolean;
  abhaStatusLabel?: string;
}

export function WelcomeSection({
  patientName,
  abhaLinked,
  abhaStatusLabel,
}: WelcomeSectionProps) {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = patientName || user?.name || 'Patient';

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#080F1E] via-[#111C30] to-[#0D3B4C] text-white p-6 sm:p-8 shadow-lg border border-slate-700/50">
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/3 -mb-16 w-52 h-52 rounded-full bg-primary/15 blur-2xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-teal-200 font-medium">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-pill bg-emerald-400"
              />
              <span>{todayFormatted}</span>
            </span>

            {abhaStatusLabel && (
              <Badge
                variant={abhaLinked ? 'success' : 'neutral'}
                size="sm"
                className="border-white/20 bg-white/10 text-white"
              >
                <Fingerprint className="h-3 w-3" aria-hidden="true" />
                <span>{abhaStatusLabel}</span>
              </Badge>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {getGreeting()},{' '}
            <span className="bg-gradient-to-r from-teal-300 to-cyan-200 bg-clip-text text-transparent">
              {displayName}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Review your health records, upcoming consultations, prescriptions, and active consent
            permissions from one unified workspace.
          </p>
        </div>

        {/* Quick Actions + Editorial Portal Visual */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" size="sm" asChild className="h-9 sm:h-10 px-4 font-semibold">
              <Link href="/patient/appointments/book">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>Book Appointment</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 sm:h-10 px-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            >
              <Link href="/patient/records">
                <FileText className="h-4 w-4 text-teal-300" aria-hidden="true" />
                <span>Health Records</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 sm:h-10 px-3 text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Link href="/patient/consent">
                <ShieldCheck className="h-4 w-4 text-teal-300" aria-hidden="true" />
                <span>Consents</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="hidden xl:block w-44 shrink-0">
            <EditorialVisual
              asset="ecosystemPatientCare"
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

export default WelcomeSection;
