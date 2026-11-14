'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Tag,
} from 'lucide-react';
import type {
  MedicineMatchResultDto,
  CandidateBatchOptionDto,
} from '@healthbridge/shared-types';
import { cn } from '@/lib/utils';

export interface MedicineMatchSelection {
  prescriptionMedicationId: string;
  inventoryId: string;
  quantityToDispense: number;
  dosageInstructions?: string;
  selectedBatch?: CandidateBatchOptionDto;
}

export interface MedicineMatchCardProps {
  match: MedicineMatchResultDto;
  selection?: MedicineMatchSelection;
  onSelectionChange: (selection: MedicineMatchSelection | null) => void;
  disabled?: boolean;
}

export function MedicineMatchCard({
  match,
  selection,
  onSelectionChange,
  disabled = false,
}: MedicineMatchCardProps) {
  const isSelected = Boolean(selection);
  const remaining = match.remainingQuantity;
  const isFullyDispensed = remaining === 0;

  const availableBatches = match.candidateBatches || [];
  const currentBatch = selection?.selectedBatch || match.suggestedBatch || availableBatches[0];

  const handleToggleSelect = (checked: boolean) => {
    if (!checked) {
      onSelectionChange(null);
    } else {
      if (!currentBatch) return;
      const initialQty = Math.min(remaining, currentBatch.availableQuantity || 1);
      onSelectionChange({
        prescriptionMedicationId: match.prescribedMedicationId,
        inventoryId: currentBatch.inventoryId,
        quantityToDispense: initialQty,
        dosageInstructions: match.dosageInstructions,
        selectedBatch: currentBatch,
      });
    }
  };

  const handleBatchChange = (inventoryId: string) => {
    const chosen = availableBatches.find((b) => b.inventoryId === inventoryId);
    if (!chosen) return;
    const qty = selection
      ? Math.min(selection.quantityToDispense, chosen.availableQuantity, remaining)
      : Math.min(remaining, chosen.availableQuantity || 1);

    onSelectionChange({
      prescriptionMedicationId: match.prescribedMedicationId,
      inventoryId: chosen.inventoryId,
      quantityToDispense: Math.max(1, qty),
      dosageInstructions: selection?.dosageInstructions || match.dosageInstructions,
      selectedBatch: chosen,
    });
  };

  const handleQuantityChange = (newQty: number) => {
    if (!currentBatch) return;
    const maxQty = Math.min(remaining, currentBatch.availableQuantity);
    const validQty = Math.max(1, Math.min(maxQty, newQty));
    onSelectionChange({
      prescriptionMedicationId: match.prescribedMedicationId,
      inventoryId: currentBatch.inventoryId,
      quantityToDispense: validQty,
      dosageInstructions: selection?.dosageInstructions || match.dosageInstructions,
      selectedBatch: currentBatch,
    });
  };

  const getMatchBadge = () => {
    switch (match.matchStatus) {
      case 'EXACT_MATCH':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Exact Match
          </Badge>
        );
      case 'ACCEPTABLE_MATCH':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Generic Match
          </Badge>
        );
      case 'INSUFFICIENT_STOCK':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Low Stock
          </Badge>
        );
      case 'EXPIRED_ONLY':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 gap-1 font-medium">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Expired Only
          </Badge>
        );
      case 'QUARANTINED_ONLY':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
            Quarantined Only
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 gap-1 font-medium">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            No Match
          </Badge>
        );
    }
  };

  const itemTotal = selection && currentBatch ? selection.quantityToDispense * currentBatch.sellingPrice : 0;

  return (
    <Card
      className={cn(
        'transition-all duration-200 border',
        isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border bg-card',
        isFullyDispensed ? 'opacity-70 bg-muted/40' : ''
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id={`select-med-${match.prescribedMedicationId}`}
              checked={isSelected}
              onChange={(e) => handleToggleSelect(e.target.checked)}
              disabled={disabled || isFullyDispensed || availableBatches.length === 0}
              className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-base">
                  {match.medicationName}
                </span>
                {match.strength && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {match.strength}
                  </Badge>
                )}
                {match.dosageForm && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {match.dosageForm}
                  </Badge>
                )}
                {getMatchBadge()}
              </div>

              {match.genericName && match.genericName !== match.medicationName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generic: <span className="font-medium text-foreground">{match.genericName}</span>
                </p>
              )}

              {match.dosageInstructions && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Sig: {match.dosageInstructions}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-start bg-background/80 px-3 py-1.5 rounded-lg border">
            <div>
              <span className="text-muted-foreground block">Prescribed</span>
              <span className="font-bold text-foreground text-sm">{match.prescribedQuantity}</span>
            </div>
            <div className="border-l pl-3">
              <span className="text-muted-foreground block">Dispensed</span>
              <span className="font-bold text-amber-600 text-sm">
                {match.previouslyDispensedQuantity}
              </span>
            </div>
            <div className="border-l pl-3">
              <span className="text-muted-foreground block">Remaining</span>
              <span
                className={cn(
                  'font-bold text-sm',
                  remaining > 0 ? 'text-primary' : 'text-emerald-600'
                )}
              >
                {remaining}
              </span>
            </div>
          </div>
        </div>

        {/* Batch selection and quantity controls */}
        {isFullyDispensed ? (
          <div className="pt-3 text-xs text-emerald-700 bg-emerald-50 rounded-md p-2 mt-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>This prescribed medication has been completely dispensed.</span>
          </div>
        ) : availableBatches.length === 0 ? (
          <div className="pt-3 text-xs text-muted-foreground flex items-center gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{match.matchMessage}</span>
          </div>
        ) : (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Batch Selector */}
            <div className="md:col-span-7 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Select Inventory Batch (FEFO Prioritized)</span>
                {currentBatch?.isFefoSuggested && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> FEFO Recommended
                  </span>
                )}
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                value={selection?.inventoryId || currentBatch?.inventoryId || ''}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={disabled || !isSelected}
              >
                {availableBatches.map((b) => (
                  <option key={b.inventoryId} value={b.inventoryId}>
                    {b.batchNumber} | Exp: {new Date(b.expiryDate).toLocaleDateString('en-IN')} | Avail: {b.availableQuantity} | ₹{b.sellingPrice}
                    {b.isFefoSuggested ? ' ★ (Earliest Expiry)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity to Dispense */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Qty to Dispense</span>
                <span className="text-[10px] text-muted-foreground">
                  Max: {currentBatch ? Math.min(remaining, currentBatch.availableQuantity) : remaining}
                </span>
              </label>
              <Input
                type="number"
                min={1}
                max={currentBatch ? Math.min(remaining, currentBatch.availableQuantity) : remaining}
                value={selection?.quantityToDispense || ''}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                disabled={disabled || !isSelected}
                className="h-9 text-xs font-semibold"
                placeholder="Qty"
              />
            </div>

            {/* Price Snapshot */}
            <div className="md:col-span-2 text-right self-center md:self-end pb-1">
              <span className="text-[10px] text-muted-foreground block">Item Total</span>
              <span className="font-bold text-foreground text-sm">
                ₹{itemTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Selected batch detail badges */}
        {isSelected && currentBatch && (
          <div className="mt-3 pt-2 border-t border-border/40 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-primary" />
              Batch: <strong className="text-foreground">{currentBatch.batchNumber}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" />
              Expiry: <strong className="text-foreground">{new Date(currentBatch.expiryDate).toLocaleDateString('en-IN')}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-primary" />
              Rate: ₹{currentBatch.sellingPrice} / unit
            </span>
            {currentBatch.rackLocation && (
              <span className="text-slate-500">
                Rack: <strong className="text-foreground">{currentBatch.rackLocation}</strong>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MedicineMatchCard;
