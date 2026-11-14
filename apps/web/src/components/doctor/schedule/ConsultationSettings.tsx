'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Video,
  MapPin,
  Save,
  CheckCircle2,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDoctorSchedule } from '@/features/doctor/hooks/use-doctor';
import { FacilitySelector } from './FacilitySelector';
import { ScheduleSkeleton } from './ScheduleSkeleton';
import type { ConsultationTypeConfigDto } from '@healthbridge/shared-types';

const DURATIONS = [10, 15, 20, 30, 45, 60, 90];
const BUFFERS = [0, 5, 10, 15, 20];

export function ConsultationSettings() {
  const { schedule, isLoading, isError, error, refetch, updateSchedule, isUpdating } =
    useDoctorSchedule();

  const [consultationTypes, setConsultationTypes] = useState<ConsultationTypeConfigDto[]>([]);
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [facilityId, setFacilityId] = useState<string | undefined>(undefined);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (schedule) {
      if (schedule.consultationTypes && schedule.consultationTypes.length > 0) {
        setConsultationTypes(schedule.consultationTypes);
      }
      setTimezone(schedule.timezone || 'Asia/Kolkata');
      setFacilityId(schedule.facilityId);
      setIsDirty(false);
    }
  }, [schedule]);

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (isError || !schedule) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80">
        <p className="text-sm font-semibold text-destructive">Failed to load consultation settings</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error'}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4 text-xs">
          Retry
        </Button>
      </Card>
    );
  }

  const handleTypeToggle = (type: string) => {
    setConsultationTypes((prev) =>
      prev.map((c) => (c.type === type ? { ...c, isEnabled: !c.isEnabled } : c))
    );
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleDurationChange = (type: string, durationMinutes: number) => {
    setConsultationTypes((prev) =>
      prev.map((c) => (c.type === type ? { ...c, durationMinutes } : c))
    );
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleBufferChange = (type: string, bufferMinutes: number) => {
    setConsultationTypes((prev) =>
      prev.map((c) => (c.type === type ? { ...c, bufferMinutes } : c))
    );
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleFeeChange = (type: string, fee: number) => {
    setConsultationTypes((prev) =>
      prev.map((c) => (c.type === type ? { ...c, fee } : c))
    );
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      setErrorMessage(null);
      await updateSchedule({
        timezone,
        facilityId,
        weeklySchedule: schedule.weeklySchedule,
        consultationTypes,
      });

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            Consultation Configurations & Rules
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure consultation types, standard session durations, buffer intervals, and practice locations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => {
                if (schedule?.consultationTypes) {
                  setConsultationTypes(schedule.consultationTypes);
                }
                setFacilityId(schedule.facilityId);
                setIsDirty(false);
              }}
              className="text-xs h-8 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isUpdating ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">Consultation settings updated successfully!</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs">
          {errorMessage}
        </div>
      )}

      {/* Timezone Configuration */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            Scheduling Timezone
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            All appointment instants are stored in UTC and rendered according to this IANA timezone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                setIsDirty(true);
              }}
              className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2.5 font-medium"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (Indian Standard Time, UTC+05:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Facility Selection */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Practice Facility Association
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Select the primary medical facility where your in-person clinic hours take place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FacilitySelector
            selectedFacilityId={facilityId}
            onSelect={(id) => {
              setFacilityId(id);
              setIsDirty(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Consultation Types Editor */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Supported Consultation Types & Durations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {consultationTypes.map((ctype) => {
            const isOnline = ctype.type === 'TELECONSULTATION';

            return (
              <Card
                key={ctype.type}
                className={`border transition-all ${
                  ctype.isEnabled
                    ? 'border-border/80 bg-card shadow-sm'
                    : 'border-border/40 bg-muted/20 opacity-70'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                      {isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={ctype.isEnabled ? 'default' : 'outline'}
                      onClick={() => handleTypeToggle(ctype.type)}
                      className={`h-6 text-[10px] px-2 font-bold ${
                        ctype.isEnabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {ctype.isEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <CardTitle className="text-xs font-bold text-foreground mt-2">
                    {ctype.name}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground line-clamp-2">
                    {ctype.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Consultation Duration
                    </label>
                    <select
                      value={ctype.durationMinutes}
                      disabled={!ctype.isEnabled}
                      onChange={(e) =>
                        handleDurationChange(ctype.type, Number(e.target.value))
                      }
                      className="w-full h-7 text-xs rounded border border-border bg-background px-2 font-medium"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} minutes
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Buffer Interval (Rest/Notes)
                    </label>
                    <select
                      value={ctype.bufferMinutes}
                      disabled={!ctype.isEnabled}
                      onChange={(e) =>
                        handleBufferChange(ctype.type, Number(e.target.value))
                      }
                      className="w-full h-7 text-xs rounded border border-border bg-background px-2 font-medium"
                    >
                      {BUFFERS.map((b) => (
                        <option key={b} value={b}>
                          {b} minutes
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Consultation Fee (INR ₹)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      disabled={!ctype.isEnabled}
                      value={ctype.fee ?? 500}
                      onChange={(e) =>
                        handleFeeChange(ctype.type, Number(e.target.value))
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ConsultationSettings;
