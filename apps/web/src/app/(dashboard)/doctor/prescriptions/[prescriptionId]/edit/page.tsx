'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PrescriptionBuilder,
  PrescriptionBuilderSkeleton,
} from '@/components/doctor/prescriptions';
import {
  useDoctorPrescriptionDetail,
  useMedicationCatalog,
  useDoctorPrescriptionActions,
} from '@/features/doctor/hooks/use-doctor';

export default function DoctorEditPrescriptionDraftPage() {
  const params = useParams();
  const prescriptionId = params.prescriptionId as string;

  const {
    prescription,
    isLoading: isPrescriptionLoading,
    isError,
    error,
  } = useDoctorPrescriptionDetail(prescriptionId);

  // Catalog search state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDosageForm, setCatalogDosageForm] = useState('ALL');

  const { catalog, isLoading: isCatalogLoading } = useMedicationCatalog({
    search: catalogSearch || undefined,
    dosageForm: catalogDosageForm !== 'ALL' ? catalogDosageForm : undefined,
    limit: 20,
  });

  const {
    updatePrescription,
    isUpdating,
    issuePrescription,
    isIssuing,
  } = useDoctorPrescriptionActions();

  if (isPrescriptionLoading) {
    return <PrescriptionBuilderSkeleton />;
  }

  if (isError || !prescription) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-3 max-w-lg mx-auto my-8">
        <h3 className="text-sm font-bold text-foreground">Prescription Draft Not Found</h3>
        <p className="text-xs text-muted-foreground">
          {error?.message || 'The requested prescription record does not exist or you lack authorization.'}
        </p>
        <Link href="/doctor/prescriptions">
          <Button variant="outline" size="sm" className="text-xs">
            Back to Prescriptions
          </Button>
        </Link>
      </div>
    );
  }

  // Prevent modifying an already finalized/issued prescription
  if (!prescription.isDraft && prescription.status !== 'DRAFT') {
    return (
      <div className="py-12 px-4 text-center rounded-2xl border border-rose-500/30 bg-rose-50/10 text-rose-900 dark:text-rose-200 space-y-3 max-w-lg mx-auto my-8">
        <ShieldAlert className="h-8 w-8 mx-auto text-rose-600" />
        <h3 className="text-sm font-bold">Issued Prescriptions are Immutable</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          This prescription has already been finalized and sealed. To alter medication therapy, please discontinue this prescription or issue a new digital prescription.
        </p>
        <div className="pt-2">
          <Link href={`/doctor/prescriptions/${prescriptionId}`}>
            <Button size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white">
              View Prescription Details
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveDraft = async (data: any) => {
    return updatePrescription({
      prescriptionId,
      data: {
        ...data,
        isDraft: true,
      },
    });
  };

  const handleIssue = async (targetId: string, notes?: string) => {
    return issuePrescription({
      prescriptionId: targetId,
      data: {
        confirmAttribution: true,
        notes,
      },
    });
  };

  return (
    <PrescriptionBuilder
      initialPrescription={prescription}
      catalogItems={catalog}
      isCatalogLoading={isCatalogLoading}
      onSearchCatalog={(search, form) => {
        setCatalogSearch(search);
        setCatalogDosageForm(form);
      }}
      onSaveDraft={handleSaveDraft}
      onIssue={handleIssue}
      isSavingDraft={isUpdating}
      isIssuing={isIssuing}
    />
  );
}