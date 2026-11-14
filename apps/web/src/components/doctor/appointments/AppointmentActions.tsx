'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoctorAppointmentActions } from '@/features/doctor/hooks/use-doctor';
import type { AppointmentStatus } from '@healthbridge/shared-types';

export interface AppointmentActionsProps {
  appointmentId: string;
  status: AppointmentStatus;
  patientName?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export function AppointmentActions({
  appointmentId,
  status,
  patientName = 'Patient',
  onSuccess,
}: AppointmentActionsProps) {
  const {
    confirmAppointment,
    isConfirming,
    rejectAppointment,
    isRejecting,
    checkInPatient,
    isCheckingIn,
    startConsultation,
    isStarting,
    completeConsultation,
    isCompleting,
    cancelAppointment,
    isCancelling,
  } = useDoctorAppointmentActions();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isBusy =
    isConfirming || isRejecting || isCheckingIn || isStarting || isCompleting || isCancelling;

  const handleConfirm = async () => {
    try {
      await confirmAppointment(appointmentId);
      onSuccess?.();
    } catch {
      // Handled by react-query
    }
  };

  const handleReject = async () => {
    try {
      await rejectAppointment({ id: appointmentId, reason: rejectReason || undefined });
      setRejectModalOpen(false);
      setRejectReason('');
      onSuccess?.();
    } catch {
      // Handled by react-query
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkInPatient(appointmentId);
      onSuccess?.();
    } catch {
      // Handled by react-query
    }
  };

  const handleStart = async () => {
    try {
      await startConsultation(appointmentId);
      onSuccess?.();
    } catch {
      // Handled by react-query
    }
  };

  const handleComplete = async () => {
    try {
      await completeConsultation(appointmentId);
      onSuccess?.();
    } catch {
      // Handled by react-query
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      await cancelAppointment({ id: appointmentId, reason: cancelReason });
      setCancelModalOpen(false);
      setCancelReason('');
      onSuccess?.();
    } catch {
      // Handled by react-query
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* 1. REQUESTED state actions */}
      {status === 'REQUESTED' && (
        <>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isBusy}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1 h-7 sm:h-8"
          >
            {isConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Confirm
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setRejectModalOpen(true)}
            disabled={isBusy}
            className="text-destructive hover:bg-destructive/10 text-xs gap-1 h-7 sm:h-8"
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
        </>
      )}

      {/* 2. CONFIRMED state actions */}
      {status === 'CONFIRMED' && (
        <>
          <Button
            size="sm"
            onClick={handleCheckIn}
            disabled={isBusy}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1 h-7 sm:h-8"
          >
            {isCheckingIn ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
            Check In
          </Button>

          <Button
            size="sm"
            onClick={handleStart}
            disabled={isBusy}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 h-7 sm:h-8"
          >
            {isStarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Stethoscope className="h-3 w-3" />}
            Start
          </Button>
        </>
      )}

      {/* 3. CHECKED_IN state actions */}
      {status === 'CHECKED_IN' && (
        <Button
          size="sm"
          onClick={handleStart}
          disabled={isBusy}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-7 sm:h-8 font-semibold shadow-sm"
        >
          {isStarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
          Call In / Start
        </Button>
      )}

      {/* 4. IN_PROGRESS state actions */}
      {status === 'IN_PROGRESS' && (
        <Button
          size="sm"
          onClick={handleComplete}
          disabled={isBusy}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-7 sm:h-8 font-semibold shadow-sm"
        >
          {isCompleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Complete Consult
        </Button>
      )}

      {/* View Details Link */}
      <Button asChild size="sm" variant="ghost" className="text-xs h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground">
        <Link href={`/doctor/appointments/${appointmentId}`}>
          <Eye className="h-3.5 w-3.5 mr-1" />
          Details
        </Link>
      </Button>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card text-card-foreground border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Reject Consultation Request</h3>
                <p className="text-xs text-muted-foreground">Patient: {patientName}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label htmlFor="reject-reason" className="font-semibold text-foreground block">
                Reason for rejection (optional)
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Doctor is in emergency surgery, schedule full, etc."
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                disabled={isRejecting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting}
                className="text-xs"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card text-card-foreground border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <X className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Cancel Appointment</h3>
                <p className="text-xs text-muted-foreground">Patient: {patientName}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label htmlFor="cancel-reason" className="font-semibold text-foreground block">
                Reason for cancellation (required)
              </label>
              <textarea
                id="cancel-reason"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please state clinical or scheduling reason..."
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="text-xs"
              >
                Back
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="text-xs"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
