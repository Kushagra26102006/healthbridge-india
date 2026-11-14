'use client';

import React from 'react';
import type { PharmacyPrescriptionQueueItemDto } from '@healthbridge/shared-types';
import {
  X,
  FileText,
  User,
  Stethoscope,
  Pill,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface PrescriptionDetailModalProps {
  prescription: PharmacyPrescriptionQueueItemDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
  prescription,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !prescription) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  Electronic Prescription
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                  {prescription.prescriptionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ABDM Verified E-Prescription • Immutable Clinical Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata banner: Prescriber & Patient cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Card (Minimally necessary data) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Patient Demographics</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {prescription.patientName}
              </div>
              <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                <div>
                  <span className="text-slate-400">Age / Gender:</span>{' '}
                  {prescription.patientAge ? `${prescription.patientAge} Years` : 'N/A'}{' '}
                  {prescription.patientGender ? `(${prescription.patientGender})` : ''}
                </div>
                {prescription.patientPhone && (
                  <div>
                    <span className="text-slate-400">Phone:</span>{' '}
                    {prescription.patientPhone}
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Patient ID:</span>{' '}
                  <span className="font-mono text-[11px] text-slate-500">
                    {prescription.patientId}
                  </span>
                </div>
              </div>
            </div>

            {/* Prescriber Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                <span>Prescribing Practitioner</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {prescription.doctorName}
              </div>
              <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                <div>
                  <span className="text-slate-400">Specialization:</span>{' '}
                  {prescription.doctorSpecialization || 'General Medicine'}
                </div>
                {prescription.facilityName && (
                  <div>
                    <span className="text-slate-400">Facility:</span>{' '}
                    {prescription.facilityName}
                  </div>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <div>
                    <span className="text-slate-400">Issued:</span>{' '}
                    <span className="font-medium text-slate-700">
                      {formatDate(prescription.issueDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Valid Until:</span>{' '}
                    <span className="font-medium text-slate-700">
                      {formatDate(prescription.validUntil)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prescribed Medications Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Pill className="w-4 h-4 text-sky-600" />
                Prescribed Medications ({prescription.medications?.length || 0})
              </h4>
              <span className="text-xs text-slate-400">
                Read-only Doctor Prescription
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Medication
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Dosage & Form
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Frequency
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Duration
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-center">
                      Qty
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Patient Instructions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {prescription.medications && prescription.medications.length > 0 ? (
                    prescription.medications.map((med, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {med.medicationName}
                          </div>
                          {med.genericName && (
                            <div className="text-[11px] text-slate-400">
                              {med.genericName}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px] mr-1">
                            {med.dosageForm || 'Tab'}
                          </span>
                          <span className="text-slate-700 font-medium">{med.strength || med.dosage || '—'}</span>
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-700">
                          {med.frequency || 'As directed'}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {med.duration || '—'}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-900 font-mono">
                          {med.quantity}
                        </td>
                        <td className="px-4 py-3 text-slate-600 italic">
                          {med.instructions || 'Standard administration'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        No medication items listed in this prescription.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical Instructions / Notes (Strictly Read-Only & Highlighted) */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Doctor&apos;s Clinical Instructions (Strictly Read-Only &amp; Immutable)</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-sans">
              {prescription.instructions
                ? prescription.instructions
                : 'No specific clinical precautions recorded by the attending doctor.'}
            </p>
          </div>

          {/* ABDM Regulatory & Privacy Notice */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-slate-700">
                ABDM Electronic Prescription Verification
              </p>
              <p className="text-[11px] text-slate-500 leading-normal">
                This prescription has been digitally authorized by an NMC-registered medical practitioner. In compliance with the Drugs and Cosmetics Act & ABDM Health Data Management Policy, pharmacies must not modify doctor dosages or clinical directives.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Status:{' '}
            <strong className="text-slate-800 uppercase font-mono">
              {prescription.status}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Prescription
          </button>
        </div>
      </div>
    </div>
  );
};
