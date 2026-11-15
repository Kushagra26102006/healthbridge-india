'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  useLabSamples,
  useAccessionSample,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  LabSampleStatusBadge,
  SpecimenTypeBadge,
  RejectSampleModal,
  PrintableSampleLabelModal,
} from '@/components/laboratory';
import {
  Scan,
  PackageCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import type { LabSampleDto } from '@healthbridge/shared-types';

export default function BarcodeScanAccessioningPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedSample, setScannedSample] = useState<LabSampleDto | null>(null);
  const [accessionNotes, setAccessionNotes] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals
  const [rejectSampleTarget, setRejectSampleTarget] = useState<LabSampleDto | null>(null);
  const [printSampleId, setPrintSampleId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allSamples, refetch: refetchSamples } = useLabSamples({ limit: 100 });
  const accessionMutation = useAccessionSample();

  // Auto-focus input on page load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setScannedSample(null);

    const code = barcodeInput.trim();
    if (!code) return;

    const found = allSamples?.find(
      (s) =>
        s.barcode.toLowerCase() === code.toLowerCase() ||
        s.sampleNumber.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      setScannedSample(found);
      setFeedback(null);
    } else {
      setFeedback({
        type: 'error',
        text: `No specimen found matching barcode "${code}". Verify the label or register sample collection.`,
      });
    }
  };

  const handleAccession = async () => {
    if (!scannedSample) return;
    setFeedback(null);

    try {
      await accessionMutation.mutateAsync({
        barcode: scannedSample.barcode,
        notes: accessionNotes.trim() || undefined,
        receivedAt: new Date().toISOString(),
      });

      setFeedback({
        type: 'success',
        text: `Specimen ${scannedSample.sampleNumber} successfully accessioned into laboratory custody.`,
      });
      setBarcodeInput('');
      setAccessionNotes('');
      setScannedSample(null);
      refetchSamples();
      inputRef.current?.focus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Accessioning failed',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/laboratory/samples"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Scan className="w-5 h-5 text-teal-600" />
              Barcode Scanner & Accessioning Station
            </h1>
            <p className="text-xs text-muted-foreground">
              Scan Code 128 barcode or enter sample number for immediate pre-analytical verification
            </p>
          </div>
        </div>
      </div>

      {/* Scanner Input Panel */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <form onSubmit={handleScanSubmit} className="space-y-3">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
            Scan / Enter Barcode
          </label>
          <div className="relative">
            <Scan className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600" />
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode label (e.g. BC128-SMP-...) or hit Enter..."
              className="w-full pl-11 pr-24 py-3 text-sm font-mono rounded-xl bg-muted/40 border-2 border-border focus:border-teal-500 focus:bg-background focus:outline-none transition-all uppercase font-semibold"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Lookup
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Compatible with all USB and Bluetooth barcode wedge scanners (automatic enter transmission).
          </p>
        </form>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Scanned Sample Inspection Card */}
      {scannedSample && (
        <div className="p-6 rounded-2xl bg-card border-2 border-teal-500/50 shadow-md space-y-5 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-extrabold font-mono text-foreground">
                  {scannedSample.sampleNumber}
                </span>
                <LabSampleStatusBadge status={scannedSample.status} />
              </div>
              <p className="text-xs font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                Barcode: {scannedSample.barcode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintSampleId(scannedSample.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-muted text-foreground"
              >
                <Printer className="w-3.5 h-3.5" /> Tag
              </button>
              <Link
                href={`/laboratory/samples/${scannedSample.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-muted text-foreground"
              >
                Full Detail
              </Link>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Specimen Type</span>
              <SpecimenTypeBadge specimenType={scannedSample.specimenType} className="mt-1" />
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Order Reference</span>
              <span className="font-mono font-bold text-foreground block mt-1">
                Order #{scannedSample.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Container Type</span>
              <span className="text-foreground font-medium block mt-1">
                {scannedSample.containerType || 'Standard Sterile Container'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs space-y-1">
            <span className="font-bold text-foreground block">
              Tests to be performed on this specimen:
            </span>
            <p className="font-mono text-teal-700 dark:text-teal-300">
              {scannedSample.testCodes?.join(', ') || 'N/A'}
            </p>
          </div>

          {/* Accession Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Accessioning Notes / Pre-Analytical Observation (Optional)
            </label>
            <input
              type="text"
              value={accessionNotes}
              onChange={(e) => setAccessionNotes(e.target.value)}
              placeholder="e.g. Adequate volume; specimen clear with no visible hemolysis."
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setRejectSampleTarget(scannedSample)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-xl transition-colors"
            >
              <XCircle className="w-4 h-4" /> Reject Specimen
            </button>

            <button
              type="button"
              onClick={handleAccession}
              disabled={accessionMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <PackageCheck className="w-4 h-4" />
              {accessionMutation.isPending ? 'Accessioning...' : 'Confirm Accessioning'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {rejectSampleTarget && (
        <RejectSampleModal
          sampleId={rejectSampleTarget.id}
          sampleNumber={rejectSampleTarget.sampleNumber}
          barcode={rejectSampleTarget.barcode}
          isOpen={true}
          onClose={() => setRejectSampleTarget(null)}
          onSuccess={() => {
            setScannedSample(null);
            refetchSamples();
            inputRef.current?.focus();
          }}
        />
      )}

      {printSampleId && (
        <PrintableSampleLabelModal
          sampleId={printSampleId}
          isOpen={true}
          onClose={() => setPrintSampleId(null)}
        />
      )}
    </div>
  );
}
