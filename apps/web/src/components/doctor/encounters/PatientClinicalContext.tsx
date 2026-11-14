'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  AlertTriangle,
  Pill,
  History,
  FileCheck2,
  Stethoscope,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePatientClinicalHistory } from '@/features/doctor/hooks/use-doctor';

export interface PatientClinicalContextProps {
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
}

export function PatientClinicalContext({
  patientId,
  patientName,
  patientAge,
  patientGender,
  patientPhone,
}: PatientClinicalContextProps) {
  const { history, isLoading } = usePatientClinicalHistory(patientId);

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Patient Clinical Context
            </CardTitle>
          </div>

          <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-700 gap-1 px-2">
            <Link href={`/doctor/patients/${patientId}/history`} target="_blank">
              Full History
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {/* Demographics Card */}
        <div className="bg-muted/30 rounded-xl p-3 border border-border/50 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm text-foreground">{patientName}</p>
              <p className="text-[11px] text-muted-foreground">
                {[patientGender, patientAge ? `${patientAge} years` : undefined, patientPhone]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
            {history?.patient?.bloodGroup && (
              <Badge variant="outline" className="border-rose-500/40 text-rose-600 text-[10px] font-bold">
                {history.patient.bloodGroup}
              </Badge>
            )}
          </div>

          {history?.patient?.abhaAddress && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
              <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>ABHA: {history.patient.abhaAddress}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse pt-2">
            <div className="h-4 w-28 rounded bg-muted/70" />
            <div className="h-12 rounded-lg bg-muted/40" />
            <div className="h-12 rounded-lg bg-muted/40" />
          </div>
        ) : (
          <>
            {/* Known Allergies */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Known Allergies</span>
              </div>
              {history?.allergies && history.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {history.allergies.map((allergy, i) => (
                    <Badge key={i} className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 border border-amber-500/30 text-[10px]">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  No known allergies documented
                </p>
              )}
            </div>

            {/* Current Active Medications */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <Pill className="h-3.5 w-3.5 text-teal-600" />
                <span>Current Medications ({history?.currentMedications?.length || 0})</span>
              </div>
              {history?.currentMedications && history.currentMedications.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {history.currentMedications.slice(0, 3).map((med, i) => (
                    <div key={i} className="bg-muted/20 border border-border/40 rounded-lg p-2 text-[11px]">
                      <div className="font-semibold text-foreground">{med.name}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {med.dosage} • {med.frequency} • {med.duration}
                      </div>
                    </div>
                  ))}
                  {history.currentMedications.length > 3 && (
                    <p className="text-[10px] text-blue-600 text-center">
                      +{history.currentMedications.length - 3} more medications
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  No active prescriptions on file
                </p>
              )}
            </div>

            {/* Existing Diagnoses */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
                <span>Past Diagnoses ({history?.pastDiagnoses?.length || 0})</span>
              </div>
              {history?.pastDiagnoses && history.pastDiagnoses.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {history.pastDiagnoses.slice(0, 4).map((diag, i) => (
                    <Badge key={i} variant="outline" className="border-indigo-500/30 text-indigo-600 text-[10px]">
                      {diag.name} {diag.code ? `(${diag.code})` : ''}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  No previous diagnosis records
                </p>
              )}
            </div>

            {/* Previous Consultations */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <History className="h-3.5 w-3.5 text-blue-600" />
                <span>Previous Encounters ({history?.encounters?.length || 0})</span>
              </div>
              {history?.encounters && history.encounters.length > 0 ? (
                <div className="space-y-1.5">
                  {history.encounters.slice(0, 2).map((enc) => (
                    <div key={enc.id} className="bg-muted/20 border border-border/40 rounded-lg p-2 text-[11px] flex justify-between items-center">
                      <div>
                        <span className="font-medium text-foreground block">
                          {enc.chiefComplaint || 'Consultation'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(enc.startTime).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-border">
                        {enc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  First visit or no recorded encounters
                </p>
              )}
            </div>

            {/* Diagnostic Lab Reports */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Lab Reports ({history?.labReports?.length || 0})</span>
              </div>
              {history?.labReports && history.labReports.length > 0 ? (
                <div className="space-y-1">
                  {history.labReports.slice(0, 2).map((report) => (
                    <div key={report.id} className="text-[11px] flex items-center justify-between text-muted-foreground py-0.5">
                      <span className="truncate max-w-[150px] font-medium text-foreground">
                        {report.testName}
                      </span>
                      <span className="text-[10px]">
                        {new Date(report.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  No diagnostic lab reports available
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
