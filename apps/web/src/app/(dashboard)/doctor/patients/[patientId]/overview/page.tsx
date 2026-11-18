'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  UserCheck,
  Calendar,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  ShieldCheck,
  Lock,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import type { DoctorUnifiedPatientOverviewDto } from '@healthbridge/shared-types';
import { platformApi } from '@/features/platform/api/platform-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DoctorUnifiedPatientOverviewPage() {
  const params = useParams();
  const patientId = String(params?.patientId || '');

  const [overview, setOverview] = useState<DoctorUnifiedPatientOverviewDto | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await platformApi.getDoctorPatientOverview(patientId, {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setOverview(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Access denied or unable to load authorized patient clinical workspace.'
      );
    } finally {
      setLoading(false);
    }
  }, [patientId, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/doctor/patients"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Patients
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-teal-600" />
            Unified Patient Clinical Workspace
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Filter from date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs"
          />
          <input
            type="date"
            aria-label="Filter to date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-5 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
          Loading authorized unified patient clinical workspace...
        </div>
      ) : overview ? (
        <>
          {/* 1. Patient Identity & Consent Authorization Header */}
          <div className="rounded-xl border bg-card p-5 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">Patient Identity</p>
              <h2 className="text-lg font-bold">{overview.patient.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Internal ID: {overview.patient.authoritativePatientId}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                {overview.patient.gender && <Badge variant="outline">{overview.patient.gender}</Badge>}
                {overview.patient.bloodGroup && (
                  <Badge variant="outline">Blood: {overview.patient.bloodGroup}</Badge>
                )}
                <Badge
                  className={
                    overview.patient.externalAbha.linked
                      ? 'bg-emerald-100 text-emerald-800 border-none'
                      : 'bg-slate-100 text-slate-700 border-none'
                  }
                >
                  ABHA: {overview.patient.externalAbha.abhaAddress || overview.patient.externalAbha.verificationStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">Consent &amp; Access Policy</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge className="bg-blue-100 text-blue-800 border-none text-[11px]">
                  {overview.authorization.accessBasis}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  Internal Consents: {overview.authorization.activeInternalConsentsCount}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  ABDM Artefacts: {overview.authorization.activeAbdmArtefactsCount}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                Lab reports, pharmacy dispensing, and ABDM external imports are strictly read-only.
              </p>
            </div>

            {overview.patient.duplicateAccountReview.flaggedForReview && (
              <div className="rounded-lg border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold">Manual Identity Review Flag</p>
                <p className="mt-1">{overview.patient.duplicateAccountReview.note}</p>
              </div>
            )}
          </div>

          {/* 2. Clinical Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments */}
            <section className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                Appointments ({overview.appointments.length})
              </h3>
              {overview.appointments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No appointments in selected window.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {overview.appointments.map((apt) => (
                    <div key={apt.id} className="rounded-lg bg-muted/40 p-3 text-xs flex justify-between gap-2">
                      <div>
                        <div className="font-medium">{new Date(apt.scheduledAt).toLocaleString()}</div>
                        <div className="text-muted-foreground">{apt.reason || apt.facilityName || 'Consultation'}</div>
                      </div>
                      <Badge variant="outline" className="h-fit text-[10px]">{apt.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Encounters */}
            <section className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                Clinical Encounters ({overview.encounters.length})
              </h3>
              {overview.encounters.length === 0 ? (
                <p className="text-xs text-muted-foreground">No encounters recorded.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {overview.encounters.map((enc) => (
                    <div key={enc.id} className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">
                          {enc.encounterType} &bull; {new Date(enc.startTime).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {enc.isDraft ? 'DRAFT' : enc.status}
                        </Badge>
                      </div>
                      {enc.chiefComplaint && <p className="text-muted-foreground">{enc.chiefComplaint}</p>}
                      {enc.diagnoses.length > 0 && (
                        <p className="text-[11px] font-medium">
                          Diagnoses: {enc.diagnoses.map((d) => d.name).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Prescriptions + Read-Only Pharmacy Dispensing */}
            <section className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Pill className="h-4 w-4 text-amber-600" />
                Prescriptions &amp; Dispensing Status ({overview.prescriptions.length})
              </h3>
              {overview.prescriptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No issued prescriptions.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {overview.prescriptions.map((rx) => (
                    <div key={rx.id} className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{rx.medicationsSummary}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {rx.dispensingStatus}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Issued {new Date(rx.issuedAt).toLocaleDateString()} &bull; {rx.prescriptionNumber || rx.status}
                        {rx.dispensingPharmacyName ? ` • Dispensed by ${rx.dispensingPharmacyName} (Read-Only)` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Published / Amended Laboratory Reports (Read-Only) */}
            <section className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-teal-600" />
                Published Laboratory Reports — Read-Only ({overview.laboratoryReports.length})
              </h3>
              {overview.laboratoryReports.length === 0 ? (
                <p className="text-xs text-muted-foreground">No published laboratory reports available.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {overview.laboratoryReports.map((rep) => (
                    <div key={rep.id} className="rounded-lg bg-muted/40 p-3 text-xs flex justify-between gap-2">
                      <div>
                        <div className="font-medium">{rep.testName}</div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          {rep.reportNumber} &bull; v{rep.currentVersion} &bull; {new Date(rep.testDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 h-fit">
                        {rep.isAmended && (
                          <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">AMENDED</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">READ-ONLY</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Medical Documents & Medication History */}
            <section className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Medical Documents ({overview.medicalDocuments.length}) &amp; Medication History ({overview.medicationHistory.length})
              </h3>
              {overview.medicalDocuments.length === 0 && overview.medicationHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No medical documents or medication history recorded.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                  {overview.medicalDocuments.map((doc) => (
                    <div key={doc.id} className="rounded-lg bg-muted/40 p-2.5 flex justify-between gap-2">
                      <div>
                        <span className="font-medium">{doc.title}</span>{' '}
                        <span className="text-muted-foreground">({doc.recordType})</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{doc.source}</Badge>
                    </div>
                  ))}
                  {overview.medicationHistory.slice(0, 6).map((m, idx) => (
                    <div key={idx} className="rounded-lg border p-2.5 flex justify-between gap-2">
                      <div>
                        <span className="font-medium">{m.medicationName}</span> — {m.dosage}, {m.frequency} ({m.duration})
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{m.dispensingStatus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Authorized External ABDM Imported Records (Read-Only) */}
            <section className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Authorized ABDM External Records — Read-Only ({overview.externalAbdmRecords.length})
              </h3>
              {overview.externalAbdmRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No consent-authorized external ABDM records imported for this patient.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                  {overview.externalAbdmRecords.map((ext) => (
                    <div key={ext.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{ext.summary.title}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[10px]">{ext.hiType}</Badge>
                          {ext.isMocked && (
                            <Badge className="bg-purple-100 text-purple-800 border-none text-[10px]">
                              MOCKED
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {ext.sourceOrganizationName} &bull; Consent: <span className="font-mono">{ext.externalConsentId}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
