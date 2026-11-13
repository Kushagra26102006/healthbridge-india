'use client';

import React from 'react';
import { Clock, Sun, Sunset, Moon, AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TimeSlotDto } from '@healthbridge/shared-types';

export interface TimeSlotSelectorProps {
  slots: TimeSlotDto[];
  selectedSlot: TimeSlotDto | null;
  onSlotSelect: (slot: TimeSlotDto) => void;
  isLoading?: boolean;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  isLoading = false,
}) => {
  // Group slots by time of day
  const groupedSlots = React.useMemo(() => {
    const morning: TimeSlotDto[] = [];
    const afternoon: TimeSlotDto[] = [];
    const evening: TimeSlotDto[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.startTime.split(':')[0] || '9', 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 16) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slots]);

  const availableCount = slots.filter((s) => s.isAvailable).length;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
        <AlertCircle className="h-6 w-6 text-slate-400 mx-auto" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No slots scheduled for this date
        </p>
        <p className="text-xs text-slate-500">
          Please select another date on the calendar to view available consultation slots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-800 dark:text-slate-200">
          <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>Available Time Slots (IST)</span>
        </div>
        <Badge
          variant="secondary"
          className="bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-medium"
        >
          {availableCount} slots available
        </Badge>
      </div>

      {/* Morning Slots */}
      {groupedSlots.morning.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Morning (09:00 AM – 12:00 PM)</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {groupedSlots.morning.map((slot) => {
              const isSelected = selectedSlot?.timestamp === slot.timestamp;
              return (
                <button
                  key={slot.timestamp}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => onSlotSelect(slot)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center transition-all ${
                    !slot.isAvailable
                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <span>{slot.time}</span>
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Afternoon Slots */}
      {groupedSlots.afternoon.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Sunset className="h-3.5 w-3.5 text-orange-500" />
            <span>Afternoon (12:00 PM – 04:00 PM)</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {groupedSlots.afternoon.map((slot) => {
              const isSelected = selectedSlot?.timestamp === slot.timestamp;
              return (
                <button
                  key={slot.timestamp}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => onSlotSelect(slot)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center transition-all ${
                    !slot.isAvailable
                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <span>{slot.time}</span>
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Evening Slots */}
      {groupedSlots.evening.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Moon className="h-3.5 w-3.5 text-indigo-500" />
            <span>Evening (04:00 PM – 06:00 PM)</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {groupedSlots.evening.map((slot) => {
              const isSelected = selectedSlot?.timestamp === slot.timestamp;
              return (
                <button
                  key={slot.timestamp}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => onSlotSelect(slot)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center transition-all ${
                    !slot.isAvailable
                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <span>{slot.time}</span>
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

