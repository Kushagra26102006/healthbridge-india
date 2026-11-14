'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill,
  Save,
  CheckCircle2,
  User,
  AlertCircle,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicationCatalogSearch } from './MedicationCatalogSearch';
import { MedicationCatalogResults } from './MedicationCatalogResults';
import { MedicationEntryForm } from './MedicationEntryForm';
import { MedicationListEditor } from './MedicationListEditor';
import { PrescriptionReview } from './PrescriptionReview';
import {
  MedicationCatalogItemDto,
  CreateMedicationInputDto,
  CreateDoctorPrescriptionDto,
  UpdateDoctorPrescriptionDto,
  PrescriptionDetailDto,
} from '@healthbridge/shared-types';

interface PrescriptionBuilderProps {
  initialPrescription?: PrescriptionDetailDto;
  defaultPatientId?: string;
  defaultPatientName?: string;
  defaultEncounterId?: string;
  defaultEncounterRef?: string;
  defaultDiagnosis?: string;
  catalogItems: MedicationCatalogItemDto[];
  isCatalogLoading?: boolean;
  onSearchCatalog: (search: string, dosageForm: string) => void;
  onSaveDraft: (data: CreateDoctorPrescriptionDto | UpdateDoctorPrescriptionDto) => Promise<PrescriptionDetailDto>;
  onIssue: (prescriptionId: string, notes?: string) => Promise<PrescriptionDetailDto>;
  isSavingDraft?: boolean;
  isIssuing?: boolean;
}

