'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Activity,
  Stethoscope,
  Tag,
  ClipboardList,
  Pill,
  ArrowLeft,
  Calendar,
  Building2,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PatientClinicalContext } from './PatientClinicalContext';
import { ChiefComplaintForm } from './ChiefComplaintForm';
import { ClinicalHistoryForm } from './ClinicalHistoryForm';
import { VitalSignsForm } from './VitalSignsForm';
import { PhysicalExaminationForm } from './PhysicalExaminationForm';
import { DiagnosisForm } from './DiagnosisForm';
import { AssessmentPlanForm } from './AssessmentPlanForm';
import { EncounterAttachments } from './EncounterAttachments';
import { EncounterSaveStatus } from './EncounterSaveStatus';
import { useDoctorEncounterActions } from '@/features/doctor/hooks/use-doctor';
import type {
  EncounterDetailDto,
  EncounterVitalsDto,
  EncounterExaminationDto,
  EncounterDiagnosisDto,
  UpdateEncounterDto,
} from '@healthbridge/shared-types';

export interface EncounterWorkspaceProps {
  encounter: EncounterDetailDto;
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

export function EncounterWorkspace({
  encounter,
  onRefresh,
  isReadOnly = false,
}: EncounterWorkspaceProps) {
  const router = useRouter();
  const { saveDraft, isSavingDraft, completeEncounter, isCompleting } = useDoctorEncounterActions();

  // Local Form State initialized from encounter
  const [chiefComplaint, setChiefComplaint] = useState(encounter.chiefComplaint || '');
  const [hpi, setHpi] = useState(encounter.historyOfPresentIllness || '');
  const [medicalHistory, setMedicalHistory] = useState(encounter.medicalHistory || '');
  const [vitals, setVitals] = useState<EncounterVitalsDto>(encounter.vitals || {});
  const [examination, setExamination] = useState<EncounterExaminationDto>(encounter.examination || {});
  const [diagnoses, setDiagnoses] = useState<EncounterDiagnosisDto[]>(encounter.diagnoses || []);
  const [assessment, setAssessment] = useState(encounter.assessment || '');
  const [treatmentPlan, setTreatmentPlan] = useState(encounter.treatmentPlan || '');
  const [followUpInstructions, setFollowUpInstructions] = useState(encounter.followUpInstructions || '');
  const [followUpDate, setFollowUpDate] = useState<string | undefined>(encounter.followUpDate);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>(
    encounter.updatedAt ? new Date(encounter.updatedAt) : undefined
  );
  const [activeTab, setActiveTab] = useState<'NOTES' | 'VITALS' | 'EXAM' | 'DIAGNOSIS' | 'PLAN' | 'ATTACHMENTS'>('NOTES');
  const isMountedRef = useRef(false);

  // Mark unsaved changes when any state changes
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    setHasUnsavedChanges(true);
  }, [
    chiefComplaint,
    hpi,
    medicalHistory,
    vitals,
    examination,
    diagnoses,
    assessment,
    treatmentPlan,
    followUpInstructions,
    followUpDate,
  ]);

  const getPayload = (): UpdateEncounterDto => ({
    chiefComplaint,
    historyOfPresentIllness: hpi,
    medicalHistory,
    vitals,
    examination,
    diagnoses,
    assessment,
    treatmentPlan,
    followUpInstructions,
    followUpDate,
    version: encounter.version,
  });

  const handleSaveDraft = async () => {
    if (isReadOnly || !encounter.isDraft) return;
    try {
      await saveDraft({ encounterId: encounter.id, data: getPayload() });
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      onRefresh?.();
    } catch {
      // Error handled by TanStack query
    }
  };

  const handleFinalize = async () => {
    if (isReadOnly || !encounter.isDraft) return;
    try {
      await completeEncounter({ encounterId: encounter.id, data: getPayload() });
      setHasUnsavedChanges(false);
      onRefresh?.();
      router.push(`/doctor/encounters/${encounter.id}`);
    } catch {
      // Error handled by TanStack query
    }
  };

  const isLocked = isReadOnly || !encounter.isDraft || encounter.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Top Breadcrumb & Metadata Card */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/doctor/encounters">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Encounters
              </Link>
            </Button>
            <span className="text-border">•</span>
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50/80 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-500/20">
              {encounter.encounterReference}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {encounter.encounterType === 'VIRTUAL' ? (
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-600 text-[10px] gap-1">
                <Video className="h-3 w-3" />
                Telehealth
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                {encounter.encounterType}
              </Badge>
            )}

            {isLocked ? (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/30 text-[10px]">
                Finalized
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/30 text-[10px]">
                Draft Consultation
              </Badge>
            )}
          </div>
        </div>

        {/* Clinical Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Patient
            </span>
            <span className="font-bold text-foreground block truncate">
              {encounter.patientName}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Attending Doctor
            </span>
            <span className="font-semibold text-foreground block truncate">
              {encounter.doctorName}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Consultation Date
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(encounter.startTime).toLocaleDateString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Facility
            </span>
            <span className="text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              {encounter.facilityName || 'Clinic'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Draft / Finalize Banner */}
      {!isLocked && (
        <EncounterSaveStatus
          isDraft={encounter.isDraft}
          isSaving={isSavingDraft}
          isCompleting={isCompleting}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
          version={encounter.version}
          onSaveDraft={handleSaveDraft}
          onFinalize={handleFinalize}
        />
      )}

      {/* 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Authorized Patient Clinical Context (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <PatientClinicalContext
            patientId={encounter.patientId}
            patientName={encounter.patientName}
            patientAge={encounter.patientAge}
            patientGender={encounter.patientGender}
            patientPhone={encounter.patientPhone}
          />
        </div>

        {/* Right Column: Documentation Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/30 rounded-xl border border-border/60 text-xs">
            <button
              onClick={() => setActiveTab('NOTES')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'NOTES'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              History & Notes
            </button>

            <button
              onClick={() => setActiveTab('VITALS')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'VITALS'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Activity className="h-3.5 w-3.5 text-rose-500" />
              Vitals
            </button>

            <button
              onClick={() => setActiveTab('EXAM')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'EXAM'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Stethoscope className="h-3.5 w-3.5 text-indigo-500" />
              Examination
            </button>

            <button
              onClick={() => setActiveTab('DIAGNOSIS')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'DIAGNOSIS'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              Diagnoses ({diagnoses.length})
            </button>

            <button
              onClick={() => setActiveTab('PLAN')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'PLAN'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ClipboardList className="h-3.5 w-3.5 text-teal-600" />
              Assessment & Plan
            </button>

            <button
              onClick={() => setActiveTab('ATTACHMENTS')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'ATTACHMENTS'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Pill className="h-3.5 w-3.5 text-emerald-600" />
              Prescriptions ({encounter.prescriptions?.length || 0})
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'NOTES' && (
            <div className="space-y-4">
              <ChiefComplaintForm
                value={chiefComplaint}
                onChange={setChiefComplaint}
                disabled={isLocked}
              />
              <ClinicalHistoryForm
                historyOfPresentIllness={hpi}
                onHpiChange={setHpi}
                medicalHistory={medicalHistory}
                onMedicalHistoryChange={setMedicalHistory}
                disabled={isLocked}
              />
            </div>
          )}

          {activeTab === 'VITALS' && (
            <VitalSignsForm
              vitals={vitals}
              onChange={setVitals}
              disabled={isLocked}
            />
          )}

          {activeTab === 'EXAM' && (
            <PhysicalExaminationForm
              examination={examination}
              onChange={setExamination}
              disabled={isLocked}
            />
          )}

          {activeTab === 'DIAGNOSIS' && (
            <DiagnosisForm
              diagnoses={diagnoses}
              onChange={setDiagnoses}
              disabled={isLocked}
            />
          )}

          {activeTab === 'PLAN' && (
            <AssessmentPlanForm
              assessment={assessment}
              onAssessmentChange={setAssessment}
              treatmentPlan={treatmentPlan}
              onTreatmentPlanChange={setTreatmentPlan}
              followUpInstructions={followUpInstructions}
              onFollowUpInstructionsChange={setFollowUpInstructions}
              followUpDate={followUpDate}
              onFollowUpDateChange={setFollowUpDate}
              disabled={isLocked}
            />
          )}

          {activeTab === 'ATTACHMENTS' && (
            <EncounterAttachments
              encounterId={encounter.id}
              patientId={encounter.patientId}
              prescriptions={encounter.prescriptions}
              disabled={isLocked}
            />
          )}
        </div>
      </div>
    </div>
  );
}
