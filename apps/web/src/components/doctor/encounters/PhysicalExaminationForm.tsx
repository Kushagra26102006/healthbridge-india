'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { EncounterExaminationDto } from '@healthbridge/shared-types';

export interface PhysicalExaminationFormProps {
  examination?: EncounterExaminationDto;
  onChange: (exam: EncounterExaminationDto) => void;
  disabled?: boolean;
}

export function PhysicalExaminationForm({
  examination = {},
  onChange,
  disabled = false,
}: PhysicalExaminationFormProps) {
  const updateGeneral = (general: string) => {
    onChange({ ...examination, general });
  };

  const updateSystemic = (systemic: string) => {
    onChange({ ...examination, systemic });
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-2.5">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-sm font-bold text-foreground">
            Physical Examination
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Document general clinical appearance and organ system physical findings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* General Appearance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              General Examination & Constitutional Findings
            </label>
            <span className="text-[10px] text-muted-foreground">
              {(examination.general || '').length}/2000
            </span>
          </div>
          <textarea
            rows={3}
            value={examination.general || ''}
            onChange={(e) => updateGeneral(e.target.value)}
            disabled={disabled}
            placeholder="Consciousness, orientation, distress, hydration, pallor, icterus, cyanosis, clubbing, lymphadenopathy, pedal edema..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
            maxLength={2000}
          />
        </div>

        {/* Systemic Examination */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">
              Systemic Examination (CVS, RS, PA, CNS)
            </label>
            <span className="text-[10px] text-muted-foreground">
              {(examination.systemic || '').length}/4000
            </span>
          </div>
          <textarea
            rows={4}
            value={examination.systemic || ''}
            onChange={(e) => updateSystemic(e.target.value)}
            disabled={disabled}
            placeholder="CVS: S1 S2 heard, no murmurs. RS: Bilateral vesicular breath sounds, no rhonchi/crepitations. PA: Soft, non-tender, no organomegaly. CNS: Pupils equal and reactive..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground/60 disabled:opacity-70 disabled:cursor-not-allowed resize-y"
            maxLength={4000}
          />
        </div>
      </CardContent>
    </Card>
  );
}
