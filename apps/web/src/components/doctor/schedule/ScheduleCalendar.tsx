'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDoctorScheduleCalendar } from '@/features/doctor/hooks/use-doctor';
import { ScheduleDayView } from './ScheduleDayView';
import { ScheduleWeekView } from './ScheduleWeekView';
import { ScheduleMonthView } from './ScheduleMonthView';
import { ScheduleOverrideDialog } from './ScheduleOverrideDialog';
import { ScheduleSkeleton } from './ScheduleSkeleton';

export function ScheduleCalendar() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]!);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const { calendar, isLoading, isError, error, refetch } = useDoctorScheduleCalendar({
    view,
    date: selectedDate,
  });

  const handlePrev = () => {
    const d = new Date(`${selectedDate}T12:00:00.000Z`);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d.toISOString().split('T')[0]!);
  };

  const handleNext = () => {
    const d = new Date(`${selectedDate}T12:00:00.000Z`);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDate(d.toISOString().split('T')[0]!);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]!);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Navigation & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-border/80 bg-card shadow-sm">
        {/* Date Selector & Prev/Next */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToday}
            className="text-xs h-8 px-2.5 font-bold"
          >
            Today
          </Button>

          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrev}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 pl-1 font-bold text-xs text-foreground">
            <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-7 text-xs bg-transparent border-none font-bold text-foreground focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* View Switcher & Special Day Button */}
        <div className="flex items-center gap-2">
          {/* View switcher pills */}
          <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/30">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  view === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setShowOverrideModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" /> Special Override
          </Button>
        </div>
      </div>

      {/* Calendar Body */}
      {isLoading ? (
        <ScheduleSkeleton />
      ) : isError || !calendar ? (
        <Card className="p-8 text-center border-dashed border-border/80">
          <p className="text-sm font-semibold text-destructive">Failed to load calendar view</p>
          <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4 text-xs">
            Retry
          </Button>
        </Card>
      ) : (
        <Card className="p-4 border border-border/80 bg-card shadow-sm">
          {view === 'day' && (
            <ScheduleDayView
              items={calendar.items}
              selectedDate={selectedDate}
            />
          )}

          {view === 'week' && (
            <ScheduleWeekView
              items={calendar.items}
              startDate={calendar.startDate}
              endDate={calendar.endDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setView('day');
              }}
            />
          )}

          {view === 'month' && (
            <ScheduleMonthView
              items={calendar.items}
              baseDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setView('day');
              }}
            />
          )}
        </Card>
      )}

      {/* Special Day Override Modal */}
      <ScheduleOverrideDialog
        open={showOverrideModal}
        onOpenChange={setShowOverrideModal}
      />
    </div>
  );
}

export default ScheduleCalendar;
