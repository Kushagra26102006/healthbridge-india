'use client';

import React from 'react';
import { Video, MapPin, ShieldBan, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { CalendarViewItemDto } from '@healthbridge/shared-types';

interface ScheduleWeekViewProps {
  items: CalendarViewItemDto[];
  startDate: string;
  endDate?: string;
  onSelectDate?: (date: string) => void;
}

export function ScheduleWeekView({
  items,
  startDate,
  endDate: _endDate,
  onSelectDate,
}: ScheduleWeekViewProps) {
  // Generate 7 days starting from startDate
  const days: Array<{ dateStr: string; dayName: string; dayNum: number }> = [];
  const start = new Date(`${startDate}T12:00:00.000Z`);

  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().split('T')[0]!;
    const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = current.getDate();
    days.push({ dateStr, dayName, dayNum });
  }

  // Group items by date
  const itemsByDate = new Map<string, CalendarViewItemDto[]>();
  items.forEach((item) => {
    const list = itemsByDate.get(item.date) || [];
    list.push(item);
    itemsByDate.set(item.date, list);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((d) => {
        const dayItems = itemsByDate.get(d.dateStr) || [];
        const appointments = dayItems.filter((i) => i.type === 'APPOINTMENT');
        const blocks = dayItems.filter((i) => i.type === 'BLOCKED');
        const overrides = dayItems.filter((i) => i.type === 'OVERRIDE');

        return (
          <Card
            key={d.dateStr}
            onClick={() => onSelectDate?.(d.dateStr)}
            className="p-3 border border-border/80 bg-card hover:border-blue-500/50 transition-all cursor-pointer flex flex-col min-h-[220px]"
          >
            {/* Day Header */}
            <div className="pb-2 mb-2 border-b border-border/40 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {d.dayName}
                </span>
                <div className="text-base font-black text-foreground">{d.dayNum}</div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/70">
                {d.dateStr.slice(5)}
              </span>
            </div>

            {/* Day Items List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56 scrollbar-none">
              {/* Block badges */}
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-[10px] text-amber-900 dark:text-amber-200 flex items-center gap-1 font-medium"
                >
                  <ShieldBan className="h-3 w-3 text-amber-600 shrink-0" />
                  <span className="truncate">{b.reason || 'Blocked'}</span>
                </div>
              ))}

              {/* Overrides */}
              {overrides.map((o) => (
                <div
                  key={o.id}
                  className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/40 text-[10px] text-blue-900 dark:text-blue-200 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3 text-blue-600 shrink-0" />
                  <span className="truncate">{o.reason || 'Special Hours'}</span>
                </div>
              ))}

              {/* Appointments */}
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-1.5 rounded bg-card border border-border text-[10px] space-y-0.5 hover:bg-muted/30"
                >
                  <div className="font-mono text-[9px] font-bold text-blue-600 dark:text-blue-400">
                    {apt.startTime}
                  </div>
                  <div className="font-bold text-foreground truncate flex items-center gap-1">
                    {apt.appointmentType === 'TELECONSULTATION' ? (
                      <Video className="h-2.5 w-2.5 text-teal-600 shrink-0" />
                    ) : (
                      <MapPin className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                    )}
                    <span className="truncate">{apt.patientMasked || 'Patient'}</span>
                  </div>
                </div>
              ))}

              {dayItems.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/60 italic pt-6">
                  No events
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default ScheduleWeekView;
