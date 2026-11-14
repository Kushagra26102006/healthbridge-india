'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  AlertTriangle,
  Pill,
  History,
  FileCheck2,
  Stethoscope,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatientClinicalHistory } from '@/features/doctor/hooks/use-doctor';

export default function DoctorPatientHistoryPage() {
  const params = useParams();
  const patientId = params?.patientId as string;

  const { history, isLoading, isError, error, refetch } = usePatientClinicalHistory(patientId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-muted/40" />
          <div className="md:col-span-2 h-96 rounded-2xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (isError || !history) {
    return (
      <div className="py-16 text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-bold text-foreground">Access Denied or Patient Not Found</p>
        <p className="text-xs text-muted-foreground">
          {error?.message || 'You lack clinical care relationship or active patient consent to view this record.'}
        </p>
        <div className="pt-2">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/doctor/patients">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Assigned Patients
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const p = history.patient;

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Top Navigation & Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/doctor/patients">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Patients
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              {p.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Longitudinal Clinical Record & Electronic Health History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs gap-1.5 h-8">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 shadow-sm">
            <Link href={`/doctor/encounters/new?patientId=${p.id}`}>
              <Plus className="h-3.5 w-3.5" />
              New Consultation
            </Link>
          </Button>
        </div>
      </div>

      {/* Patient Key Demographics Card */}
      <Card className="border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Age & Gender
            </span>
            <span className="font-bold text-foreground block">
              {[p.gender, p.age ? `${p.age} years` : undefined].filter(Boolean).join(' • ') || 'Not specified'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Blood Group
            </span>
            <span className="font-bold text-rose-600 block">
              {p.bloodGroup || 'Not specified'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Contact Phone
            </span>
            <span className="font-mono text-foreground block">
              {p.phone || 'Unavailable'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              ABHA Address
            </span>
            <span className="font-mono text-emerald-600 flex items-center gap-1 block truncate">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              {p.abhaAddress || 'Not linked'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Authorization Status
            </span>
            <Badge variant="outline" className="text-[10px] mt-0.5 border-emerald-500/40 text-emerald-600 bg-emerald-50/30">
              {history.consentStatus}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 2-Column Clinical Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Allergies, Meds, Diagnoses (1 col) */}
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
              {history.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {history.allergies.map((allergy, i) => (
                    <Badge key={i} className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 border border-amber-500/30 text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No known allergies documented
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Medications Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-2.5">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal-600" />
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Current Medications ({history.currentMedications.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-1 text-xs space-y-2">
              {history.currentMedications.length > 0 ? (
                history.currentMedications.map((med, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-0.5">
                    <p className="font-semibold text-foreground">{med.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {med.dosage} • {med.frequency} • {med.duration}
                    </p>
                    {med.prescribedBy && (
                      <p className="text-[10px] text-blue-600">{med.prescribedBy}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No active medication regimens
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chronic / Past Diagnoses Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-2.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Documented Diagnoses ({history.pastDiagnoses.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-1 text-xs space-y-2">
              {history.pastDiagnoses.length > 0 ? (
                history.pastDiagnoses.map((diag, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 text-xs">
                    <div>
                      <span className="font-semibold text-foreground block">{diag.name}</span>
                      {diag.code && (
                        <span className="font-mono text-[10px] text-muted-foreground">ICD: {diag.code}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600">
                      {diag.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground/80 italic text-xs">
                  No past diagnosis records
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Encounters, Labs, Medical Records (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          {/* Consultations Timeline */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Consultation History ({history.encounters.length})
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Chronological clinical consultations recorded across all visits
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-1 space-y-2.5 text-xs">
              {history.encounters.length > 0 ? (
                history.encounters.map((enc) => (
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
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(enc.startTime).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {enc.chiefComplaint || 'Consultation note'}
                      </p>
                      {enc.primaryDiagnosis && (
                        <p className="text-[11px] text-blue-600">
                          Dx: {enc.primaryDiagnosis}
                        </p>
                      )}
                    </div>

                    <Button asChild size="sm" variant="outline" className="text-xs h-7 self-start sm:self-center">
                      <Link href={`/doctor/encounters/${enc.id}`}>
                        View Chart
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No past consultation records on file for this patient.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnostic Laboratory Investigations */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Diagnostic Laboratory Reports ({history.labReports.length})
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-1 text-xs">
              {history.labReports.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {history.labReports.map((report) => (
                    <div key={report.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{report.testName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(report.date).toLocaleDateString('en-IN')}
                          {report.summary ? ` • ${report.summary}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 text-[10px]">
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground/80 italic text-xs">
                  No diagnostic laboratory reports available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Historical Medical Documents */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Medical Documents & Uploads ({history.medicalRecords.length})
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-1 text-xs">
              {history.medicalRecords.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {history.medicalRecords.map((rec) => (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{rec.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {rec.recordType} • {new Date(rec.recordDate).toLocaleDateString('en-IN')} • {rec.source}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground/80 italic text-xs">
                  No medical documents attached
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
