'use client';

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export interface AppointmentCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  daysHorizon?: number;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onDateSelect,
  daysHorizon = 14,
}) => {
  // Generate upcoming days starting from tomorrow or today
  const days = React.useMemo(() => {
    const list: Array<{
      dateString: string;
      dayOfWeek: string;
      dayOfMonth: number;
      monthName: string;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    const now = new Date();

    for (let i = 0; i < daysHorizon; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateString = d.toISOString().split('T')[0]!;
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOfMonth = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const isToday = i === 0;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      list.push({
        dateString,
        dayOfWeek,
        dayOfMonth,
        monthName,
        isToday,
        isWeekend,
      });
    }

    return list;
  }, [daysHorizon]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-800 dark:text-slate-200">
          <CalendarIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>Select Consultation Date</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Next {daysHorizon} days available
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {days.map((item) => {
          const isSelected = selectedDate === item.dateString;

          return (
            <button
              key={item.dateString}
              type="button"
              onClick={() => onDateSelect(item.dateString)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all duration-150 p-2 text-center ${
                isSelected
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:hover:border-teal-600'
              }`}
            >
              <span
                className={`text-[11px] font-semibold tracking-wider uppercase ${
                  isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.dayOfWeek}
              </span>

              <span className="text-lg font-bold my-0.5 leading-none">
                {item.dayOfMonth}
              </span>

              <span
                className={`text-[10px] ${
                  isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.monthName}
              </span>

              {item.isToday && (
                <span
                  className={`mt-1 text-[9px] px-1 rounded-sm uppercase tracking-wider font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                  }`}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
