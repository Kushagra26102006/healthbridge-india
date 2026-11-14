'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Video,
  MapPin,
  Calendar,
  Settings,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDoctorPracticeSettings,
  useDoctorScheduleFacilities,
} from '@/features/doctor/hooks/use-doctor';
import type { UpdateDoctorPracticeSettingsDto } from '@healthbridge/shared-types';

export function DoctorPracticeSettingsForm() {
  const {
    practiceSettings,
    isLoading,
    isError,
    error,
    updatePracticeSettings,
    isUpdating,
  } = useDoctorPracticeSettings();

  const { facilities } = useDoctorScheduleFacilities();

  const [facilityId, setFacilityId] = useState<string>('');
  const [consultationModes, setConsultationModes] = useState<('IN_PERSON' | 'TELECONSULTATION')[]>([
    'IN_PERSON',
    'TELECONSULTATION',
  ]);
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(30);
  const [bufferMinutes, setBufferMinutes] = useState<number>(5);
  const [autoConfirmAppointments, setAutoConfirmAppointments] = useState<boolean>(false);
  const [maxDailyPatients, setMaxDailyPatients] = useState<number>(30);
  const [teleconsultationLink, setTeleconsultationLink] = useState<string>('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (practiceSettings) {
      if (practiceSettings.facilityId) setFacilityId(practiceSettings.facilityId);
      if (practiceSettings.consultationModes) setConsultationModes(practiceSettings.consultationModes);
      if (practiceSettings.consultationFee !== undefined) setConsultationFee(practiceSettings.consultationFee);
      if (practiceSettings.slotDurationMinutes !== undefined) setSlotDurationMinutes(practiceSettings.slotDurationMinutes);
      if (practiceSettings.bufferMinutes !== undefined) setBufferMinutes(practiceSettings.bufferMinutes);
      if (practiceSettings.autoConfirmAppointments !== undefined) setAutoConfirmAppointments(practiceSettings.autoConfirmAppointments);
      if (practiceSettings.maxDailyPatients !== undefined) setMaxDailyPatients(practiceSettings.maxDailyPatients);
      if (practiceSettings.teleconsultationLink !== undefined) setTeleconsultationLink(practiceSettings.teleconsultationLink);
    }
  }, [practiceSettings]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-2xl bg-muted/60" />
        <div className="h-48 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (isError || !practiceSettings) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm font-semibold text-destructive">Failed to load practice settings</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error'}</p>
      </Card>
    );
  }

  const toggleMode = (mode: 'IN_PERSON' | 'TELECONSULTATION') => {
    if (consultationModes.includes(mode) && consultationModes.length === 1) {
      return; // Keep at least one
    }
    setConsultationModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (consultationFee < 0) {
      setSaveError('Consultation fee cannot be negative');
      return;
    }

    if (slotDurationMinutes < 10 || slotDurationMinutes > 120) {
      setSaveError('Slot duration must be between 10 and 120 minutes');
      return;
    }

    if (maxDailyPatients < 1 || maxDailyPatients > 200) {
      setSaveError('Maximum daily patients must be between 1 and 200');
      return;
    }

    try {
      const payload: UpdateDoctorPracticeSettingsDto = {
        facilityId: facilityId || undefined,
        consultationModes,
        consultationFee,
        slotDurationMinutes,
        bufferMinutes,
        autoConfirmAppointments,
        maxDailyPatients,
        teleconsultationLink: teleconsultationLink.trim() || undefined,
      };

      await updatePracticeSettings(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update practice settings');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl">
      {saveSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">
            Practice and consultation settings updated successfully!
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="font-semibold">{saveError}</div>
        </div>
      )}

      {/* Facility & Location Settings */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Associated Healthcare Facility & Location
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Designate your primary hospital, multi-specialty clinic, or health center
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Primary Practice Facility</label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select an affiliated facility</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} {fac.type ? `(${fac.type})` : ''} — {typeof fac.address === 'string' ? fac.address : 'India'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Only authorized healthcare institutions registered with the ABDM Health Facility Registry (HFR) are available.
            </p>
          </div>

          {practiceSettings.facilityAddress && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Facility Address: </span>
                {practiceSettings.facilityAddress.line1 ? `${practiceSettings.facilityAddress.line1}, ` : ''}
                {practiceSettings.facilityAddress.city}, {practiceSettings.facilityAddress.district},{' '}
                {practiceSettings.facilityAddress.state} – {practiceSettings.facilityAddress.postalCode}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultation & Scheduling Rules */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Consultation Configuration & Capacity
              </CardTitle>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs h-7 gap-1">
              <Link href="/doctor/schedule">
                <Calendar className="h-3 w-3" /> Edit Shifts & Breaks
              </Link>
            </Button>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Configure consultation fees, standard slot durations, and daily patient intake limits
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-5 text-xs">
          {/* Modes & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Consultation Fee (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="pl-8 text-xs h-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Applied by default to patient appointments.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Supported Consultation Modes</label>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={consultationModes.includes('IN_PERSON') ? 'default' : 'outline'}
                  onClick={() => toggleMode('IN_PERSON')}
                  className={`text-xs h-8 ${
                    consultationModes.includes('IN_PERSON') ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Clinic Visit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={consultationModes.includes('TELECONSULTATION') ? 'default' : 'outline'}
                  onClick={() => toggleMode('TELECONSULTATION')}
                  className={`text-xs h-8 ${
                    consultationModes.includes('TELECONSULTATION') ? 'bg-teal-600 text-white' : ''
                  }`}
                >
                  <Video className="h-3.5 w-3.5 mr-1" /> Teleconsultation
                </Button>
              </div>
            </div>
          </div>

          {/* Durations & Buffers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Slot Duration (Minutes)</label>
              <select
                value={slotDurationMinutes}
                onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[15, 20, 30, 45, 60].map((d) => (
                  <option key={d} value={d}>
                    {d} Minutes
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Buffer Between Slots (Minutes)</label>
              <select
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[0, 5, 10, 15].map((b) => (
                  <option key={b} value={b}>
                    {b} Minutes
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Max Daily Patients</label>
              <Input
                type="number"
                min={1}
                max={200}
                value={maxDailyPatients}
                onChange={(e) => setMaxDailyPatients(Number(e.target.value))}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Teleconsultation Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Dedicated Teleconsultation Meeting URL</label>
            <Input
              type="url"
              value={teleconsultationLink}
              onChange={(e) => setTeleconsultationLink(e.target.value)}
              placeholder="https://meet.google.com/... or custom secure video link"
              className="text-xs h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              Shared securely with confirmed patients for remote video consultations.
            </p>
          </div>

          {/* Auto-Confirm Appointments Toggle */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-foreground">Automatic Appointment Confirmation</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Automatically confirm patient bookings when open availability slots are selected without manual review.
              </p>
            </div>
            <input
              type="checkbox"
              id="auto-confirm"
              checked={autoConfirmAppointments}
              onChange={(e) => setAutoConfirmAppointments(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/60 py-3.5 px-6 flex justify-end bg-muted/10">
          <Button
            type="submit"
            size="sm"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isUpdating ? 'Saving Settings...' : 'Save Practice Settings'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default DoctorPracticeSettingsForm;
