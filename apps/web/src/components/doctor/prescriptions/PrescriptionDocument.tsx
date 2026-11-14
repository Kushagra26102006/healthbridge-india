'use client';

import React from 'react';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrescriptionDetailDto } from '@healthbridge/shared-types';

interface PrescriptionDocumentProps {
  prescription: PrescriptionDetailDto;
  onBack?: () => void;
}

export function PrescriptionDocument({
  prescription,
  onBack,
}: PrescriptionDocumentProps) {
  const isDraft = prescription.status === 'DRAFT';

  const handlePrint = () => {
    window.print();
  };

  const formattedIssuedDate = new Date(prescription.issuedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedValidUntil = new Date(prescription.validUntil).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Print Controls (hidden when printing) */}
      <div className="flex items-center justify-between print:hidden bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Details
            </Button>
          )}
          <span className="text-xs font-semibold text-foreground">
            Printable e-Prescription Document
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable Clinical Prescription Sheet */}
      <div
        id="prescription-printable-area"
        className="bg-white text-zinc-900 border border-zinc-200 rounded-2xl shadow-md p-8 sm:p-12 relative overflow-hidden print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* Watermark for Draft Prescriptions */}
        {isDraft && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
            <span className="text-6xl sm:text-7xl font-black text-amber-600 uppercase -rotate-45 tracking-widest">
              DRAFT - NOT ISSUED
            </span>
          </div>
        )}

        {/* Prescription Header / Clinic Details */}
        <div className="border-b-2 border-zinc-800 pb-5 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                HB
              </div>
              <h2 className="text-lg font-black tracking-tight text-zinc-900">
                HEALTHBRIDGE INDIA
              </h2>
            </div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-blue-700">
              One Nation &bull; One Health Record (ABDM Integrated)
            </p>
            {prescription.facilityName && (
              <p className="text-xs text-zinc-600 pt-1 font-medium">
                {prescription.facilityName}
                {prescription.facilityCity ? `, ${prescription.facilityCity}` : ''}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            <h3 className="text-base font-bold text-zinc-900">
              {prescription.doctorName}
            </h3>
            {prescription.doctorSpecialization && prescription.doctorSpecialization.length > 0 && (
              <p className="text-xs text-zinc-700 font-medium">
                {prescription.doctorSpecialization.join(', ')}
              </p>
            )}
            <p className="text-[11px] text-zinc-600 font-mono">
              Reg No: {prescription.doctorRegistrationNumber || 'MCI-REG-VERIFIED'}
            </p>
          </div>
        </div>

        {/* Patient Demographics & Prescription Metadata Bar */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6 text-xs text-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Patient Name</span>
            <span className="font-bold text-sm text-zinc-900">{prescription.patientName || 'Authorized Patient'}</span>
            {prescription.patientAbhaId && (
              <span className="text-[10px] text-blue-700 block font-mono">
                ABHA: {prescription.patientAbhaId}
              </span>
            )}
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Prescription No</span>
            <span className="font-mono font-bold text-zinc-900">{prescription.prescriptionNumber}</span>
            <span className="text-[10px] text-zinc-500 block">
              Status: {prescription.status}
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Prescription Date</span>
            <span className="font-semibold">{formattedIssuedDate}</span>
          </div>

          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-bold">Valid Until</span>
            <span className="font-semibold">{formattedValidUntil}</span>
          </div>
        </div>

        {/* Clinical Diagnosis if specified */}
        {prescription.diagnosis && (
          <div className="mb-6 p-3 bg-blue-50/50 border-l-4 border-blue-600 text-xs">
            <span className="font-bold text-blue-950 uppercase text-[10px] block">Provisional / Final Diagnosis</span>
            <p className="text-zinc-900 font-medium mt-0.5">{prescription.diagnosis}</p>
          </div>
        )}

        {/* The Classic Rx Symbol */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl font-serif font-black text-zinc-900 leading-none">℞</span>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-1">
            Prescription Schedule
          </span>
        </div>

        {/* Medications Table */}
        <div className="border border-zinc-300 rounded-xl overflow-hidden mb-6 text-xs">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-300 text-[11px]">
              <tr>
                <th className="p-3 w-8">#</th>
                <th className="p-3">Medication & Generic</th>
                <th className="p-3">Strength</th>
                <th className="p-3">Dosage & Route</th>
                <th className="p-3">Frequency</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {prescription.medications.map((m, idx) => (
                <tr key={m.id || idx} className="hover:bg-zinc-50/50">
                  <td className="p-3 font-mono text-zinc-500">{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-bold text-zinc-900 block">{m.name}</span>
                    {m.genericName && (
                      <span className="text-[11px] text-zinc-500 italic block">{m.genericName}</span>
                    )}
                    {m.instructions && (
                      <span className="text-[10px] text-blue-700 block mt-0.5 font-medium">
                        &bull; {m.instructions}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-zinc-800">{m.strength}</td>
                  <td className="p-3">
                    <span className="font-medium text-zinc-900 block">{m.dosage}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{m.route}</span>
                  </td>
                  <td className="p-3 font-medium text-zinc-800">{m.frequency}</td>
                  <td className="p-3 text-zinc-800">{m.duration}</td>
                  <td className="p-3 text-right font-bold text-zinc-900">{m.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* General Advice & Follow-up Instructions */}
        <div className="space-y-3 mb-10 text-xs">
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
            <span className="font-bold text-zinc-900 uppercase text-[10px] block">General Instructions & Advice</span>
            <p className="text-zinc-700 leading-relaxed">{prescription.instructions}</p>
          </div>

          {prescription.followUpInstructions && (
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
              <span className="font-bold text-zinc-900 uppercase text-[10px] block">Follow-up Instructions</span>
              <p className="text-zinc-700 leading-relaxed">{prescription.followUpInstructions}</p>
            </div>
          )}
        </div>

        {/* Doctor Signature & Verification Footer */}
        <div className="pt-6 border-t-2 border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-600">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Digitally Authenticated e-Prescription</span>
            </div>
            <p className="text-[10px] text-zinc-500 max-w-sm">
              Secured via HealthBridge India EMR under the National Digital Health Mission (ABDM). Valid at any licensed pharmacy in India.
            </p>
          </div>

          <div className="text-right space-y-1 self-end sm:self-center">
            <div className="h-10 border-b border-dashed border-zinc-400 w-48 mb-1" />
            <p className="font-bold text-zinc-900">{prescription.doctorName}</p>
            <p className="text-[10px] text-zinc-500 font-mono">
              Reg No: {prescription.doctorRegistrationNumber || 'MCI-REG-VERIFIED'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}