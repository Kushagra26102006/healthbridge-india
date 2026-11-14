'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  IndianRupee,
  Video,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoctorProfile } from '@/features/doctor/hooks/use-doctor';
import type { UpdateDoctorProfileDto } from '@healthbridge/shared-types';

const AVAILABLE_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
];

export default function DoctorProfilePage() {
  const { profile, isLoading, isError, updateProfile, isUpdating } = useDoctorProfile();

  const [bio, setBio] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(500);
  const [languages, setLanguages] = useState<string[]>(['English', 'Hindi']);
  const [consultationModes, setConsultationModes] = useState<('IN_PERSON' | 'TELECONSULTATION')[]>([
    'IN_PERSON',
    'TELECONSULTATION',
  ]);
  const [workingDays, setWorkingDays] = useState<string[]>([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ]);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setConsultationFee(profile.consultationFee ?? 500);
      if (profile.languages?.length) {
        setLanguages(profile.languages);
      }
      if (profile.consultationModes?.length) {
        setConsultationModes(profile.consultationModes);
      }
      if (profile.workingDays?.length) {
        setWorkingDays(profile.workingDays);
      }
      if (profile.workingHours) {
        setWorkingHoursStart(profile.workingHours.start || '09:00');
        setWorkingHoursEnd(profile.workingHours.end || '17:00');
      }
    }
  }, [profile]);

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleMode = (mode: 'IN_PERSON' | 'TELECONSULTATION') => {
    setConsultationModes((prev) =>
      prev.includes(mode)
        ? prev.length > 1
          ? prev.filter((m) => m !== mode)
          : prev
        : [...prev, mode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: UpdateDoctorProfileDto = {
        bio,
        consultationFee: Number(consultationFee),
        languages,
        consultationModes,
        workingDays,
        workingHours: {
          start: workingHoursStart,
          end: workingHoursEnd,
        },
      };

      await updateProfile(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update professional profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/60" />
        <div className="h-64 rounded-2xl bg-muted/40" />
        <div className="h-96 rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-12 text-center space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-semibold text-foreground">
          Unable to load doctor profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl">
      {/* 1. Profile Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'DR'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Dr. {profile.name}
              </h1>
              {profile.verificationStatus === 'VERIFIED' ? (
                <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs px-2.5 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  ABDM Verified Clinician
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                  Pending Verification
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span>{profile.email}</span>
              <span>•</span>
              <span>{profile.phone}</span>
              <span>•</span>
              <span>{profile.experience || 5}+ Years of Clinical Practice</span>
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:pl-6 border-border/80">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            National Doctor Registry (HPR)
          </span>
          <span className="text-xs font-mono font-semibold text-foreground">
            {profile.registrationNumber || 'MCI-PENDING'}
          </span>
        </div>
      </div>

      {/* Success / Error Messages */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
          Professional profile updated successfully!
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* 2. Read-Only Verified Credentials Section */}
      <Card className="border border-border/80 bg-muted/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Verified Medical Credentials (Protected)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] flex items-center gap-1 border-muted-foreground/30">
              <Lock className="h-3 w-3" />
              Locked by Medical Council
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            These credentials are independently verified with state medical councils and National Health Authority ABDM. To update them, please submit official re-verification documents.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Registration Number
            </span>
            <span className="font-mono font-bold text-foreground block">
              {profile.registrationNumber || 'MCI-PENDING'}
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400">Verified by MCI / NMC</span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Specialization
            </span>
            <span className="font-bold text-foreground block truncate">
              {profile.specialization?.join(', ') || 'General Medicine'}
            </span>
            <span className="text-[10px] text-muted-foreground">Board Certified</span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Qualifications
            </span>
            <span className="font-bold text-foreground block truncate">
              {profile.qualifications?.join(', ') || 'MBBS'}
            </span>
            <span className="text-[10px] text-muted-foreground">Accredited Degrees</span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/80 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Affiliated Facility
            </span>
            <span className="font-bold text-foreground block truncate">
              {profile.facility?.name || 'AIIMS New Delhi — Main Hospital'}
            </span>
            <span className="text-[10px] text-muted-foreground">Credentialed Hospital</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Permitted Editable Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Practice Profile & Clinical Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Configure your clinical bio, consultation fee, languages, and consultation delivery channels.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 text-xs">
            {/* Bio */}
            <div className="space-y-1.5">
              <label htmlFor="bio-input" className="font-bold text-foreground block">
                Professional Bio & Clinical Philosophy
              </label>
              <textarea
                id="bio-input"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your clinical background, areas of sub-specialty interest, and patient care philosophy..."
                className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                Displayed to patients during doctor discovery and appointment booking.
              </p>
            </div>

            {/* Consultation Fee & Modes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Consultation Fee */}
              <div className="space-y-1.5">
                <label htmlFor="fee-input" className="font-bold text-foreground block">
                  Consultation Fee (₹ INR)
                </label>
                <div className="relative">
                  <IndianRupee className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    id="fee-input"
                    type="number"
                    min={0}
                    step={50}
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Standard consultation charge per slot.</p>
              </div>

              {/* Consultation Modes */}
              <div className="space-y-1.5">
                <span className="font-bold text-foreground block">Supported Consultation Modes</span>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={consultationModes.includes('IN_PERSON')}
                      onChange={() => toggleMode('IN_PERSON')}
                      className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    In-Person Hospital Visit
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={consultationModes.includes('TELECONSULTATION')}
                      onChange={() => toggleMode('TELECONSULTATION')}
                      className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <Video className="h-3.5 w-3.5 text-indigo-600" />
                    Teleconsultation (ABDM UHI)
                  </label>
                </div>
              </div>
            </div>

            {/* Languages Spoken */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-foreground block">Languages Spoken for Consultations</span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const selected = languages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selected
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Availability & Working Hours Section */}
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Weekly Clinical Availability & Schedule
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Configure which days of the week you accept patient consultations and default hours.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 text-xs">
            {/* Working Days */}
            <div className="space-y-2">
              <span className="font-bold text-foreground block">Active Consultation Days</span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_DAYS.map((day) => {
                  const selected = workingDays.includes(day);
                  const label = day.charAt(0) + day.slice(1, 3).toLowerCase();

                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        selected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working Hours Time Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="start-time-input" className="font-bold text-foreground block">
                  Daily Start Time
                </label>
                <input
                  id="start-time-input"
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="end-time-input" className="font-bold text-foreground block">
                  Daily End Time
                </label>
                <input
                  id="end-time-input"
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 px-6 shadow-md shadow-blue-500/20"
          >
            <Save className="h-4 w-4" />
            {isUpdating ? 'Saving Profile...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
