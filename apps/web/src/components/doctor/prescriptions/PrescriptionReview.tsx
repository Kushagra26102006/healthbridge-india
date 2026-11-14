'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Pill, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CreateMedicationInputDto } from '@healthbridge/shared-types';

interface PrescriptionReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isSubmitting?: boolean;
  patientName: string;
  patientId: string;
  doctorName: string;
  encounterReference?: string;
  medications: CreateMedicationInputDto[];
  instructions: string;
  followUpInstructions?: string;
}

export function PrescriptionReview({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  patientName,
  patientId,
  doctorName,
  encounterReference,
  medications,
  instructions,
  followUpInstructions,
}: PrescriptionReviewProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full border border-border shadow-xl bg-card animate-in fade-in-0 zoom-in-95 my-8">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Confirm Prescription Issuance
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Review clinical attribution and medication list before electronic sealing
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/20 border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Patient</span>
              <span className="font-bold text-foreground truncate block">{patientName}</span>
              <span className="text-[10px] text-muted-foreground">ID: {patientId.slice(-6).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Attending Doctor</span>
              <span className="font-bold text-foreground truncate block">{doctorName}</span>
              <span className="text-[10px] text-emerald-600 font-medium">Verified License</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Encounter Ref</span>
              <span className="font-medium text-foreground">{encounterReference || 'Direct OPD'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Prescription Date</span>
              <span className="font-medium text-foreground">{today}</span>
            </div>
          </div>

          {/* Medication List Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-blue-600" />
              Prescribed Medications ({medications.length})
            </h4>

            <div className="border border-border/60 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/40 text-[11px] text-muted-foreground border-b border-border/60 font-semibold">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Medication & Strength</th>
                    <th className="p-2.5">Dosage & Route</th>
                    <th className="p-2.5">Frequency & Duration</th>
                    <th className="p-2.5 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {medications.map((m, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="p-2.5 text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="p-2.5">
                        <span className="font-bold text-foreground block">{m.name}</span>
                        {m.genericName && (
                          <span className="text-[10px] text-muted-foreground">{m.genericName}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span>{m.dosage}</span>
                        <span className="text-muted-foreground block text-[10px]">{m.route}</span>
                      </td>
                      <td className="p-2.5">
                        <span>{m.frequency}</span>
                        <span className="text-muted-foreground block text-[10px]">{m.duration}</span>
                      </td>
                      <td className="p-2.5 text-right font-medium">{m.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* General & Follow up instructions */}
          <div className="space-y-1.5 text-xs bg-muted/15 p-3 rounded-xl border border-border/50">
            <div>
              <span className="font-semibold text-foreground">General Instructions: </span>
              <span className="text-muted-foreground">{instructions}</span>
            </div>
            {followUpInstructions && (
              <div>
                <span className="font-semibold text-foreground">Follow-up Advice: </span>
                <span className="text-muted-foreground">{followUpInstructions}</span>
              </div>
            )}
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-[11px] font-semibold text-foreground block mb-1">
              Internal Issuance Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Consulted via teleconsultation; verified identity"
              className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              maxLength={500}
            />
          </div>

          {/* Clinical Confirmation Checkbox */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="attribution-confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="attribution-confirm" className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed cursor-pointer select-none">
                I hereby confirm that I am the licensed medical practitioner issuing this electronic prescription. All prescribed pharmaceutical substances and dosage schedules are attributable to my clinical judgment under the National Medical Commission (NMC) regulations.
              </label>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Once issued, digital prescriptions cannot be silently edited.</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={() => onConfirm(notes)}
            disabled={!confirmed || isSubmitting}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {isSubmitting ? 'Issuing e-Prescription...' : 'Confirm & Issue e-Prescription'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}