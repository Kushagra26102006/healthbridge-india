'use client';

import React, { useState } from 'react';
import { useAccessionSample } from '@/features/laboratory/hooks/use-laboratory';
import { PackageCheck, X, AlertCircle, Scan } from 'lucide-react';

export interface AccessionSampleModalProps {
  initialBarcode?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AccessionSampleModal({
  initialBarcode = '',
  isOpen,
  onClose,
  onSuccess,
}: AccessionSampleModalProps) {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [notes, setNotes] = useState('');
  const [containerIntact, setContainerIntact] = useState(true);
  const [volumeAdequate, setVolumeAdequate] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const accessionMutation = useAccessionSample();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!barcode.trim()) {
      setErrorMessage('Please enter or scan a valid specimen barcode.');
      return;
    }

    if (!containerIntact || !volumeAdequate) {
      setErrorMessage(
        'Specimen cannot be accessioned if container is damaged or volume is inadequate. Please reject the sample instead.'
      );
      return;
    }

    try {
      await accessionMutation.mutateAsync({
        barcode: barcode.trim(),
        notes: notes.trim() || undefined,
        receivedAt: new Date().toISOString(),
      });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Accessioning failed'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Specimen Accessioning
              </h3>
              <p className="text-xs text-muted-foreground">
                Verify specimen integrity and register into laboratory custody
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Specimen Barcode <span className="text-teal-500">*</span>
            </label>
            <div className="relative">
              <Scan className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter BC128-SMP-..."
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-muted/40 border border-border focus:outline-none focus:border-teal-500 uppercase"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
            <span className="text-xs font-semibold text-foreground block">
              Pre-Accessioning Quality Checklist
            </span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={containerIntact}
                onChange={(e) => setContainerIntact(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Container is intact, sealed, and devoid of leakage</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={volumeAdequate}
                onChange={(e) => setVolumeAdequate(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Specimen volume meets minimum diagnostic requirements</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Accessioning Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received at room temperature. Sample transferred to biochemistry rack A4."
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-3 focus:outline-none focus:border-teal-500 min-h-[70px]"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={accessionMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={accessionMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs disabled:opacity-50"
            >
              {accessionMutation.isPending ? 'Accessioning...' : 'Accession Specimen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AccessionSampleModal;
