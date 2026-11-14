'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface AssessmentPlanFormProps {
  assessment: string;
  onAssessmentChange: (val: string) => void;
  treatmentPlan: string;
  onTreatmentPlanChange: (val: string) => void;
  followUpInstructions: string;
  onFollowUpInstructionsChange: (val: string) => void;
  followUpDate?: string;
  onFollowUpDateChange: (val?: string) => void;
  disabled?: boolean;
}

export function AssessmentPlanForm({
  assessment,
  onAssessmentChange,
  treatmentPlan,
  onTreatmentPlanChange,
  followUpInstructions,
  onFollowUpInstructionsChange,
  followUpDate,
  onFollowUpDateChange,
  disabled = false,
}: AssessmentPlanFormProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-2.5">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-teal-600" />
          <CardTitle className="text-sm font-bold text-foreground">
            Assessment & Management Plan
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Formulate clinical clinical impression, therapeutic regimen, lifestyle directives, and follow-up
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Clinical Assessment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              Clinical Assessment & Synthesis
            </label>
            <span className="text-[10px] text-muted-foreground">
              {assessment.length}/4000
            </span>
          </div>
          <textarea
            rows={3}
            value={assessment}
            onChange={(e) => onAssessmentChange(e.target.value)}
            disabled={disabled}
            placeholder="Clinical evaluation summarizing patient condition, trajectory, differential considerations, and response to previous therapy..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
            maxLength={4000}
          />
        </div>

        {/* Treatment & Care Plan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              Treatment Plan & Interventions
            </label>
            <span className="text-[10px] text-muted-foreground">
              {treatmentPlan.length}/4000
            </span>
          </div>
          <textarea
            rows={4}
            value={treatmentPlan}
            onChange={(e) => onTreatmentPlanChange(e.target.value)}
            disabled={disabled}
            placeholder="Therapeutic goals, pharmacotherapy changes, diagnostic workup ordered (ECG, Lipid Profile), procedural interventions..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
            maxLength={4000}
          />
        </div>

        {/* Patient Instructions & Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground">
                Patient Advice & Warning Signs
              </label>
              <span className="text-[10px] text-muted-foreground">
                {followUpInstructions.length}/2000
              </span>
            </div>
            <textarea
              rows={2}
              value={followUpInstructions}
              onChange={(e) => onFollowUpInstructionsChange(e.target.value)}
              disabled={disabled}
              placeholder="Dietary salt reduction, daily BP monitoring, immediate emergency return precautions for severe breathlessness..."
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
              maxLength={2000}
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-foreground block">
              Follow-Up Review Date
            </label>
            <input
              type="date"
              value={followUpDate ? followUpDate.split('T')[0] : ''}
              onChange={(e) => onFollowUpDateChange(e.target.value || undefined)}
              disabled={disabled}
              className="w-full px-2.5 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Suggested next clinical review
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
