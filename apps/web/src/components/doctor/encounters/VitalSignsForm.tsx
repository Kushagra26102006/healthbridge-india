'use client';

import React from 'react';
import { Activity, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EncounterVitalsDto } from '@healthbridge/shared-types';

export interface VitalSignsFormProps {
  vitals?: EncounterVitalsDto;
  onChange: (vitals: EncounterVitalsDto) => void;
  disabled?: boolean;
}

export function VitalSignsForm({
  vitals = {},
  onChange,
  disabled = false,
}: VitalSignsFormProps) {
  const updateField = (field: keyof EncounterVitalsDto, value: number | undefined) => {
    const updated = { ...vitals, [field]: value };

    // Auto-calculate BMI if height (cm) & weight (kg) are valid
    const height = field === 'height' ? value : vitals.height;
    const weight = field === 'weight' ? value : vitals.weight;

    if (height && weight && height > 0 && weight > 0) {
      const heightMeters = height / 100;
      updated.bmi = Number((weight / (heightMeters * heightMeters)).toFixed(1));
    } else if (height === undefined || weight === undefined) {
      updated.bmi = undefined;
    }

    onChange(updated);
  };

  const getBmiBadge = (bmi?: number) => {
    if (!bmi) return null;
    let label = 'Normal';
    let colorClass = 'border-emerald-500/40 text-emerald-600 bg-emerald-50/30';

    if (bmi < 18.5) {
      label = 'Underweight';
      colorClass = 'border-amber-500/40 text-amber-600 bg-amber-50/30';
    } else if (bmi >= 25 && bmi < 30) {
      label = 'Overweight';
      colorClass = 'border-amber-500/40 text-amber-600 bg-amber-50/30';
    } else if (bmi >= 30) {
      label = 'High BMI';
      colorClass = 'border-rose-500/40 text-rose-600 bg-rose-50/30';
    }

    return (
      <Badge variant="outline" className={`text-[10px] ml-2 ${colorClass}`}>
        {bmi} kg/m² ({label})
      </Badge>
    );
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500" />
            <CardTitle className="text-sm font-bold text-foreground">
              Vital Signs & Anthropometry
            </CardTitle>
          </div>
          {vitals.bmi && (
            <div className="flex items-center text-xs font-semibold text-muted-foreground">
              Calculated BMI: {getBmiBadge(vitals.bmi)}
            </div>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Record clinical physiological measurements. Leave unmeasured fields empty.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Blood Pressure Systolic */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              BP Systolic <span className="text-[10px] text-muted-foreground font-normal">(mmHg)</span>
            </label>
            <input
              type="number"
              min={40}
              max={300}
              value={vitals.bloodPressureSystolic ?? ''}
              onChange={(e) =>
                updateField('bloodPressureSystolic', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 120"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Blood Pressure Diastolic */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              BP Diastolic <span className="text-[10px] text-muted-foreground font-normal">(mmHg)</span>
            </label>
            <input
              type="number"
              min={20}
              max={200}
              value={vitals.bloodPressureDiastolic ?? ''}
              onChange={(e) =>
                updateField('bloodPressureDiastolic', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 80"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Heart Rate */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Heart Rate <span className="text-[10px] text-muted-foreground font-normal">(bpm)</span>
            </label>
            <input
              type="number"
              min={30}
              max={250}
              value={vitals.heartRate ?? ''}
              onChange={(e) =>
                updateField('heartRate', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 72"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Respiratory Rate */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Resp Rate <span className="text-[10px] text-muted-foreground font-normal">(breaths/min)</span>
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={vitals.respiratoryRate ?? ''}
              onChange={(e) =>
                updateField('respiratoryRate', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 16"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Temperature <span className="text-[10px] text-muted-foreground font-normal">(°C)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={30}
              max={45}
              value={vitals.temperature ?? ''}
              onChange={(e) =>
                updateField('temperature', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 36.8"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Oxygen Saturation */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              SpO2 <span className="text-[10px] text-muted-foreground font-normal">(%)</span>
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={vitals.oxygenSaturation ?? ''}
              onChange={(e) =>
                updateField('oxygenSaturation', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 98"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Height */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Height <span className="text-[10px] text-muted-foreground font-normal">(cm)</span>
            </label>
            <input
              type="number"
              min={20}
              max={300}
              value={vitals.height ?? ''}
              onChange={(e) =>
                updateField('height', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 172"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Weight <span className="text-[10px] text-muted-foreground font-normal">(kg)</span>
            </label>
            <input
              type="number"
              step="0.5"
              min={0.5}
              max={500}
              value={vitals.weight ?? ''}
              onChange={(e) =>
                updateField('weight', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g. 68.5"
              className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <Info className="h-3 w-3 text-blue-600 shrink-0" />
          <span>Note: Body Mass Index (BMI) is an anthropometric calculation for clinical reference and does not constitute a standalone diagnosis.</span>
        </div>
      </CardContent>
    </Card>
  );
}
