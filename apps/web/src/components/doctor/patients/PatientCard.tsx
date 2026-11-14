'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  History,
  FileText,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientAccessStatus } from './PatientAccessStatus';
import type { DoctorPatientItemDto } from '@healthbridge/shared-types';

interface PatientCardProps {
  patient: DoctorPatientItemDto;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'None recorded';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="border border-border/80 bg-card hover:border-teal-500/40 transition-all shadow-xs overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top Demographics Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(patient.name)}
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/doctor/patients/${patient.patientId}`}
                  className="font-bold text-sm text-foreground hover:text-teal-600 transition-colors truncate"
                >
                  {patient.name}
                </Link>
                {patient.gender && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({patient.gender[0]})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                  {patient.patientReference || `PAT-${patient.patientId.slice(-6).toUpperCase()}`}
                </span>
                {patient.age && <span>• {patient.age} yrs</span>}
                {patient.bloodGroup && (
                  <span className="text-rose-600 font-semibold">• {patient.bloodGroup}</span>
                )}
              </div>
            </div>
          </div>

          <PatientAccessStatus status={patient.accessStatus} compact />
        </div>

        {/* Clinical Activity Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
          <div className="p-2 rounded-xl bg-muted/20 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Encounter
            </span>
            <span className="font-semibold text-foreground text-[11px] block truncate">
              {formatDate(patient.lastEncounterDate)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-muted/20 space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Next Appointment
            </span>
            <span className="font-semibold text-foreground text-[11px] block truncate">
              {patient.nextAppointmentDate ? formatDate(patient.nextAppointmentDate) : 'Not scheduled'}
            </span>
          </div>
        </div>

        {/* Facility & Consultations Count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{patient.assignedFacility?.name || 'HealthBridge Network'}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {patient.totalAppointments} Visit{patient.totalAppointments === 1 ? '' : 's'}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
              <Link href={`/doctor/patients/${patient.patientId}/history`}>
                <History className="h-3.5 w-3.5 text-blue-500" />
                History
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
              <Link href={`/doctor/patients/${patient.patientId}/records`}>
                <FileText className="h-3.5 w-3.5 text-teal-500" />
                Records
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs gap-1" title="New Clinical Encounter">
              <Link href={`/doctor/encounters/new?patientId=${patient.patientId}`}>
                <Plus className="h-3.5 w-3.5" />
                Consult
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 px-2.5 text-xs gap-1">
              <Link href={`/doctor/patients/${patient.patientId}`}>
                Profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
