'use client';

import React from 'react';
import { usePrintableSampleLabel } from '@/features/laboratory/hooks/use-laboratory';
import { Printer, X, ShieldAlert, AlertCircle } from 'lucide-react';

export interface PrintableSampleLabelModalProps {
  sampleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintableSampleLabelModal({
  sampleId,
  isOpen,
  onClose,
}: PrintableSampleLabelModalProps) {
  const { data: label, isLoading, error } = usePrintableSampleLabel(sampleId);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50 print:bg-white print:p-0">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-auto">
        {/* Header (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Specimen Barcode Label
              </h3>
              <p className="text-xs text-muted-foreground">
                Privacy-Preserving ABDM Laboratory Specimen Tag
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

        {/* Label Preview Container */}
        <div className="p-6 space-y-4">
          {isLoading && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Generating barcode label...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to load sample label data</span>
            </div>
          )}

          {label && (
            <>
              {/* Privacy Notice Banner (Hidden in Print) */}
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px] flex items-center gap-2 print:hidden">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Privacy Safeguard:</strong> This specimen label strictly omits clinical diagnosis and prescription details.
                </span>
              </div>

              {/* Physical Label Component (Printable) */}
              <div
                id="printable-sample-label"
                className="w-full max-w-[340px] mx-auto p-4 rounded-xl border-2 border-dashed border-slate-400 bg-white text-slate-900 shadow-xs print:border-solid print:border-black print:m-0 print:p-3"
              >
                {/* Lab Header */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 truncate max-w-[190px]">
                    {label.laboratoryName || 'HEALTHBRIDGE DIAGNOSTICS'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                    NABL
                  </span>
                </div>

                {/* Patient Identifier & Specimen */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-mono">Patient ID</span>
                    <span className="text-sm font-black font-mono tracking-tight text-slate-950">
                      {label.patientIdentifier}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono">Specimen</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {label.specimenType}
                    </span>
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="my-3 py-2 px-1 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center">
                  {/* High-contrast barcode stripes */}
                  <div className="h-10 w-full flex items-center justify-center gap-[2px] overflow-hidden px-2">
                    {label.barcode.split('').map((char, i) => {
                      const code = char.charCodeAt(0);
                      const width = (code % 3) + 1;
                      const isBlack = (code + i) % 2 === 0 || i % 3 === 0;
                      return (
                        <div
                          key={i}
                          className={`h-full ${isBlack ? 'bg-black' : 'bg-transparent'}`}
                          style={{ width: `${width * 2}px` }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-900 mt-1">
                    *{label.barcode}*
                  </span>
                </div>

                {/* Sample No & Order Ref */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-700 border-t border-slate-300 pt-2">
                  <div>
                    <span className="text-slate-500">SMP: </span>
                    <span className="font-bold">{label.sampleNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ORD: </span>
                    <span className="font-bold">{label.orderNumber}</span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-[9px] font-mono text-slate-500 text-center mt-1">
                  COLLECTED: {new Date(label.collectedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer (Hidden in Print) */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-2.5 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={!label}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print Barcode Tag
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintableSampleLabelModal;
