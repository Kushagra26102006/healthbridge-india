'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Stethoscope,
  Loader2,
  AlertCircle,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useDoctorAppointments,
  useDoctorPatients,
  useDoctorEncounterActions,
} from '@/features/doctor/hooks/use-doctor';
import type { EncounterType } from '@healthbridge/shared-types';

export default function DoctorNewEncounterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedAppointmentId = searchParams.get('appointmentId');
  const preselectedPatientId = searchParams.get('patientId');

  const [entryMode, setEntryMode] = useState<'APPOINTMENT' | 'PATIENT'>(
    preselectedAppointmentId ? 'APPOINTMENT' : preselectedPatientId ? 'PATIENT' : 'APPOINTMENT'
  );

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    preselectedAppointmentId || ''
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preselectedPatientId || ''
  );
  const [encounterType, setEncounterType] = useState<EncounterType>('AMBULATORY');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Queries for appointments & assigned patients
  const { appointments, isLoading: isAptLoading } = useDoctorAppointments({
    page: 1,
    limit: 50,
    filterTab: 'today',
  });

  const { patients, isLoading: isPatientsLoading } = useDoctorPatients();
  const { createEncounter, isCreating } = useDoctorEncounterActions();

  // Valid appointments eligible to start encounter: CONFIRMED, CHECKED_IN, SCHEDULED, IN_PROGRESS
  const eligibleAppointments = appointments.filter(
    (apt) =>
      apt.status === 'CONFIRMED' ||
      apt.status === 'CHECKED_IN' ||
      apt.status === 'SCHEDULED' ||
      apt.status === 'IN_PROGRESS'
  );

  const handleStartEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    let patientId = selectedPatientId;
    let appointmentId: string | undefined = undefined;

    if (entryMode === 'APPOINTMENT') {
      if (!selectedAppointmentId) {
        setSubmissionError('Please select a scheduled appointment to start consultation.');
        return;
      }
      const apt = appointments.find((a) => a.id === selectedAppointmentId);
      if (!apt) {
        setSubmissionError('Selected appointment not found.');
        return;
      }
      patientId = apt.patientId;
      appointmentId = selectedAppointmentId;
    } else {
      if (!selectedPatientId) {
        setSubmissionError('Please select an authorized patient to start consultation.');
        return;
      }
    }

    try {
      const created = await createEncounter({
        patientId,
        appointmentId,
        encounterType,
        chiefComplaint: chiefComplaint.trim() || undefined,
      });

      router.push(`/doctor/encounters/${created.id}/edit`);
    } catch (err: any) {
      setSubmissionError(
        err?.message || 'Failed to start clinical encounter. Verify your clinical relationship or consent authorization.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/doctor/encounters">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Start Clinical Encounter
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Initialize an official consultation workspace for documenting clinical notes, observations, and care plans
          </p>
        </div>
      </div>

      <form onSubmit={handleStartEncounter} className="space-y-6">
        {/* Entry Point Selector */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground">
              Select Entry Point
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Start consultation either from today&apos;s scheduled appointment queue or from an authorized patient chart
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-1">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEntryMode('APPOINTMENT')}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
                  entryMode === 'APPOINTMENT'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600/30'
                    : 'border-border/70 hover:border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-xs text-foreground">From Appointment</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Linked to confirmed or checked-in clinic slot
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('PATIENT')}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition-all ${
                  entryMode === 'PATIENT'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600/30'
                    : 'border-border/70 hover:border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-teal-600" />
                  <span className="font-bold text-xs text-foreground">From Patient Record</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Direct consultation with verified consent
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Selection: Appointment vs Patient */}
        {entryMode === 'APPOINTMENT' ? (
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                Select Today&apos;s Appointment
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Only active appointments owned by you can be initiated
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-1 space-y-2">
              {isAptLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
                  Loading clinic queue...
                </div>
              ) : eligibleAppointments.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10 space-y-2">
                  <p>No confirmed or checked-in appointments found for today.</p>
                  <Button asChild size="sm" variant="outline" className="text-xs h-7">
                    <Link href="/doctor/appointments">View Full Appointment List</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {eligibleAppointments.map((apt) => {
                    const isSelected = selectedAppointmentId === apt.id;
                    return (
                      <div
                        key={apt.id}
                        onClick={() => {
                          setSelectedAppointmentId(apt.id);
                          if (apt.consultationType === 'TELECONSULTATION') {
                            setEncounterType('VIRTUAL');
                          }
                          if (apt.reason && !chiefComplaint) {
                            setChiefComplaint(apt.reason);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
                            : 'border-border/60 hover:border-border bg-card'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{apt.patientName}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                              {apt.status}
                            </Badge>
                            {apt.queueNumber && (
                              <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">
                                Token #{apt.queueNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {apt.startTime} - {apt.endTime} • {apt.reason}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[11px] text-muted-foreground block">
                            {apt.consultationType}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                Select Authorized Patient
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Patients with established clinical care or active ABDM electronic consent
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-1">
              {isPatientsLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
                  Loading authorized patients...
                </div>
              ) : patients.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl bg-muted/10">
                  No assigned patients on file. Patients must book an appointment or grant electronic consent.
                </div>
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} {p.phone ? `(${p.phone})` : ''} — {p.gender || 'Patient'}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>
        )}

        {/* Consultation Settings */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground">
              Consultation Parameters
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-1 text-xs">
            {/* Encounter Type */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                Care Setting / Encounter Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'AMBULATORY' as const, label: 'Ambulatory (Clinic)', icon: Building2 },
                  { id: 'VIRTUAL' as const, label: 'Virtual (Telehealth)', icon: Video },
                  { id: 'EMERGENCY' as const, label: 'Emergency', icon: Stethoscope },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = encounterType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEncounterType(type.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-foreground font-semibold'
                          : 'border-border/60 hover:border-border text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 text-blue-600" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presenting Complaint */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                Initial Chief Complaint (Optional)
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Follow-up for hypertension, fever for 3 days..."
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {submissionError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/doctor/encounters">Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 px-5 shadow-sm"
          >
            {isCreating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Stethoscope className="h-3.5 w-3.5" />
            )}
            Open Consultation Workspace
          </Button>
        </div>
      </form>
    </div>
  );
}