export function PrescriptionBuilder({
  initialPrescription,
  defaultPatientId,
  defaultPatientName,
  defaultEncounterId,
  defaultEncounterRef,
  defaultDiagnosis,
  catalogItems,
  isCatalogLoading = false,
  onSearchCatalog,
  onSaveDraft,
  onIssue,
  isSavingDraft = false,
  isIssuing = false,
}: PrescriptionBuilderProps) {
  const router = useRouter();

  // Patient & Encounter context
  const patientId = initialPrescription?.patientId || defaultPatientId || '';
  const patientName = initialPrescription?.patientName || defaultPatientName || 'Authorized Patient';
  const encounterId = initialPrescription?.id ? undefined : defaultEncounterId || '';
  const encounterRef = defaultEncounterRef || '';
  const [diagnosis, setDiagnosis] = useState(
    initialPrescription?.diagnosis || defaultDiagnosis || ''
  );
  const [instructions, setInstructions] = useState(
    initialPrescription?.instructions || 'Take all medications strictly as directed after meals.'
  );
  const [followUpInstructions, setFollowUpInstructions] = useState(
    initialPrescription?.followUpInstructions || 'Review in OPD after completion of medication course.'
  );

  // Medications state
  const [medications, setMedications] = useState<CreateMedicationInputDto[]>(
    initialPrescription?.medications?.map((m) => ({
      medicationCatalogId: (m as any).medicationCatalogId,
      name: m.name,
      genericName: m.genericName,
      brandName: (m as any).brandName,
      strength: m.strength,
      dosage: m.dosage,
      route: m.route,
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity,
      instructions: m.instructions,
    })) || []
  );

  // Selected catalog item & medication being edited
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<MedicationCatalogItemDto | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Catalog search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dosageForm, setDosageForm] = useState('ALL');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger catalog search when query or form changes
  useEffect(() => {
    onSearchCatalog(searchQuery, dosageForm);
  }, [searchQuery, dosageForm, onSearchCatalog]);

  const handleCatalogSelect = (item: MedicationCatalogItemDto) => {
    setSelectedCatalogItem(item);
    setEditingIndex(null);
  };

  const handleAddOrUpdateMedication = (med: CreateMedicationInputDto) => {
    if (editingIndex !== null) {
      const updated = [...medications];
      updated[editingIndex] = med;
      setMedications(updated);
      setEditingIndex(null);
    } else {
      setMedications([...medications, med]);
    }
    setSelectedCatalogItem(null);
  };

  const handleEditMedication = (index: number) => {
    setEditingIndex(index);
    setSelectedCatalogItem(null);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, idx) => idx !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const current = medications[index];
    const prev = medications[index - 1];
    if (!current || !prev) return;
    const updated = [...medications];
    updated[index - 1] = current;
    updated[index] = prev;
    setMedications(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= medications.length - 1) return;
    const current = medications[index];
    const next = medications[index + 1];
    if (!current || !next) return;
    const updated = [...medications];
    updated[index + 1] = current;
    updated[index] = next;
    setMedications(updated);
  };

  const validatePrescription = (): boolean => {
    setGeneralError(null);
    if (!patientId.trim()) {
      setGeneralError('Patient reference is required to issue a prescription.');
      return false;
    }
    if (medications.length === 0) {
      setGeneralError('At least one prescribed medication is required.');
      return false;
    }
    if (!instructions.trim()) {
      setGeneralError('General clinical administration instructions are required.');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validatePrescription()) return;
    setGeneralError(null);
    setSaveSuccessMsg(null);

    try {
      setIsSubmitting(true);
      const saved = await onSaveDraft({
        patientId,
        encounterId: encounterId || undefined,
        diagnosis: diagnosis.trim() || undefined,
        instructions: instructions.trim(),
        followUpInstructions: followUpInstructions.trim() || undefined,
        medications,
        isDraft: true,
      });

      setSaveSuccessMsg(`Draft saved successfully at ${new Date().toLocaleTimeString()}`);
      if (!initialPrescription) {
        router.push(`/doctor/prescriptions/${saved.id}`);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save prescription draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReview = () => {
    if (!validatePrescription()) return;
    setShowReviewModal(true);
  };

  const handleConfirmIssue = async (notes?: string) => {
    try {
      setIsSubmitting(true);
      setGeneralError(null);

      // If prescription already has an ID, issue it; otherwise create with isDraft=false
      let targetId = initialPrescription?.id;

      if (!targetId) {
        const created = await onSaveDraft({
          patientId,
          encounterId: encounterId || undefined,
          diagnosis: diagnosis.trim() || undefined,
          instructions: instructions.trim(),
          followUpInstructions: followUpInstructions.trim() || undefined,
          medications,
          isDraft: false,
        });
        targetId = created.id;
      } else {
        await onIssue(targetId, notes);
      }

      setShowReviewModal(false);
      router.push(`/doctor/prescriptions/${targetId}`);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to issue prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Pill className="h-4 w-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {initialPrescription ? `Edit Prescription Draft` : 'Create e-Prescription'}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter pharmaceutical medications, dosage schedules, and clinical instructions
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="h-8 text-xs gap-1.5 border-border/80"
          >
            <Save className="h-3.5 w-3.5 text-amber-600" />
            {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenReview}
            disabled={isIssuing || isSubmitting}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Review & Issue
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {generalError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel (Col 4): Medication Catalog Search & Results */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Pharmaceutical Catalog
                </CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Search verified medicines to pre-fill dosage and strength
              </p>
            </CardHeader>

            <CardContent className="p-3.5 space-y-3">
              <MedicationCatalogSearch
                search={searchQuery}
                onSearchChange={setSearchQuery}
                dosageForm={dosageForm}
                onDosageFormChange={setDosageForm}
              />

              <div className="pt-1">
                <MedicationCatalogResults
                  items={catalogItems}
                  isLoading={isCatalogLoading}
                  onSelect={handleCatalogSelect}
                  selectedId={selectedCatalogItem?.id}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Panel (Col 5): Medication Entry & List Editor */}
        <div className="lg:col-span-5 space-y-4">
          {/* Patient Context Card */}
          <Card className="border border-border/80 bg-card p-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-teal-600" />
                <span className="font-bold text-foreground">Patient: {patientName}</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  (ID: {patientId.slice(-6).toUpperCase()})
                </span>
              </div>
              {encounterRef && (
                <span className="text-[10px] text-muted-foreground">
                  Encounter: {encounterRef}
                </span>
              )}
            </div>
          </Card>

          {/* Dosage & Administration Configuration Form */}
          <MedicationEntryForm
            selectedCatalogItem={selectedCatalogItem}
            initialMedication={editingIndex !== null ? medications[editingIndex] : null}
            onSave={handleAddOrUpdateMedication}
            onCancel={
              editingIndex !== null || selectedCatalogItem
                ? () => {
                    setEditingIndex(null);
                    setSelectedCatalogItem(null);
                  }
                : undefined
            }
            isEditing={editingIndex !== null}
          />

          {/* Current Prescribed Medication List */}
          <MedicationListEditor
            medications={medications}
            onEdit={handleEditMedication}
            onRemove={handleRemoveMedication}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </div>

        {/* Right Panel (Col 3): Summary & Clinical Notes */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                Clinical Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3.5 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  Provisional / Final Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Essential hypertension, Type 2 DM"
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  General Instructions *
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take all medicines strictly after food with water..."
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  Follow-up Advice
                </label>
                <textarea
                  rows={2}
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  placeholder="e.g. Review in OPD after 14 days with BP record..."
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Order Summary Stats */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medications Count:</span>
                  <span className="font-bold text-foreground">{medications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Draft Status:</span>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    Draft
                  </Badge>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  onClick={handleOpenReview}
                  disabled={isIssuing || isSubmitting || medications.length === 0}
                  className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Review & Issue e-Prescription
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="w-full text-xs gap-1.5 border-border"
                >
                  <Save className="h-3.5 w-3.5 text-amber-600" />
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      <PrescriptionReview
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onConfirm={handleConfirmIssue}
        isSubmitting={isSubmitting || isIssuing}
        patientName={patientName}
        patientId={patientId}
        doctorName="Attending Clinician"
        encounterReference={encounterRef}
        medications={medications}
        instructions={instructions}
        followUpInstructions={followUpInstructions}
      />
    </div>
  );
}