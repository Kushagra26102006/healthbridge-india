'use client';

import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentCalendar } from './AppointmentCalendar';
import { TimeSlotSelector } from './TimeSlotSelector';
import {
  useDoctorAvailability,
  useRescheduleAppointment,
} from '@/features/appointments/hooks/use-appointments';
import type { AppointmentDetailDto, TimeSlotDto } from '@healthbridge/shared-types';

export interface RescheduleAppointmentDialogProps {
  isOpen: boolean;
  appointment: AppointmentDetailDto | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RescheduleAppointmentDialog: React.FC<RescheduleAppointmentDialogProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  // Tomorrow as default date in YYYY-MM-DD
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0]!;
  }, []);

  const [newDate, setNewDate] = useState<string>(tomorrowStr);
  const [newSlot, setNewSlot] = useState<TimeSlotDto | null>(null);
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch real-time slots for the doctor on the new date
  const { slots, isLoading: isSlotsLoading } = useDoctorAvailability(
    appointment?.doctorId,
    newDate
  );

  const rescheduleMutation = useRescheduleAppointment();

  if (!isOpen || !appointment) return null;

  const handleConfirmReschedule = async () => {
    if (!newSlot) {
      setErrorMessage('Please select a new time slot.');
      return;
    }

    setErrorMessage(null);

    try {
      await rescheduleMutation.mutateAsync({
        appointmentId: appointment.id,
        payload: {
          newScheduledAt: newSlot.timestamp,
          newStartTime: newSlot.startTime,
          newEndTime: newSlot.endTime,
          reason: reason.trim() || undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMessage(
          'The newly selected time slot is already booked. Please choose another slot.'
        );
      } else {
        setErrorMessage(
          err.response?.data?.message ||
            err.message ||
            'Failed to reschedule appointment. Please try again.'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Reschedule Appointment
              </h3>
              <p className="text-xs text-slate-500">
                Select a new future date and time slot for {appointment.doctorName}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Schedule Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Current Schedule
          </span>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            {new Date(appointment.scheduledAt).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            at {appointment.startTime} (IST)
          </p>
        </div>

        {/* Date Selector */}
        <AppointmentCalendar
          selectedDate={newDate}
          onDateSelect={(date) => {
            setNewDate(date);
            setNewSlot(null);
          }}
        />

        {/* Slot Selector */}
        <TimeSlotSelector
          slots={slots}
          selectedSlot={newSlot}
          onSlotSelect={setNewSlot}
          isLoading={isSlotsLoading}
        />

        {/* Reason for rescheduling */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Reason for Rescheduling (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Schedule clash, doctor requested new time..."
            className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={rescheduleMutation.isPending}
            className="text-xs h-9 px-4 rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmReschedule}
            disabled={!newSlot || rescheduleMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl font-medium"
          >
            {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm New Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
};
