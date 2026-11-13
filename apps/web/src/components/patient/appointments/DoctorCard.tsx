'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Video,
  Users,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DoctorPublicDto } from '@healthbridge/shared-types';

export interface DoctorCardProps {
  doctor: DoctorPublicDto;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const isVerified = doctor.verificationStatus === 'VERIFIED';
  const hasInPerson = doctor.consultationModes?.includes('IN_PERSON');
  const hasTeleconsult = doctor.consultationModes?.includes('TELECONSULTATION');

  return (
    <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-5 space-y-4">
        {/* Top Header: Avatar + Identity + Verification */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3.5">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {doctor.name
                  .replace('Dr. ', '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              {isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"
                  title="Verified Healthcare Practitioner"
                >
                  <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 fill-teal-500/20" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/patient/doctors/${doctor.userId}`}
                  className="font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors line-clamp-1"
                >
                  {doctor.name}
                </Link>
              </div>

              <div className="flex flex-wrap gap-1 mt-1">
                {doctor.specialization.slice(0, 2).map((spec) => (
                  <Badge
                    key={spec}
                    variant="secondary"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5"
                  >
                    {spec}
                  </Badge>
                ))}
                {doctor.specialization.length > 2 && (
                  <Badge
                    variant="outline"
                    className="border-slate-200 dark:border-slate-800 text-slate-500 text-xs px-1.5 py-0.5"
                  >
                    +{doctor.specialization.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {doctor.availableToday && (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1 font-medium flex-shrink-0">
              <Sparkles className="h-3 w-3" />
              <span>Available</span>
            </Badge>
          )}
        </div>

        {/* Credentials and Experience */}
        <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-400">
          {doctor.qualifications && doctor.qualifications.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <Award className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{doctor.qualifications.join(', ')}</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{doctor.experience} years clinical practice</span>
          </div>

          {doctor.facility && (
            <div className="flex items-start space-x-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {doctor.facility.name}
                </span>
                {doctor.facility.address?.city && (
                  <span className="text-slate-500 dark:text-slate-500">
                    {' '}
                    • {doctor.facility.address.city}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Consultation Modes Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {hasInPerson && (
            <span className="inline-flex items-center space-x-1 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-md">
              <Users className="h-3 w-3" />
              <span>In-Person</span>
            </span>
          )}
          {hasTeleconsult && (
            <span className="inline-flex items-center space-x-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md">
              <Video className="h-3 w-3" />
              <span>Teleconsultation</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="text-xs h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
          <Link href={`/patient/doctors/${doctor.userId}`}>
            View Profile
          </Link>
        </Button>

        <Button
          size="sm"
          asChild
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3.5 rounded-lg shadow-sm font-medium flex items-center space-x-1"
        >
          <Link href={`/patient/appointments/book?doctorId=${doctor.userId}`}>
            <span>Book Slot</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
};
