'use client';

import React from 'react';
import { Pill, Trash2, Edit2, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateMedicationInputDto } from '@healthbridge/shared-types';

interface MedicationListEditorProps {
  medications: CreateMedicationInputDto[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export function MedicationListEditor({
  medications,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: MedicationListEditorProps) {
  if (medications.length === 0) {
    return (
      <Card className="border border-dashed border-border/80 bg-card/40">
        <CardContent className="py-10 text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Pill className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-foreground">No medications added yet</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Search the medication catalog on the left or use the dosage form to add prescribed pharmaceutical drugs. At least one medication is required before issuing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              Prescribed Medications ({medications.length})
            </CardTitle>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Review and adjust dosage instructions
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {medications.map((med, index) => (
            <div
              key={`${med.name}-${index}`}
              className="p-3.5 sm:p-4 hover:bg-muted/15 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    #{index + 1}
                  </span>
                  <span className="font-bold text-xs text-foreground truncate">
                    {med.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800">
                    {med.strength}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Qty: {med.quantity}
                  </Badge>
                </div>

                {med.genericName && (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Generic: {med.genericName}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-foreground/90 bg-muted/20 p-2 rounded-lg border border-border/40">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Dosage</span>
                    <span className="font-medium">{med.dosage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Route</span>
                    <span className="font-medium">{med.route}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Frequency</span>
                    <span className="font-medium">{med.frequency}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Duration</span>
                    <span className="font-medium">{med.duration}</span>
                  </div>
                </div>

                {med.instructions && (
                  <div className="text-[11px] text-muted-foreground italic flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>Instructions: {med.instructions}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                {onMoveUp && index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveUp(index)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onMoveDown && index < medications.length - 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveDown(index)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(index)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Edit medication"
                >
                  <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                  title="Remove medication"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}