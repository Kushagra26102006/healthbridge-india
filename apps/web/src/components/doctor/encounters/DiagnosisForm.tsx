'use client';

import React from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type {
  EncounterDiagnosisDto,
  DiagnosisClassification,
  DiagnosisClinicalStatus,
} from '@healthbridge/shared-types';

export interface DiagnosisFormProps {
  diagnoses: EncounterDiagnosisDto[];
  onChange: (diagnoses: EncounterDiagnosisDto[]) => void;
  disabled?: boolean;
}

export function DiagnosisForm({
  diagnoses,
  onChange,
  disabled = false,
}: DiagnosisFormProps) {
  const addDiagnosis = () => {
    const isFirst = diagnoses.length === 0;
    const newDiag: EncounterDiagnosisDto = {
      name: '',
      code: '',
      type: isFirst ? 'PRIMARY' : 'SECONDARY',
      clinicalStatus: 'ACTIVE',
      notes: '',
    };
    onChange([...diagnoses, newDiag]);
  };

  const updateDiagnosis = (index: number, updates: Partial<EncounterDiagnosisDto>) => {
    const copy = [...diagnoses];
    const existing = copy[index];
    if (existing) {
      copy[index] = { ...existing, ...updates, name: updates.name !== undefined ? updates.name : existing.name };
      onChange(copy);
    }
  };

  const removeDiagnosis = (index: number) => {
    const filtered = diagnoses.filter((_, i) => i !== index);
    // If we removed the primary, mark the first remaining as primary
    if (filtered.length > 0 && filtered[0] && !filtered.some((d) => d.type === 'PRIMARY')) {
      filtered[0].type = 'PRIMARY';
    }
    onChange(filtered);
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Clinical Diagnoses & Assessment Codes
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Record provisional or confirmed diagnoses with ICD-10 clinical coding where available
          </CardDescription>
        </div>

        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addDiagnosis}
            className="text-xs gap-1.5 h-8 border-dashed border-blue-500/40 text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Diagnosis
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {diagnoses.length === 0 ? (
          <div className="py-6 text-center space-y-2 border border-dashed border-border/70 rounded-xl bg-muted/10">
            <p className="text-xs text-muted-foreground">
              No diagnoses entered yet for this consultation.
            </p>
            {!disabled && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addDiagnosis}
                className="text-xs h-7 gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Primary Diagnosis
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {diagnoses.map((diag, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2.5 text-xs relative"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                  {/* Diagnosis Name */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="font-semibold text-foreground block">
                      Diagnosis Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={diag.name}
                      onChange={(e) => updateDiagnosis(index, { name: e.target.value })}
                      disabled={disabled}
                      placeholder="e.g. Essential (primary) hypertension"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
                    />
                  </div>

                  {/* Clinical Code (ICD-10) */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-foreground block">
                      ICD-10 / Code
                    </label>
                    <input
                      type="text"
                      value={diag.code || ''}
                      onChange={(e) => updateDiagnosis(index, { code: e.target.value.toUpperCase() })}
                      disabled={disabled}
                      placeholder="e.g. I10"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs uppercase"
                    />
                  </div>

                  {/* Primary vs Secondary */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-foreground block">
                      Classification
                    </label>
                    <select
                      value={diag.type}
                      onChange={(e) =>
                        updateDiagnosis(index, { type: e.target.value as DiagnosisClassification })
                      }
                      disabled={disabled}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
                    >
                      <option value="PRIMARY">Primary</option>
                      <option value="SECONDARY">Secondary</option>
                    </select>
                  </div>

                  {/* Clinical Status */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-foreground block">
                      Status
                    </label>
                    <select
                      value={diag.clinicalStatus}
                      onChange={(e) =>
                        updateDiagnosis(index, { clinicalStatus: e.target.value as DiagnosisClinicalStatus })
                      }
                      disabled={disabled}
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="RECURRENCE">Recurrence</option>
                      <option value="RELAPSE">Relapse</option>
                      <option value="REMISSION">Remission</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  {/* Remove Button */}
                  {!disabled && (
                    <div className="sm:col-span-1 pt-5 flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeDiagnosis(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={diag.notes || ''}
                    onChange={(e) => updateDiagnosis(index, { notes: e.target.value })}
                    disabled={disabled}
                    placeholder="Clinical notes, severity, staging or chronicity remarks..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-border/60 bg-muted/20 text-muted-foreground focus:bg-background focus:text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
