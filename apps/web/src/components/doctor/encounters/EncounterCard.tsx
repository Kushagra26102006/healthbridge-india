'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  Video,
  User,
  FileEdit,
  Eye,
  History,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EncounterItemDto } from '@healthbridge/shared-types';

export interface EncounterCardProps {
  encounter: EncounterItemDto;
}

export function EncounterCard({ encounter }: EncounterCardProps) {
  const isCompleted = encounter.status === 'COMPLETED';
  const isDraft = encounter.isDraft;

  const dateFormatted = new Date(encounter.startTime).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timeFormatted = new Date(encounter.startTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="border border-border/80 bg-card hover:border-blue-500/40 transition-all shadow-xs">
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Reference, Patient Demographics & Date */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50/80 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-500/20">
              {encounter.encounterReference}
            </span>

            {/* Status & Draft Badges */}
            {isCompleted ? (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/30 text-[10px] gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            ) : isDraft ? (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/30 text-[10px] gap-1">
                <FileEdit className="h-3 w-3" />
                Draft In Progress
              </Badge>
            ) : (
              <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-50/30 text-[10px] gap-1">
                <Clock className="h-3 w-3" />
                In Progress
              </Badge>
            )}

            {/* Mode Badge */}
            {encounter.encounterType === 'VIRTUAL' ? (
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-600 text-[10px] gap-1">
                <Video className="h-3 w-3" />
                Telehealth
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-500/30 text-slate-600 text-[10px]">
                {encounter.encounterType}
              </Badge>
            )}
          </div>

          {/* Patient Details */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/doctor/encounters/${encounter.id}`}
                className="font-bold text-sm sm:text-base text-foreground hover:text-blue-600 transition-colors truncate"
              >
                {encounter.patientName}
              </Link>
              {(encounter.patientAge !== undefined || encounter.patientGender) && (
                <span className="text-xs text-muted-foreground">
                  ({[encounter.patientGender, encounter.patientAge ? `${encounter.patientAge}y` : '']
                    .filter(Boolean)
                    .join(', ')})
                </span>
              )}
            </div>

            {/* Chief Complaint / Primary Diagnosis */}
            <p className="text-xs text-muted-foreground line-clamp-1">
              <span className="font-semibold text-foreground/80">Chief Complaint: </span>
              {encounter.chiefComplaint || 'Routine clinical evaluation'}
              {encounter.primaryDiagnosis && (
                <>
                  <span className="mx-1.5 text-border">•</span>
                  <span className="font-semibold text-foreground/80">Primary Dx: </span>
                  <span className="text-blue-600 font-medium">{encounter.primaryDiagnosis}</span>
                </>
              )}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {dateFormatted} at {timeFormatted}
            </span>

            {encounter.facilityName && (
              <span className="flex items-center gap-1 truncate max-w-xs">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {encounter.facilityName}
              </span>
            )}

            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              {encounter.doctorName}
            </span>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex items-center gap-2 self-start md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-border/50">
          <Button asChild size="sm" variant="outline" className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href={`/doctor/patients/${encounter.patientId}/history`}>
              <History className="h-3 w-3" />
              History
            </Link>
          </Button>

          {isCompleted ? (
            <Button asChild size="sm" variant="outline" className="text-xs h-8 gap-1.5">
              <Link href={`/doctor/encounters/${encounter.id}`}>
                <Eye className="h-3 w-3" />
                View Chart
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-xs">
              <Link href={`/doctor/encounters/${encounter.id}/edit`}>
                <FileEdit className="h-3 w-3" />
                Edit Notes
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
