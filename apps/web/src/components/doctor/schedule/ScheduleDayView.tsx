'use client';

import React from 'react';
import {
  Clock,
  User,
  Video,
  MapPin,
  CheckCircle2,
  ShieldBan,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalendarViewItemDto } from '@healthbridge/shared-types';

interface ScheduleDayViewProps {
  items: CalendarViewItemDto[];
  selectedDate: string;
}

export function ScheduleDayView({ items, selectedDate }: ScheduleDayViewProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed rounded-xl border-border/80 p-8 space-y-2">
        <Clock className="h-8 w-8 text-muted-foreground/60 mx-auto" />
        <h4 className="text-xs font-bold text-foreground">No Schedule Activity on {selectedDate}</h4>
        <p className="text-[11px] text-muted-foreground">
          Clinic is closed, fully booked, or designated as a day off.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        if (item.type === 'APPOINTMENT') {
          const isTele = item.appointmentType === 'TELECONSULTATION';

          return (
            <Card
              key={item.id}
              className="p-3.5 border-l-4 border-l-blue-600 border-border/80 bg-card hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                    {isTele ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {item.patientMasked || 'Patient Consultation'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] uppercase tracking-wider font-semibold"
                      >
                        {item.status || 'CONFIRMED'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.reason || item.title}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-foreground">
                    {item.startTime} - {item.endTime}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {isTele ? 'Video Call' : 'In-Clinic'}
                  </span>
                </div>
              </div>
            </Card>
          );
        }

        if (item.type === 'SLOT') {
          return (
            <div
              key={item.id}
              className="p-2.5 rounded-lg border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Available Consultation Slot</span>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-teal-600/40 text-teal-700 dark:text-teal-300"
              >
                {item.startTime} - {item.endTime}
              </Badge>
            </div>
          );
        }

        if (item.type === 'BLOCKED') {
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200"
            >
              <div className="flex items-center gap-2 font-semibold">
                <ShieldBan className="h-4 w-4 text-amber-600" />
                <span>{item.title}</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-amber-600/40">
                {item.startTime} - {item.endTime}
              </Badge>
            </div>
          );
        }

        if (item.type === 'OVERRIDE') {
          return (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>{item.title}</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-blue-600/40">
                {item.startTime} - {item.endTime}
              </Badge>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default ScheduleDayView;
