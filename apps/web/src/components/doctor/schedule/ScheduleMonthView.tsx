'use client';

import React from 'react';
import { ShieldBan, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalendarViewItemDto } from '@healthbridge/shared-types';

interface ScheduleMonthViewProps {
  items: CalendarViewItemDto[];
  baseDate: string;
  onSelectDate?: (date: string) => void;
}

export function ScheduleMonthView({
  items,
  baseDate,
  onSelectDate,
}: ScheduleMonthViewProps) {
  const current = new Date(`${baseDate}T12:00:00.000Z`);
  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon
  const totalDays = lastDayOfMonth.getDate();

  // Group items by date
  const itemsByDate = new Map<string, CalendarViewItemDto[]>();
  items.forEach((item) => {
    const list = itemsByDate.get(item.date) || [];
    list.push(item);
    itemsByDate.set(item.date, list);
  });

  const cells: Array<{ dayNum?: number; dateStr?: string }> = [];

  // Blank padding cells before day 1
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({});
  }

  // Days of the month
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0]!;
    cells.push({ dayNum: day, dateStr });
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-2">
      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-muted-foreground uppercase pb-1">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          if (!cell.dayNum || !cell.dateStr) {
            return (
              <div
                key={`blank-${idx}`}
                className="min-h-[80px] p-2 rounded-lg bg-muted/10 border border-transparent"
              />
            );
          }

          const dayItems = itemsByDate.get(cell.dateStr) || [];
          const apptCount = dayItems.filter((i) => i.type === 'APPOINTMENT').length;
          const isBlocked = dayItems.some((i) => i.type === 'BLOCKED');
          const isOverride = dayItems.some((i) => i.type === 'OVERRIDE');

          return (
            <Card
              key={cell.dateStr}
              onClick={() => onSelectDate?.(cell.dateStr!)}
              className="p-2 min-h-[85px] border border-border/80 bg-card hover:border-blue-500/50 hover:bg-muted/20 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground">{cell.dayNum}</span>
                {isBlocked && (
                  <ShieldBan className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                )}
                {isOverride && (
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div className="space-y-1 mt-1">
                {apptCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] w-full justify-center bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold"
                  >
                    {apptCount} Booked
                  </Badge>
                )}
                {isBlocked && (
                  <span className="text-[9px] text-amber-700 dark:text-amber-300 block truncate font-medium">
                    Leave
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduleMonthView;
