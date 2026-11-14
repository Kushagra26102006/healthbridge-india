'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DoctorPatientItemDto } from '@healthbridge/shared-types';

export interface AssignedPatientsProps {
  patients: DoctorPatientItemDto[];
  isLoading?: boolean;
  className?: string;
}

export function AssignedPatients({
  patients,
  isLoading = false,
  className,
}: AssignedPatientsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter((pt) =>
    pt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Card className={cn('border border-border/80 bg-card shadow-sm', className)}>
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-foreground">
              Assigned Patients
            </CardTitle>
            <Badge variant="outline" className="text-xs px-2 py-0 border-teal-500/30 text-teal-600 dark:text-teal-400">
              {patients.length} Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patients authorized through appointments, encounters or ABDM consent
          </p>
        </div>

        <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 gap-1 self-start sm:self-center">
          <Link href="/doctor/patients">
            View All Roster
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        {/* Quick Search Input */}
        {patients.length > 3 && (
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name..."
              className="w-full bg-muted/50 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted/50 animate-pulse rounded-xl border border-border/40"
              />
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'No matching patients found.' : 'No assigned patients in your clinical roster yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredPatients.slice(0, 5).map((patient) => (
              <div
                key={patient.id}
                className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {patient.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {patient.name}
                      </span>
                      {patient.gender && (
                        <span className="text-[10px] text-muted-foreground">
                          ({patient.gender})
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] px-1.5 py-0',
                          patient.accessStatus === 'ACTIVE_CONSENT'
                            ? 'border-teal-500/40 text-teal-600 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'border-blue-500/40 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                        )}
                      >
                        {patient.accessStatus === 'ACTIVE_CONSENT' ? 'ABDM Consent' : 'Encounter Bound'}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5">
                      <span>{patient.totalAppointments} Consultation{patient.totalAppointments === 1 ? '' : 's'}</span>
                      {patient.lastEncounterDate && (
                        <>
                          <span>•</span>
                          <span>Last: {formatDate(patient.lastEncounterDate)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                  <Link href={`/doctor/patients?patientId=${patient.patientId}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
