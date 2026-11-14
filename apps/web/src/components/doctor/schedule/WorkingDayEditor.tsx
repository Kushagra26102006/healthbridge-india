'use client';

import React from 'react';
import { Video, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeIntervalEditor } from './TimeIntervalEditor';
import type { DayScheduleDto } from '@healthbridge/shared-types';

interface WorkingDayEditorProps {
  dayConfig: DayScheduleDto;
  onChange: (updated: DayScheduleDto) => void;
}

const DURATIONS = [15, 20, 30, 45, 60];
const BUFFERS = [0, 5, 10, 15];

export function WorkingDayEditor({ dayConfig, onChange }: WorkingDayEditorProps) {
  const toggleEnabled = () => {
    const isNowEnabled = !dayConfig.isEnabled;
    onChange({
      ...dayConfig,
      isEnabled: isNowEnabled,
      workingWindows: isNowEnabled && dayConfig.workingWindows.length === 0
        ? [{ start: '09:00', end: '17:00' }]
        : dayConfig.workingWindows,
    });
  };

  const toggleMode = (mode: 'IN_PERSON' | 'TELECONSULTATION') => {
    const modes = dayConfig.consultationModes || ['IN_PERSON'];
    const exists = modes.includes(mode);
    if (exists && modes.length === 1) return; // Keep at least one mode
    const updated = exists ? modes.filter((m) => m !== mode) : [...modes, mode];
    onChange({ ...dayConfig, consultationModes: updated });
  };

  return (
    <Card
      className={`border transition-all ${
        dayConfig.isEnabled
          ? 'border-border/80 bg-card shadow-sm'
          : 'border-border/40 bg-muted/20 opacity-80'
      }`}
    >
      <div className="p-4 space-y-4">
        {/* Day Header & Status Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              size="sm"
              variant={dayConfig.isEnabled ? 'default' : 'outline'}
              onClick={toggleEnabled}
              className={`h-7 px-2.5 text-xs font-bold gap-1.5 ${
                dayConfig.isEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-muted-foreground'
              }`}
            >
              {dayConfig.isEnabled ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Working
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Day Off
                </>
              )}
            </Button>
            <h3 className="text-sm font-extrabold text-foreground capitalize">
              {dayConfig.day.toLowerCase()}
            </h3>
          </div>

          {/* Quick Consultation Settings (Duration & Buffer) */}
          {dayConfig.isEnabled && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Duration selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Slot:</span>
                <select
                  value={dayConfig.slotDurationMinutes || 30}
                  onChange={(e) =>
                    onChange({ ...dayConfig, slotDurationMinutes: Number(e.target.value) })
                  }
                  className="h-7 text-xs rounded border border-border bg-background px-1.5 font-medium"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} mins
                    </option>
                  ))}
                </select>
              </div>

              {/* Buffer selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Buffer:</span>
                <select
                  value={dayConfig.bufferMinutes !== undefined ? dayConfig.bufferMinutes : 5}
                  onChange={(e) =>
                    onChange({ ...dayConfig, bufferMinutes: Number(e.target.value) })
                  }
                  className="h-7 text-xs rounded border border-border bg-background px-1.5 font-medium"
                >
                  {BUFFERS.map((b) => (
                    <option key={b} value={b}>
                      {b} mins
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultation Modes */}
              <div className="flex items-center gap-1 border-l border-border/60 pl-2">
                <Button
                  type="button"
                  size="sm"
                  variant={dayConfig.consultationModes.includes('IN_PERSON') ? 'secondary' : 'ghost'}
                  onClick={() => toggleMode('IN_PERSON')}
                  className={`h-6 px-1.5 text-[10px] gap-1 ${
                    dayConfig.consultationModes.includes('IN_PERSON')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  <MapPin className="h-3 w-3" /> Clinic
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={dayConfig.consultationModes.includes('TELECONSULTATION') ? 'secondary' : 'ghost'}
                  onClick={() => toggleMode('TELECONSULTATION')}
                  className={`h-6 px-1.5 text-[10px] gap-1 ${
                    dayConfig.consultationModes.includes('TELECONSULTATION')
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Video className="h-3 w-3" /> Video
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Working Windows & Breaks Editors */}
        {dayConfig.isEnabled ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Working Windows */}
            <TimeIntervalEditor
              label="Working Hours"
              type="WINDOW"
              items={dayConfig.workingWindows}
              onChange={(windows) =>
                onChange({ ...dayConfig, workingWindows: windows as any })
              }
            />

            {/* Breaks */}
            <TimeIntervalEditor
              label="Break Periods"
              type="BREAK"
              items={dayConfig.breaks}
              onChange={(breaks) =>
                onChange({ ...dayConfig, breaks: breaks as any })
              }
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-1">
            Clinic closed on {dayConfig.day.toLowerCase()}s. No appointments will be scheduled.
          </p>
        )}
      </div>
    </Card>
  );
}

export default WorkingDayEditor;
