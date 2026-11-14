'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Pill,
  Stethoscope,
  Activity,
  History,
  FileCheck2,
  Calendar,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DoctorPatientProfileOverviewDto } from '@healthbridge/shared-types';

interface ClinicalSummaryProps {
  overview: DoctorPatientProfileOverviewDto;
}

export const ClinicalSummary: React.FC<ClinicalSummaryProps> = ({ overview }) => {
  const { clinicalSummary, patient } = overview;
  const patientId = patient.id;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column (1 col): Allergies, Medications, Diagnoses, Vitals */}
        <div className="space-y-4">
          {/* Allergies Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Allergies & Intolerances
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-1 text-xs">
              {clinicalSummary.allergies && clinicalSummary.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalSummary.allergies.map((allergy, i) => (
                    <Badge
                      key={i}
                      className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 border border-amber-500/30 text-xs"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No known drug or environmental allergies documented
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Medications Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-2.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal-600" />
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Active Medications ({clinicalSummary.currentMedications.length})
                </CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-teal-600">
                <Link href={`/doctor/patients/${patientId}/prescriptions`}>
                  All Rx
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-1 text-xs space-y-2">
              {clinicalSummary.currentMedications.length > 0 ? (
                clinicalSummary.currentMedications.map((med, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                    <p className="font-semibold text-foreground">{med.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {med.dosage} • {med.frequency} • {med.duration}
                    </p>
                    {med.prescribedBy && (
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">{med.prescribedBy}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No active medication regimens on record
                </p>
              )}
            </CardContent>
          </Card>

          {/* Documented Diagnoses Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-2.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Documented Diagnoses ({clinicalSummary.pastDiagnoses.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-1 text-xs space-y-2">
              {clinicalSummary.pastDiagnoses.length > 0 ? (
                clinicalSummary.pastDiagnoses.map((diag, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl border border-border/40 text-xs">
                    <div>
                      <span className="font-semibold text-foreground block">{diag.name}</span>
                      {diag.code && (
                        <span className="font-mono text-[10px] text-muted-foreground">ICD-10: {diag.code}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">
                      {diag.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No chronic or past diagnoses recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Latest Vital Signs
                </CardTitle>
              </div>
              {clinicalSummary.vitalSigns?.recordedAt && (
                <CardDescription className="text-[10px]">
                  Recorded on {formatDate(clinicalSummary.vitalSigns.recordedAt)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-1 text-xs">
              {clinicalSummary.vitalSigns ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-muted/20 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Blood Pressure</span>
                    <span className="font-bold text-foreground font-mono">
                      {clinicalSummary.vitalSigns.bloodPressure || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">Heart Rate</span>
                    <span className="font-bold text-foreground font-mono">
                      {clinicalSummary.vitalSigns.heartRate ? `${clinicalSummary.vitalSigns.heartRate} bpm` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">SpO2</span>
                    <span className="font-bold text-foreground font-mono">
                      {clinicalSummary.vitalSigns.oxygenSaturation ? `${clinicalSummary.vitalSigns.oxygenSaturation}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block">BMI</span>
                    <span className="font-bold text-foreground font-mono">
                      {clinicalSummary.vitalSigns.bmi || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No vital signs recorded in recent consultations
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2 cols): Recent Encounters, Lab Reports, Prescriptions, Appointments */}
        <div className="md:col-span-2 space-y-4">
          {/* Medical History Note Card */}
          {clinicalSummary.medicalHistory && (
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Clinical Background & Notes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-1 text-xs leading-relaxed text-muted-foreground">
                <p>{clinicalSummary.medicalHistory}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Encounters Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Recent Consultation Encounters ({clinicalSummary.recentEncounters.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Latest clinical notes and consultation evaluations
                </CardDescription>
              </div>

              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-blue-600 gap-1">
                <Link href={`/doctor/patients/${patientId}/encounters`}>
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="pt-1 space-y-2.5 text-xs">
              {clinicalSummary.recentEncounters.length > 0 ? (
                clinicalSummary.recentEncounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-500/40 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-[11px]">
                          {enc.encounterReference}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                          {enc.status}
                        </Badge>
                        <span className="text-muted-foreground text-[11px]">
                          {formatDate(enc.date)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {enc.chiefComplaint || 'Consultation note'}
                      </p>
                      {enc.primaryDiagnosis && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400">
                          Primary Dx: {enc.primaryDiagnosis}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Attending: {enc.doctorName} {enc.facilityName ? `• ${enc.facilityName}` : ''}
                      </p>
                    </div>

                    <Button asChild size="sm" variant="outline" className="text-xs h-7 self-start sm:self-center">
                      <Link href={`/doctor/encounters/${enc.id}`}>
                        View Chart
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-muted-foreground/80 italic text-xs">
                  No consultation encounters recorded for this patient.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Prescriptions Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-teal-600" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Recent Prescriptions ({clinicalSummary.recentPrescriptions.length})
                  </CardTitle>
                </div>
              </div>

              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-teal-600 gap-1">
                <Link href={`/doctor/patients/${patientId}/prescriptions`}>
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="pt-1 text-xs">
              {clinicalSummary.recentPrescriptions.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {clinicalSummary.recentPrescriptions.map((rx) => (
                    <div key={rx.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-600 text-[11px]">
                            {rx.prescriptionNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(rx.date)}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {rx.status}
                          </Badge>
                        </div>
                        <p className="font-semibold text-foreground mt-0.5 truncate max-w-md">
                          {rx.medicationNames.join(', ')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Prescribed by {rx.doctorName} ({rx.medicationsCount} items)
                        </p>
                      </div>

                      <Button asChild size="sm" variant="outline" className="text-xs h-7 shrink-0">
                        <Link href={`/doctor/prescriptions/${rx.id}`}>
                          View Rx
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-muted-foreground/80 italic text-xs">
                  No prescriptions issued yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Diagnostic Lab Reports Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Diagnostic Laboratory Reports ({clinicalSummary.recentLabReports.length})
                  </CardTitle>
                </div>
              </div>

              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 gap-1">
                <Link href={`/doctor/patients/${patientId}/lab-reports`}>
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="pt-1 text-xs">
              {clinicalSummary.recentLabReports.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {clinicalSummary.recentLabReports.map((lr) => (
                    <div key={lr.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{lr.testName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(lr.date)} • {lr.laboratoryName} ({lr.observationsCount} observations)
                        </p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 text-[10px]">
                        {lr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-muted-foreground/80 italic text-xs">
                  No diagnostic laboratory reports on file.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Consultations Card */}
          {clinicalSummary.upcomingAppointments && clinicalSummary.upcomingAppointments.length > 0 && (
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Upcoming Consultations ({clinicalSummary.upcomingAppointments.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-1 text-xs space-y-2">
                {clinicalSummary.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="p-2.5 rounded-xl border border-border/50 bg-background/50 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground block">
                        {formatDate(apt.scheduledAt)} • {apt.consultationType}
                      </span>
                      {apt.facilityName && (
                        <span className="text-[11px] text-muted-foreground">{apt.facilityName}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/30">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
