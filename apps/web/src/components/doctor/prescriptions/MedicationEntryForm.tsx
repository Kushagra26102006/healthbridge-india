'use client';

import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MedicationCatalogItemDto, CreateMedicationInputDto } from '@healthbridge/shared-types';

interface MedicationEntryFormProps {
  selectedCatalogItem?: MedicationCatalogItemDto | null;
  initialMedication?: CreateMedicationInputDto | null;
  onSave: (medication: CreateMedicationInputDto) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export function MedicationEntryForm({
  selectedCatalogItem,
  initialMedication,
  onSave,
  onCancel,
  isEditing = false,
}: MedicationEntryFormProps) {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('1-0-1 (Twice daily after meals)');
  const [duration, setDuration] = useState('5 days');
  const [quantity, setQuantity] = useState<number>(10);
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync state when selected catalog item changes
  useEffect(() => {
    if (selectedCatalogItem) {
      setName(selectedCatalogItem.name);
      setGenericName(selectedCatalogItem.genericName);
      setBrandName(selectedCatalogItem.brandName);
      setStrength(selectedCatalogItem.strength);
      setRoute(selectedCatalogItem.route || 'Oral');
      setDosage(`1 ${selectedCatalogItem.standardDosageUnit || 'tablet'}`);
      if (selectedCatalogItem.instructionsHint) {
        setInstructions(selectedCatalogItem.instructionsHint);
      }
    }
  }, [selectedCatalogItem]);

  // Sync when initialMedication is passed for editing
  useEffect(() => {
    if (initialMedication) {
      setName(initialMedication.name);
      setGenericName(initialMedication.genericName || '');
      setBrandName(initialMedication.brandName || '');
      setStrength(initialMedication.strength);
      setDosage(initialMedication.dosage);
      setRoute(initialMedication.route);
      setFrequency(initialMedication.frequency);
      setDuration(initialMedication.duration);
      setQuantity(initialMedication.quantity);
      setInstructions(initialMedication.instructions || '');
    }
  }, [initialMedication]);

  const commonFrequencies = [
    'Once daily (OD) - Morning',
    'Once daily (OD) - Bedtime',
    'Twice daily (BD) - 1-0-1 After meals',
    'Thrice daily (TDS) - 1-1-1 After meals',
    'Four times daily (QDS)',
    'As needed (SOS) for pain/symptoms',
    'Alternate days',
    'Once weekly',
  ];

  const commonDurations = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '30 days',
    '60 days',
    '90 days',
    'Continuous / Long term',
  ];

  const commonRoutes = [
    'Oral',
    'Topical',
    'Inhalation',
    'Intramuscular (IM)',
    'Intravenous (IV)',
    'Subcutaneous',
    'Ophthalmic (Eye)',
    'Otic (Ear)',
    'Nasal',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Medication name is required.');
      return;
    }
    if (!strength.trim()) {
      setError('Strength specification is required (e.g. 500 mg, 10 ml).');
      return;
    }
    if (!dosage.trim()) {
      setError('Dosage is required (e.g. 1 tablet, 5 ml).');
      return;
    }
    if (!frequency.trim()) {
      setError('Administration frequency is required.');
      return;
    }
    if (!duration.trim()) {
      setError('Treatment duration is required.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Quantity to dispense must be at least 1.');
      return;
    }

    onSave({
      medicationCatalogId: selectedCatalogItem?.id,
      name: name.trim(),
      genericName: genericName.trim() || undefined,
      brandName: brandName.trim() || undefined,
      strength: strength.trim(),
      dosage: dosage.trim(),
      route: route.trim(),
      frequency: frequency.trim(),
      duration: duration.trim(),
      quantity: Number(quantity),
      instructions: instructions.trim() || undefined,
    });

    // Reset if not editing
    if (!isEditing) {
      setName('');
      setGenericName('');
      setBrandName('');
      setStrength('');
      setDosage('1 tablet');
      setInstructions('');
      setQuantity(10);
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Pill className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              {isEditing ? 'Edit Prescribed Medication' : 'Medication Dosage & Administration Instructions'}
            </CardTitle>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Medicine Name and Generic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paracetamol 500mg Tablet"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Generic Composition
              </label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Strength, Dosage, Route */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Strength *
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500 mg, 625 mg, 5 mg"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Dosage (Per Administration) *
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 tablet, 5 ml, 2 puffs"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Route of Administration *
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                aria-label="Route of administration"
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              >
                {commonRoutes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency, Duration, Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Frequency *
              </label>
              <input
                type="text"
                list="frequency-suggestions"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Select or enter frequency..."
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                required
              />
              <datalist id="frequency-suggestions">
                {commonFrequencies.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Duration *
              </label>
              <input
                type="text"
                list="duration-suggestions"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Select or enter duration..."
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                required
              />
              <datalist id="duration-suggestions">
                {commonDurations.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Quantity to Dispense *
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="text-[11px] font-semibold text-foreground block mb-1">
              Patient Instructions & Administration Notes
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with warm water after breakfast; do not consume on an empty stomach"
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              maxLength={1000}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              {isEditing ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Update Medication
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add to Prescription
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}