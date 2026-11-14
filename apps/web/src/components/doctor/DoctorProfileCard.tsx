'use client';

import React from 'react';
import Link from 'next/link';
import {
  Award,
  Building2,
  Clock,
  IndianRupee,
  Globe,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DoctorProfileDto } from '@healthbridge/shared-types';

export interface DoctorProfileCardProps {
  profile?: DoctorProfileDto;
}

export function DoctorProfileCard({ profile }: DoctorProfileCardProps) {
  if (!profile) {
    return null;
  }

  const specializations = profile.specialization?.length
    ? profile.specialization
    : ['General Medicine'];

  const qualifications = profile.qualifications?.length
    ? profile.qualifications
    : ['MBBS'];

  const languages = profile.languages?.length ? profile.languages : ['English', 'Hindi'];

  const consultationModes = profile.consultationModes || ['IN_PERSON', 'TELECONSULTATION'];

  const workingDays = profile.workingDays?.length
    ? profile.workingDays
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const workingHours = profile.workingHours || { start: '09:00', end: '17:00' };

  return (
    <Card className="border border-border/80 bg-card shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20 shrink-0">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'DR'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Dr. {profile.name}
              </h2>
              {profile.verificationStatus === 'VERIFIED' ? (
                <Badge className="bg-teal-600/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px] px-2 py-0.5 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  Verified Clinician
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400">
                  Pending Verification
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span>Reg: <strong className="text-foreground">{profile.registrationNumber || 'MCI-PENDING'}</strong></span>
              <span className="text-muted-foreground/50">•</span>
              <span>{profile.experience || 5}+ Years Experience</span>
            </p>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="shrink-0 text-xs gap-1.5">
          <Link href="/doctor/profile">
            <Edit className="h-3.5 w-3.5" />
            Edit Profile
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-2 space-y-4 text-xs">
        {/* Specializations & Qualifications */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {specializations.map((spec) => (
              <Badge
                key={spec}
                variant="secondary"
                className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium px-2 py-0.5"
              >
                {spec}
              </Badge>
            ))}
            {qualifications.map((qual) => (
              <Badge
                key={qual}
                variant="outline"
                className="text-[11px] font-medium px-2 py-0.5 border-border"
              >
                {qual}
              </Badge>
            ))}
          </div>

          {profile.bio && (
            <p className="text-muted-foreground line-clamp-2 leading-relaxed italic">
              &quot;{profile.bio}&quot;
            </p>
          )}
        </div>

        {/* Practice Grid Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/80 text-muted-foreground">
          {/* Facility */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="truncate leading-tight">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Facility</span>
              <span className="font-semibold text-foreground truncate block">
                {profile.facility?.name || 'AIIMS New Delhi'}
              </span>
            </div>
          </div>

          {/* Fee */}
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-teal-500 shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Consultation Fee</span>
              <span className="font-semibold text-foreground">
                {profile.consultationFee ? `₹${profile.consultationFee}` : '₹500 / Consult'}
              </span>
            </div>
          </div>

          {/* Working Hours */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Hours ({workingDays.length}d/wk)
              </span>
              <span className="font-semibold text-foreground">
                {workingHours.start} - {workingHours.end}
              </span>
            </div>
          </div>

          {/* Modes & Languages */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="leading-tight truncate">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Modes ({consultationModes.length}) & Languages
              </span>
              <span className="font-semibold text-foreground truncate block">
                {languages.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
