'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  PrescriptionDetails,
  PrescriptionDetailsSkeleton,
} from '@/components/doctor/prescriptions';
import {
  useDoctorPrescriptionDetail,
  useDoctorPrescriptionActions,
} from '@/features/doctor/hooks/use-doctor';

export default function DoctorPrescriptionDetailPage() {
  const params = useParams();
  const prescriptionId = params.prescriptionId as string;

  const {
    prescription,
    isLoading,
    isError,
    error,
  } = useDoctorPrescriptionDetail(prescriptionId);

  const {
    discontinuePrescription,
    isDiscontinuing,
  } = useDoctorPrescriptionActions();

  const handleDiscontinue = async (reason: string) => {
    await discontinuePrescription({
      prescriptionId,
      data: { reason },
    });
  };

  if (isLoading) {
    return <PrescriptionDetailsSkeleton />;
  }

  if (isError || !prescription) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-3 max-w-lg mx-auto my-8">
        <h3 className="text-sm font-bold text-foreground">Prescription Not Found</h3>
        <p className="text-xs text-muted-foreground">
          {error?.message || 'The requested prescription record does not exist or you lack authorization to view it.'}
        </p>
      </div>
    );
  }

  return (
    <PrescriptionDetails
      prescription={prescription}
      onDiscontinue={handleDiscontinue}
      isDiscontinuing={isDiscontinuing}
    />
  );
}