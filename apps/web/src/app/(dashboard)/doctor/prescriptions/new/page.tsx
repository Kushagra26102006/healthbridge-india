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

  const handleSaveDraft = async (data: any) => {
    return createPrescription({
      ...data,
      isDraft: true,
    });
  };

  const handleIssue = async (prescriptionId: string, notes?: string) => {
    return issuePrescription({
      prescriptionId,
      data: {
        confirmAttribution: true,
        notes,
      },
    });
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