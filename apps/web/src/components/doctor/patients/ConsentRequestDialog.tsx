'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDoctorConsentActions } from '@/features/doctor/hooks/use-doctor';
import type { CreateDoctorConsentRequestDto } from '@healthbridge/shared-types';

interface ConsentRequestDialogProps {
  patientId: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DATA_TYPES = [
  { id: 'OP_CONSULTATION', label: 'Consultation Documents & Doctor Notes' },
  { id: 'PRESCRIPTION', label: 'Prescriptions & Medication History' },
  { id: 'DISCHARGE_SUMMARY', label: 'Discharge Summaries & IPD Records' },
  { id: 'DIAGNOSTIC_REPORT', label: 'Diagnostic Imaging & Radiology' },
  { id: 'LAB_REPORT', label: 'Pathology & Laboratory Reports' },
  { id: 'IMMUNIZATION_RECORD', label: 'Immunization & Vaccination Records' },
];

const PURPOSES = [
  { id: 'CAREMGT', label: 'Care Management & Active Treatment Plan' },
  { id: 'BTG', label: 'Break the Glass (Emergency Critical Care)' },
  { id: 'PUBHLTH', label: 'Public Health Investigation' },
  { id: 'DSRCH', label: 'Clinical Study / Research Review' },
];

export const ConsentRequestDialog: React.FC<ConsentRequestDialogProps> = ({
  patientId,
  patientName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'OP_CONSULTATION',
    'PRESCRIPTION',
    'LAB_REPORT',
  ]);
  const [purpose, setPurpose] = useState('CAREMGT');
  const [purposeDescription, setPurposeDescription] = useState(
    'Clinical consultation and longitudinal health history evaluation.'
  );
  const [durationDays, setDurationDays] = useState(30);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { requestConsent, isRequesting, requestError } = useDoctorConsentActions(patientId);

  if (!isOpen) return null;

  const handleToggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedTypes.length === 0) {
      setFormError('Please select at least one health data category to request access for.');
      return;
    }

    try {
      const payload: CreateDoctorConsentRequestDto = {
        purpose,
        purposeDescription,
        requestedDataTypes: selectedTypes,
        durationDays,
      };

      await requestConsent(payload);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit consent request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Request Patient Consent
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ABDM Digital Access Request for {patientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-foreground">Consent Request Dispatched</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your digital request has been sent to {patientName}&apos;s ABDM health locker. Data access will be authorized once the patient explicitly approves.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Step 1: Data Categories */}
            <div className="space-y-2">
              <label className="font-semibold text-foreground block">
                1. Select Requested Health Data Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DATA_TYPES.map((dt) => {
                  const checked = selectedTypes.includes(dt.id);
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => handleToggleType(dt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                        checked
                          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 text-foreground'
                          : 'border-border/60 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-[11px] leading-tight font-medium">{dt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Purpose */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                2. Clinical Purpose of Access
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-muted/30 text-xs rounded-xl px-3 py-2 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PURPOSES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                Purpose Details / Notes
              </label>
              <textarea
                value={purposeDescription}
                onChange={(e) => setPurposeDescription(e.target.value)}
                rows={2}
                placeholder="Explain why this medical information is required for clinical care..."
                className="w-full bg-muted/30 text-xs rounded-xl p-3 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Step 3: Duration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Requested Validity Duration
                </label>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {durationDays} Days
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[7, 15, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationDays(d)}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      durationDays === d
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 font-bold'
                        : 'border-border/60 hover:bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Warnings & Errors */}
            {(formError || requestError) && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError || requestError?.message}</span>
              </div>
            )}

            {/* Notice */}
            <p className="text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/40">
              Under India&apos;s DPDP Act and ABDM protocols, consent is never automatically granted. The patient retains full authority to approve, deny, or revoke access at any time.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isRequesting}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 h-8 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                {isRequesting ? 'Dispatching...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
