'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCancelAppointment } from '@/features/appointments/hooks/use-appointments';
import type { AppointmentDetailDto } from '@healthbridge/shared-types';

export interface CancelAppointmentDialogProps {
  isOpen: boolean;
  appointment: AppointmentDetailDto | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  'Personal or family emergency',
  'Feeling better / Symptoms resolved',
  'Scheduling conflict with work or travel',
  'Doctor or clinic requested reschedule',
  'Consulted another healthcare practitioner',
  'Other (specify below)',
];

export const CancelAppointmentDialog: React.FC<CancelAppointmentDialogProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]!);
  const [customReason, setCustomReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cancelMutation = useCancelAppointment();

  if (!isOpen || !appointment) return null;

  const finalReason =
    selectedReason === 'Other (specify below)' ? customReason.trim() : selectedReason;

  const isValid = finalReason.length >= 5;

  const handleConfirmCancel = async () => {
    if (!isValid) {
      setErrorMessage('Please provide a valid cancellation reason (min 5 characters).');
      return;
    }

    setErrorMessage(null);

    try {
      await cancelMutation.mutateAsync({
        appointmentId: appointment.id,
        payload: { reason: finalReason },
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          'Failed to cancel appointment. Please try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Cancel Appointment
              </h3>
              <p className="text-xs text-slate-500">
                Release scheduled consultation slot
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

        {/* Appointment summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {appointment.doctorName}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            {new Date(appointment.scheduledAt).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            at {appointment.startTime} (IST)
          </p>
        </div>

        {/* Reason Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Cancellation Reason *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {selectedReason === 'Other (specify below)' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              placeholder="Please explain the reason for cancellation..."
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          )}
        </div>

        {/* Policy Warning */}
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <p>
            Once cancelled, this time slot will immediately be made available to other patients.
            This action cannot be undone.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={cancelMutation.isPending}
            className="text-xs h-9 px-4 rounded-xl"
          >
            Keep Appointment
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmCancel}
            disabled={!isValid || cancelMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 px-4 rounded-xl font-medium"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </div>
  );
};
