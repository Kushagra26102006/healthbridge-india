'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PharmacyDispensingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
          <Pill className="w-3.5 h-3.5" />
          <span>Clinical Dispensation</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Medication Dispensing Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Barcode scanning, batch allocation, and multi-signature digital sign-off workflow.
        </p>
      </div>

      {/* Explanatory Foundation Notice */}
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-xs max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
          <Pill className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Dispensing Console Foundation Ready
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
          The prescription queue and batch inventory foundations have been established. Direct medication dispensation with digital pharmacist sign-off and batch deduction will be enabled in Day 5 Task 02.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pharmacy/prescriptions"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            Inspect Prescription Queue
          </Link>
          <Link
            href="/pharmacy/inventory"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Check Available Batches
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Automatic Batch Deduction
              </div>
              <div className="text-[11px] text-slate-400">
                FIFO/FEFO batch assignment logic configured.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-800">
                ABDM Compliance
              </div>
              <div className="text-[11px] text-slate-400">
                Immutable audit trail for every dispensed medicine.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
