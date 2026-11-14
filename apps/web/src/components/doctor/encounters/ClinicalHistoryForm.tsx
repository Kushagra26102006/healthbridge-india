'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface ClinicalHistoryFormProps {
  historyOfPresentIllness: string;
  onHpiChange: (val: string) => void;
  medicalHistory: string;
  onMedicalHistoryChange: (val: string) => void;
  disabled?: boolean;
}

export function ClinicalHistoryForm({
  historyOfPresentIllness,
  onHpiChange,
  medicalHistory,
  onMedicalHistoryChange,
  disabled = false,
}: ClinicalHistoryFormProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-2.5">
        <CardTitle className="text-sm font-bold text-foreground">
          Clinical History
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Document the chronological progression of symptoms and relevant past health context
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* History of Present Illness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              History of Present Illness (HPI)
            </label>
            <span className="text-[10px] text-muted-foreground">
              {historyOfPresentIllness.length}/4000
            </span>
          </div>
          <textarea
            rows={4}
            value={historyOfPresentIllness}
            onChange={(e) => onHpiChange(e.target.value)}
            disabled={disabled}
            placeholder="Onset, location, duration, character, aggravating and relieving factors, associated symptoms, prior episodes..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
            maxLength={4000}
          />
        </div>

        {/* Past Medical History */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              Past Medical & Surgical History
            </label>
            <span className="text-[10px] text-muted-foreground">
              {medicalHistory.length}/4000
            </span>
          </div>
          <textarea
            rows={3}
            value={medicalHistory}
            onChange={(e) => onMedicalHistoryChange(e.target.value)}
            disabled={disabled}
            placeholder="Chronic conditions (Hypertension, T2D, Asthma), surgical interventions, hospitalizations, family history..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
            maxLength={4000}
          />
        </div>
      </CardContent>
    </Card>
  );
}
