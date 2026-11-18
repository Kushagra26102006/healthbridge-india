'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PrescriptionBuilder,
  PrescriptionBuilderSkeleton,
} from '@/components/doctor/prescriptions';
import {
  useMedicationCatalog,
  useDoctorPrescriptionActions,
  useDoctorEncounterDetail,
} from '@/features/doctor/hooks/use-doctor';
import { useClinicalActionFeedback } from '@/components/motion';

function NewPrescriptionContent() {
  const searchParams = useSearchParams();
  const encounterIdParam = searchParams.get('encounterId') || undefined;
  const patientIdParam = searchParams.get('patientId') || undefined;
  const patientNameParam = searchParams.get('patientName') || undefined;

  // If encounterId was passed, load encounter details to get verified patient
  const { encounter } = useDoctorEncounterDetail(encounterIdParam);

  const resolvedPatientId = encounter?.patientId || patientIdParam || '';
  const resolvedPatientName = encounter?.patientName || patientNameParam || 'Authorized Patient';
  const resolvedEncounterRef = encounter?.encounterReference;
  const resolvedDiagnosis = encounter?.primaryDiagnosis;

  // Catalog search state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDosageForm, setCatalogDosageForm] = useState('ALL');

  const { catalog, isLoading: isCatalogLoading } = useMedicationCatalog({
    search: catalogSearch || undefined,
    dosageForm: catalogDosageForm !== 'ALL' ? catalogDosageForm : undefined,
    limit: 20,
  });

  const {
    createPrescription,
    isCreating,
    issuePrescription,
    isIssuing,
  } = useDoctorPrescriptionActions();
  const feedback = useClinicalActionFeedback();

  const handleSaveDraft = async (data: any) => {
    try {
      const saved = await createPrescription({
        ...data,
        isDraft: true,
      });
      feedback.notifyPrescriptionSaved(saved?.prescriptionNumber);
      return saved;
    } catch (err) {
      feedback.notifyOperationError(
        'Failed to save prescription draft',
        err instanceof Error ? err.message : undefined
      );
      throw err;
    }
  };

  const handleIssue = async (prescriptionId: string, notes?: string) => {
    try {
      const issued = await issuePrescription({
        prescriptionId,
        data: {
          confirmAttribution: true,
          notes,
        },
      });
      feedback.notifyPrescriptionSaved(issued?.prescriptionNumber);
      return issued;
    } catch (err) {
      feedback.notifyOperationError(
        'Failed to issue prescription',
        err instanceof Error ? err.message : undefined
      );
      throw err;
    }
  };

  return (
    <PrescriptionBuilder
      defaultPatientId={resolvedPatientId}
      defaultPatientName={resolvedPatientName}
      defaultEncounterId={encounterIdParam}
      defaultEncounterRef={resolvedEncounterRef}
      defaultDiagnosis={resolvedDiagnosis}
      catalogItems={catalog}
      isCatalogLoading={isCatalogLoading}
      onSearchCatalog={(search, form) => {
        setCatalogSearch(search);
        setCatalogDosageForm(form);
      }}
      onSaveDraft={handleSaveDraft}
      onIssue={handleIssue}
      isSavingDraft={isCreating}
      isIssuing={isIssuing}
    />
  );
}

export default function DoctorNewPrescriptionPage() {
  return (
    <Suspense fallback={<PrescriptionBuilderSkeleton />}>
      <NewPrescriptionContent />
    </Suspense>
  );
}