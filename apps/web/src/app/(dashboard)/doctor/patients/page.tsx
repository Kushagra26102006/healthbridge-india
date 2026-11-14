'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ShieldCheck,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoctorPatients } from '@/features/doctor/hooks/use-doctor';
import { cn } from '@/lib/utils';

export default function DoctorPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { patients, isLoading, isError, error, refetch } = useDoctorPatients(searchTerm);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'No recorded visits';
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
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            My Assigned Patients
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patients authorized through clinical encounters, scheduled appointments or ABDM consent
          </p>
        </div>

        <Button onClick={() => refetch()} variant="outline" size="sm" className="text-xs gap-1.5 self-start sm:self-center">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Privacy & ABDM Compliance Banner */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20 p-4 flex items-start gap-3 text-xs text-teal-800 dark:text-teal-200">
        <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-bold">ABDM & DPDP Act 2023 Clinical Privacy Boundary</span>
          <p className="text-muted-foreground text-[11px]">
            In strict compliance with India&apos;s Digital Personal Data Protection (DPDP) Act and the Ayushman Bharat Digital Mission (ABDM), doctors may only access health records of patients who have booked appointments, attended clinical encounters, or explicitly granted digital consent.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-card p-3 rounded-2xl border border-border/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by name or contact number..."
            className="w-full bg-muted/40 text-xs rounded-xl pl-9 pr-4 py-2 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Badge variant="outline" className="text-xs px-2.5 py-1 border-border">
          {patients.length} Patient{patients.length === 1 ? '' : 's'} Authorized
        </Badge>
      </div>

      {/* Patients Roster List */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-12 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Failed to load patient roster
              </p>
              <p className="text-xs text-muted-foreground">{error?.message}</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Users className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  No assigned patients found
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchTerm
                    ? `No patients match "${searchTerm}".`
                    : 'Patients who book consultations with you will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {patient.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground truncate">
                          {patient.name}
                        </span>
                        {patient.gender && (
                          <span className="text-xs text-muted-foreground">
                            ({patient.gender})
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-2 py-0',
                            patient.accessStatus === 'ACTIVE_CONSENT'
                              ? 'border-teal-500/40 text-teal-600 bg-teal-50/50 dark:bg-teal-950/30'
                              : 'border-blue-500/40 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                          )}
                        >
                          {patient.accessStatus === 'ACTIVE_CONSENT' ? 'ABDM Consent' : 'Encounter Bound'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {patient.phone && <span>Phone: {patient.phone}</span>}
                        {patient.phone && <span>•</span>}
                        <span>{patient.totalAppointments} Consultation{patient.totalAppointments === 1 ? '' : 's'}</span>
                        <span>•</span>
                        <span>Last Visit: {formatDate(patient.lastEncounterDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
                      <Link href={`/doctor/encounters?patientId=${patient.patientId}`}>
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        Clinical Records
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
