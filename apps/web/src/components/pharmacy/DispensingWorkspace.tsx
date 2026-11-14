'use client';

import React, { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  User,
  Stethoscope,
  Building2,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { PrescriptionVerificationBadge } from './PrescriptionVerificationBadge';
import { MedicineMatchCard, MedicineMatchSelection } from './MedicineMatchCard';
import { DispensingConfirmationModal, DispensingConfirmationItem } from './DispensingConfirmationModal';
import {
  useVerifyPrescription,
  useMatchPrescriptionInventory,
  useDispensePrescription,
} from '@/features/pharmacy/hooks/use-pharmacy';
import type { DispensePrescriptionDto } from '@healthbridge/shared-types';

export interface DispensingWorkspaceProps {
  prescriptionId: string;
}

export function DispensingWorkspace({ prescriptionId }: DispensingWorkspaceProps) {
  const router = useRouter();
  const idempotencyFallback = useId();

  // Queries
  const {
    data: verification,
    isLoading: isVerifying,
    error: verifyError,
  } = useVerifyPrescription(prescriptionId);

  const {
    data: matches,
    isLoading: isMatching,
    error: matchError,
    refetch: refetchMatches,
  } = useMatchPrescriptionInventory(prescriptionId);

  // Dispense mutation
  const dispenseMutation = useDispensePrescription();

  // Selected item states: mapping from prescribedMedicationId to MedicineMatchSelection
  const [selections, setSelections] = useState<Record<string, MedicineMatchSelection>>({});
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Handle selection updates from MedicineMatchCard
  const handleSelectionChange = (
    medId: string,
    newSelection: MedicineMatchSelection | null
  ) => {
    setSelections((prev) => {
      const updated = { ...prev };
      if (!newSelection) {
        delete updated[medId];
      } else {
        updated[medId] = newSelection;
      }
      return updated;
    });
  };

  const selectedList = Object.values(selections);
  const totalUnits = selectedList.reduce((sum, s) => sum + s.quantityToDispense, 0);
  const totalAmount = selectedList.reduce((sum, s) => {
    const price = s.selectedBatch?.sellingPrice || 0;
    return sum + price * s.quantityToDispense;
  }, 0);

  // Calculate fulfillment status preview
  const totalPrescribed = verification?.totalPrescribedUnits || 0;
  const previouslyDispensed = (verification?.items || []).reduce(
    (sum, it) => sum + it.previouslyDispensedQuantity,
    0
  );
  const newCumulativeDispensed = previouslyDispensed + totalUnits;
  const willBeFullyDispensed =
    totalPrescribed > 0 && newCumulativeDispensed >= totalPrescribed;

  // Prepare items for confirmation modal
  const confirmationItems: DispensingConfirmationItem[] = selectedList.map((s) => {
    const matchingMedicine = (matches || []).find(
      (m) => m.prescribedMedicationId === s.prescriptionMedicationId
    );
    const unitPrice = s.selectedBatch?.sellingPrice || 0;
    return {
      medicationName: matchingMedicine?.medicationName || 'Medication',
      strength: matchingMedicine?.strength,
      batchNumber: s.selectedBatch?.batchNumber || 'UNKNOWN',
      quantityToDispense: s.quantityToDispense,
      sellingPrice: unitPrice,
      itemTotal: unitPrice * s.quantityToDispense,
    };
  });

  const handleExecuteDispense = async () => {
    if (selectedList.length === 0) return;
    setActionError(null);

    const payload: DispensePrescriptionDto = {
      prescriptionId,
      idempotencyKey: `disp-${prescriptionId}-${Date.now()}-${idempotencyFallback.replace(/[:]/g, '')}`,
      items: selectedList.map((s) => ({
        prescriptionMedicationId: s.prescriptionMedicationId,
        inventoryId: s.inventoryId,
        quantityToDispense: s.quantityToDispense,
        dosageInstructions: s.dosageInstructions,
      })),
      notes: pharmacistNotes.trim() || undefined,
    };

    try {
      const record = await dispenseMutation.mutateAsync(payload);
      setConfirmModalOpen(false);
      // Navigate to receipt view
      router.push(`/pharmacy/dispensing/${record.id}/receipt`);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to dispense prescription'
      );
    }
  };

  if (isVerifying || isMatching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Verifying prescription validity & matching inventory batches...
        </p>
      </div>
    );
  }

  if (verifyError || !verification) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 max-w-2xl mx-auto my-8">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">
            Prescription Verification Failed
          </h3>
          <p className="text-sm text-muted-foreground">
            {verifyError?.message || 'Unable to retrieve or verify prescription records.'}
          </p>
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            Back to Prescriptions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification & Prescription Header */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-bold">
                    Rx #{verification.prescriptionNumber}
                  </CardTitle>
                  <PrescriptionVerificationBadge
                    status={verification.verificationStatus}
                    isEligible={verification.isEligibleForDispensing}
                  />
                </div>
                <CardDescription className="text-xs">
                  Issued on {new Date(verification.issueDate).toLocaleDateString('en-IN')} | Valid
                  until {new Date(verification.validUntil).toLocaleDateString('en-IN')}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMatches()}
                className="text-xs h-8 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Refresh Stock
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Patient Details */}
          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Patient Details</span>
            </div>
            <p className="font-semibold text-sm text-foreground">
              {verification.patient.name}
            </p>
            <p className="text-muted-foreground">
              {verification.patient.age ? `${verification.patient.age} yrs` : 'Age N/A'} •{' '}
              {verification.patient.gender || 'Gender N/A'}
            </p>
            {verification.patient.phone && (
              <p className="text-muted-foreground">Phone: {verification.patient.phone}</p>
            )}
          </div>

          {/* Doctor Details */}
          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
              <span>Prescribing Doctor</span>
            </div>
            <p className="font-semibold text-sm text-foreground">
              {verification.doctor.name}
            </p>
            <p className="text-muted-foreground">
              {verification.doctor.specialization || 'General Physician'}
            </p>
            {verification.doctor.licenseNumber && (
              <p className="text-muted-foreground">Reg: {verification.doctor.licenseNumber}</p>
            )}
          </div>

          {/* Facility & Fulfillment Status */}
          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Facility & Dispensing Progress</span>
            </div>
            <p className="font-semibold text-sm text-foreground">
              {verification.facilityName || 'Primary Health Center'}
            </p>
            <div className="flex items-center justify-between text-muted-foreground mt-1">
              <span>Fulfillment:</span>
              <span className="font-semibold text-foreground">
                {previouslyDispensed} / {verification.totalPrescribedUnits} units
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (previouslyDispensed / (verification.totalPrescribedUnits || 1)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Ineligibility Warnings */}
      {!verification.isEligibleForDispensing && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-xs text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Dispensing Disallowed for this Prescription</h4>
            <ul className="list-disc list-inside space-y-0.5 text-destructive/90">
              {verification.verificationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dispensing Workspace Body: Items List & Fulfillment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Medication Matching List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Prescribed Medications & Batch Matching
              </h3>
              <p className="text-xs text-muted-foreground">
                Select batches to dispense. Earliest expiry (FEFO) batches are recommended automatically.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {matches?.length || 0} item{matches?.length !== 1 ? 's' : ''}
            </span>
          </div>

          {matchError ? (
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive">
              Failed to load inventory matches: {matchError.message}
            </div>
          ) : (
            <div className="space-y-3">
              {(matches || []).map((match) => (
                <MedicineMatchCard
                  key={match.prescribedMedicationId}
                  match={match}
                  selection={selections[match.prescribedMedicationId]}
                  onSelectionChange={(sel) =>
                    handleSelectionChange(match.prescribedMedicationId, sel)
                  }
                  disabled={!verification.isEligibleForDispensing}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dispensing Summary & Confirmation Trigger */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Dispensing Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Review line items before deducting inventory
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-xs">
              {/* Selected items quick review */}
              {selectedList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  <p>No items selected for dispensing.</p>
                  <p className="text-[11px] mt-1">
                    Check the boxes beside medicines on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  <div className="font-semibold text-foreground text-xs flex justify-between">
                    <span>Selected Items</span>
                    <Badge variant="secondary">{selectedList.length}</Badge>
                  </div>
                  <div className="space-y-1.5 divide-y divide-border/60">
                    {selectedList.map((s) => {
                      const m = (matches || []).find(
                        (item) => item.prescribedMedicationId === s.prescriptionMedicationId
                      );
                      const unitRate = s.selectedBatch?.sellingPrice || 0;
                      return (
                        <div
                          key={s.prescriptionMedicationId}
                          className="pt-1.5 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {m?.medicationName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {s.quantityToDispense} units @ ₹{unitRate} (Batch: {s.selectedBatch?.batchNumber})
                            </p>
                          </div>
                          <span className="font-semibold text-foreground">
                            ₹{(s.quantityToDispense * unitRate).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Partial Dispensing Notice */}
              {selectedList.length > 0 && !willBeFullyDispensed && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                  <p className="font-semibold">Notice: Partial Dispensing</p>
                  <p className="text-amber-700">
                    This dispensation fulfills {totalUnits} units. Remaining units can be dispensed in a subsequent session.
                  </p>
                </div>
              )}

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Units:</span>
                  <span className="font-semibold text-foreground">{totalUnits}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated GST (5%):</span>
                  <span>₹{(totalAmount * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-primary text-base">
                    ₹{(totalAmount * 1.05).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-muted-foreground block font-medium">
                  Pharmacist Notes (Optional)
                </label>
                <textarea
                  placeholder="e.g. Advised patient to take after meals..."
                  value={pharmacistNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setPharmacistNotes(e.target.value)
                  }
                  className="w-full text-xs min-h-[60px] p-2.5 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Action Error Banner */}
              {actionError && (
                <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {actionError}
                </div>
              )}

              {/* Confirm Dispensing Trigger Button */}
              <Button
                type="button"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                disabled={
                  selectedList.length === 0 ||
                  !verification.isEligibleForDispensing ||
                  dispenseMutation.isPending
                }
                onClick={() => setConfirmModalOpen(true)}
              >
                <ShieldCheck className="w-4 h-4" />
                Dispense Selected Stock
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DispensingConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        prescriptionNumber={verification.prescriptionNumber}
        patientName={verification.patient.name}
        items={confirmationItems}
        totalQuantity={totalUnits}
        totalAmount={Math.round(totalAmount * 1.05 * 100) / 100}
        notes={pharmacistNotes}
        onConfirm={handleExecuteDispense}
        loading={dispenseMutation.isPending}
      />
    </div>
  );
}

export default DispensingWorkspace;
