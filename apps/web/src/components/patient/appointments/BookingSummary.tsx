'use client';

import React from 'react';
import {
  Calendar,
  Building2,
  Video,
  Users,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DoctorPublicDto, ConsultationType, TimeSlotDto } from '@healthbridge/shared-types';

export interface BookingSummaryProps {
  doctor: DoctorPublicDto;
  consultationType: ConsultationType;
  selectedDate: string; // YYYY-MM-DD
  selectedSlot: TimeSlotDto;
  reason: string;
  notes?: string;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  doctor,
  consultationType,
  selectedDate,
  selectedSlot,
  reason,
  notes,
  onConfirm,
  onBack,
  isSubmitting = false,
}) => {
  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left space-y-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Review & Confirm Consultation
        </h3>
        <p className="text-xs text-slate-500">
          Please verify appointment details and clinical reason before confirming reservation.
        </p>
      </div>

      <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
        {/* Doctor and Facility Header */}
        <div className="flex items-start space-x-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
            {doctor.name
              .replace('Dr. ', '')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {doctor.name}
              </span>
              <ShieldCheck className="h-4 w-4 text-teal-600 flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-500 truncate">
              {doctor.specialization.join(', ')} • {doctor.experience} yrs exp
            </p>
            {doctor.facility && (
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="truncate">
                  {doctor.facility.name}
                  {doctor.facility.address?.city ? `, ${doctor.facility.address.city}` : ''}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Consultation Mode Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              <span>Date & Time</span>
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formattedDate}
            </p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
              {selectedSlot.time} (IST)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              {consultationType === 'IN_PERSON' ? (
                <Users className="h-3.5 w-3.5 text-teal-600" />
              ) : (
                <Video className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>Consultation Mode</span>
            </span>
            <div className="pt-0.5">
              {consultationType === 'IN_PERSON' ? (
                <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs">
                  In-Person Clinic Visit
                </Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs">
                  Secure Teleconsultation
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              {consultationType === 'IN_PERSON'
                ? doctor.facility?.address?.line1 || 'Visit the clinic reception 10 mins prior.'
                : 'Encrypted video call link will be provided in dashboard.'}
            </p>
          </div>
        </div>

        {/* Clinical Reason & Notes */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span>Reason for Consultation</span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {reason}
          </p>

          {notes && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic pl-1">
              Notes: {notes}
            </div>
          )}
        </div>

        {/* Cancellation & Concurrency Notice */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            Free cancellation or rescheduling is permitted up to 2 hours prior to the appointment.
            Slot reservations are held atomically upon confirmation.
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-slate-200 dark:border-slate-800 text-xs h-10 px-4 rounded-xl"
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-10 px-6 rounded-xl font-medium shadow-sm flex items-center space-x-2"
        >
          {isSubmitting ? (
            <span>Reserving Slot...</span>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Book Appointment</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
