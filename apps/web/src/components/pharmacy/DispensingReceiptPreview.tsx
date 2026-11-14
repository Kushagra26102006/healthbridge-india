'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Printer,
  ArrowLeft,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { usePharmacyDispensingReceipt } from '@/features/pharmacy/hooks/use-pharmacy';

export interface DispensingReceiptPreviewProps {
  receiptId: string;
}

export function DispensingReceiptPreview({ receiptId }: DispensingReceiptPreviewProps) {
  const { data, isLoading, error } = usePharmacyDispensingReceipt(receiptId);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Generating CDSCO dispensing receipt...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 max-w-xl mx-auto my-8">
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h3 className="text-base font-semibold text-destructive">
            Unable to Load Dispensing Receipt
          </h3>
          <p className="text-xs text-muted-foreground">
            {error?.message || 'Receipt record not found or inaccessible.'}
          </p>
          <Link href="/pharmacy/dispensing/history">
            <Button variant="outline" size="sm">
              Return to Dispensing History
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { dispensingRecord: record, disclaimer, generatedAt } = data;
  const subtotal = record.items.reduce((sum, it) => sum + it.itemTotal, 0);
  const gst = Math.round(subtotal * 0.05 * 100) / 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between gap-3 print:hidden bg-card p-4 rounded-lg border">
        <Link href="/pharmacy/dispensing/history">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dispensing History
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/pharmacy/dispensing/${record.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              View Audit Record
            </Button>
          </Link>
          <Button
            onClick={handlePrint}
            size="sm"
            className="gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm p-6 sm:p-10 font-sans print:border-none print:shadow-none print:p-0">
        {/* Header / Pharmacy Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-700" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {record.pharmacyName}
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {record.pharmacyAddress?.line1 && `${record.pharmacyAddress.line1}, `}
              {record.pharmacyAddress?.city}, {record.pharmacyAddress?.state} -{' '}
              {record.pharmacyAddress?.postalCode}
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 mt-1 flex-wrap">
              <span>Drug Lic #: {record.pharmacyLicenseNumber || 'DL-PENDING'}</span>
              {record.pharmacyGstin && <span>GSTIN: {record.pharmacyGstin}</span>}
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="inline-block bg-slate-900 text-white font-mono text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider">
              Dispensing Receipt
            </span>
            <p className="font-mono text-xs font-bold text-slate-800 mt-1.5">
              Ref: {record.dispensingNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Date: {new Date(record.dispensedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Prescription, Patient & Doctor Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
          {/* Patient Details */}
          <div className="space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Patient Information
            </span>
            <p className="font-bold text-sm text-slate-900">{record.patientName}</p>
            <p className="text-slate-600">
              Age: {record.patientAge ? `${record.patientAge} Years` : 'N/A'} | Gender:{' '}
              {record.patientGender || 'N/A'}
            </p>
            {record.patientPhone && <p className="text-slate-600">Phone: {record.patientPhone}</p>}
          </div>

          {/* Doctor & Prescription Details */}
          <div className="space-y-1 sm:text-right">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Prescription & Prescriber
            </span>
            <p className="font-bold text-sm text-slate-900">{record.doctorName}</p>
            <p className="text-slate-600">
              {record.doctorSpecialization || 'Physician'}
              {record.facilityName ? ` • ${record.facilityName}` : ''}
            </p>
            <p className="font-mono text-slate-800 font-semibold">
              Rx #: {record.prescriptionNumber}
            </p>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2 text-left w-8">#</th>
                <th className="py-2 text-left">Medicine / Generic</th>
                <th className="py-2 text-left">Batch No.</th>
                <th className="py-2 text-left">Expiry</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate (₹)</th>
                <th className="py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {record.items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-2.5 font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-2.5">
                    <span className="font-bold text-slate-900 block">{item.medicationName}</span>
                    {item.genericName && item.genericName !== item.medicationName && (
                      <span className="text-[10px] text-slate-500 block">
                        ({item.genericName})
                      </span>
                    )}
                    {item.strength && (
                      <span className="text-[10px] text-slate-600">
                        {item.dosageForm} - {item.strength}
                      </span>
                    )}
                    {item.dosageInstructions && (
                      <span className="text-[10px] text-emerald-800 italic block mt-0.5">
                        Sig: {item.dosageInstructions}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] font-semibold text-slate-700">
                    {item.batchNumber}
                  </td>
                  <td className="py-2.5 text-slate-600">
                    {new Date(item.batchExpiryDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2.5 text-center font-bold text-slate-900">
                    {item.quantityDispensed}
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-700">
                    ₹{item.sellingPriceSnapshot.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900">
                    ₹{item.itemTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Signatures Grid */}
        <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start text-xs">
          {/* Notes & Status */}
          <div className="space-y-2">
            <div>
              <span className="font-bold text-slate-700 block">Dispensing Status:</span>
              <span className="font-semibold text-emerald-700">
                {record.dispensingStatus === 'FULLY_DISPENSED'
                  ? 'FULL DISPENSATION COMPLETED'
                  : 'PARTIAL DISPENSATION COMPLETED'}
              </span>
            </div>
            {record.notes && (
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700 block">Pharmacist Remarks:</span>
                <span className="text-slate-600">{record.notes}</span>
              </div>
            )}
            <div className="pt-8">
              <div className="border-t border-slate-400 w-48 pt-1 text-center">
                <span className="font-bold text-slate-900 block">{record.dispenserName}</span>
                <span className="text-[10px] text-slate-500">Registered Pharmacist Signature</span>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="space-y-1.5 sm:text-right bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Items Total Units:</span>
              <span className="font-semibold text-slate-900">
                {record.totalQuantityDispensed} units
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (5%):</span>
              <span className="font-semibold text-slate-900">₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
              <span>Amount Paid:</span>
              <span className="text-lg text-emerald-800">
                ₹{(subtotal + gst).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* CDSCO Legal Disclaimer Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed text-center">
          <p className="font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Statutory Notice
          </p>
          <p>{disclaimer}</p>
          <p className="text-slate-400 mt-1">
            Generated on {new Date(generatedAt).toLocaleString('en-IN')} via HealthBridge India ABDM Architecture
          </p>
        </div>
      </div>
    </div>
  );
}

export default DispensingReceiptPreview;
