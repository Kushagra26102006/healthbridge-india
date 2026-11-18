'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useInteractionPreferences } from '@/lib/motion/preferences';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { fadeIn } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

/**
 * Healthcare-specific interaction feedback helpers.
 * IMPORTANT: Only invoke these callbacks AFTER the corresponding backend mutation succeeds or fails.
 * Never call success feedback optimistically prior to backend confirmation.
 */
export function useClinicalActionFeedback() {
  const { toast } = useToast();
  const { triggerFeedback } = useInteractionPreferences();

  return React.useMemo(
    () => ({
      notifyAppointmentBooked(details?: { doctorName?: string; scheduledLabel?: string }) {
        triggerFeedback('success');
        toast({
          variant: 'success',
          title: 'Appointment Confirmed',
          description: details?.doctorName
            ? `Scheduled with ${details.doctorName}${details.scheduledLabel ? ` (${details.scheduledLabel})` : ''}.`
            : 'Your appointment request has been recorded.',
        });
      },

      notifyPrescriptionSaved(prescriptionNumber?: string) {
        triggerFeedback('success');
        toast({
          variant: 'success',
          title: 'Prescription Saved',
          description: prescriptionNumber
            ? `e-Prescription ${prescriptionNumber} has been issued and stored.`
            : 'Prescription has been saved to the clinical record.',
        });
      },

      notifyConsentApproved(organization?: string) {
        triggerFeedback('confirm');
        toast({
          variant: 'success',
          title: 'Consent Approved',
          description: organization
            ? `Authorized scoped record access for ${organization}.`
            : 'Consent artefact has been granted.',
        });
      },

      notifyConsentRevoked(organization?: string) {
        triggerFeedback('confirm');
        toast({
          variant: 'warning',
          title: 'Consent Revoked',
          description: organization
            ? `Access permissions for ${organization} have been revoked immediately.`
            : 'Consent permission has been revoked.',
        });
      },

      notifyPharmacyStockUpdated(medicineName?: string) {
        triggerFeedback('success');
        toast({
          variant: 'success',
          title: 'Inventory Updated',
          description: medicineName
            ? `Stock ledger updated for ${medicineName}.`
            : 'Pharmacy inventory ledger has been updated.',
        });
      },

      notifyMedicineDispensed(dispensingRef?: string) {
        triggerFeedback('confirm');
        toast({
          variant: 'success',
          title: 'Medicine Dispensed',
          description: dispensingRef
            ? `Dispensing record ${dispensingRef} has been confirmed and logged.`
            : 'Prescription dispensing has been confirmed.',
        });
      },

      notifyLabReportSubmitted(reportNumber?: string) {
        triggerFeedback('confirm');
        toast({
          variant: 'success',
          title: 'Lab Report Submitted',
          description: reportNumber
            ? `Diagnostic report ${reportNumber} has been submitted for clinical verification.`
            : 'Diagnostic laboratory report has been submitted.',
        });
      },

      notifyLabReportReady(reportNumber?: string) {
        triggerFeedback('success');
        toast({
          variant: 'info',
          title: 'Lab Report Ready',
          description: reportNumber
            ? `Diagnostic report ${reportNumber} is ready for review.`
            : 'Diagnostic laboratory report is now available.',
        });
      },

      notifyOperationError(title: string, description?: string) {
        triggerFeedback('error');
        toast({
          variant: 'error',
          title,
          description: description || 'Please verify the details and try again.',
        });
      },
    }),
    [toast, triggerFeedback]
  );
}

/**
 * Smooth diagnostic report loading placeholder transition.
 */
export function LabReportLoadingState({
  label = 'Loading diagnostic report...',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <m.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col gap-5',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/10 text-secondary">
          <FlaskConical className="h-5 w-5 animate-pulse" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <Skeleton rounded="sm" className="h-3 w-44" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton rounded="md" className="h-16 w-full" />
        <Skeleton rounded="md" className="h-16 w-full" />
        <Skeleton rounded="md" className="h-16 w-full" />
      </div>
      <SkeletonText lines={4} />
    </m.div>
  );
}
