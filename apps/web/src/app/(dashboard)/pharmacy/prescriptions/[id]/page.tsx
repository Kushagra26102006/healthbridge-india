'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  usePharmacyPrescriptionDetail,
  useVerifyPrescription,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PrescriptionVerificationBadge } from '@/components/pharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Stethoscope,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Pill,
  FileText,
  Printer,
} from 'lucide-react';

export default function PharmacyPrescriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [showDocPreview, setShowDocPreview] = useState(false);

  const {
    data: prescription,
    isLoading: isRxLoading,
    error: rxError,
  } = usePharmacyPrescriptionDetail(id);

  const {
    data: verification,
    isLoading: isVerifying,
  } = useVerifyPrescription(id);

  if (isRxLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading prescription details...</p>
      </div>
    );
  }

  if (rxError || !prescription) {
    return (
      <Card className="max-w-xl mx-auto my-8 border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h3 className="text-base font-semibold text-destructive">Prescription Not Found</h3>
          <p className="text-xs text-muted-foreground">
            {rxError?.message || 'Unable to retrieve prescription information.'}
          </p>
          <Link href="/pharmacy/prescriptions">
            <Button variant="outline" size="sm">
              Back to Prescription Queue
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/pharmacy/prescriptions">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              Queue
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                Prescription #{prescription.prescriptionNumber}
              </h1>
              {verification ? (
                <PrescriptionVerificationBadge
                  status={verification.verificationStatus}
                  isEligible={verification.isEligibleForDispensing}
                />
              ) : (
                <Badge variant="outline">{prescription.status}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Issued: {new Date(prescription.issueDate).toLocaleDateString('en-IN')} | Valid Until:{' '}
              {new Date(prescription.validUntil).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDocPreview((prev) => !prev)}
            className="gap-1.5 text-xs"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{showDocPreview ? 'Hide Rx Document' : 'Preview Rx Document'}</span>
          </Button>
          {showDocPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs print:hidden"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print Rx</span>
            </Button>
          )}
          {verification?.isEligibleForDispensing && (
            <Link href={`/pharmacy/dispensing?prescriptionId=${prescription.id}`}>
              <Button className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <Pill className="w-4 h-4" />
                Open Dispensing Console
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Authorized Prescription-Only Document Preview Sheet (zero access to general patient EHR) */}
      {showDocPreview && (
        <Card className="border-primary/30 bg-card p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border">
            <div>
              <p className="text-[11px] font-mono uppercase text-primary font-semibold">
                Authorized Pharmacy Fulfillment Copy • Rx #{prescription.prescriptionNumber}
              </p>
              <h2 className="text-base font-bold text-foreground mt-0.5">
                {prescription.facilityName || 'Authorized Healthcare Facility'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Prescribing Clinician: {prescription.doctorName}
                {prescription.doctorSpecialization ? ` (${prescription.doctorSpecialization})` : ''}
              </p>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right">
              <div>
                Issued: <strong className="text-foreground">{new Date(prescription.issueDate).toLocaleDateString('en-IN')}</strong>
              </div>
              <div>
                Valid Until: <strong className="text-foreground">{new Date(prescription.validUntil).toLocaleDateString('en-IN')}</strong>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>
              Scoped strictly to this routed prescription for dispensing verification. General patient medical records remain restricted.
            </span>
          </div>
        </Card>
      )}

      {/* Verification Status Overview Card */}
      {verification && (
        <Card className="border-border">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Prescription Authenticity & Verification Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded bg-muted/30 border">
              <span className="text-muted-foreground block text-[11px]">Doctor Valid</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {verification.verificationChecks.doctorExists ? 'Verified' : 'Invalid'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-muted/30 border">
              <span className="text-muted-foreground block text-[11px]">Patient Valid</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {verification.verificationChecks.patientExists ? 'Verified' : 'Invalid'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-muted/30 border">
              <span className="text-muted-foreground block text-[11px]">Validity Window</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {verification.verificationChecks.notExpired ? 'Active' : 'Expired'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-muted/30 border">
              <span className="text-muted-foreground block text-[11px]">Dispensing Eligible</span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                {verification.isEligibleForDispensing ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Eligible ({verification.totalRemainingUnits} units left)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    Ineligible
                  </>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient & Doctor Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Patient</span>
          </div>
          <p className="font-bold text-sm text-foreground">{prescription.patientName}</p>
          <p className="text-muted-foreground">
            {prescription.patientAge ? `${prescription.patientAge} Years` : 'Age N/A'} •{' '}
            {prescription.patientGender || 'Gender N/A'}
          </p>
          {prescription.patientPhone && (
            <p className="text-muted-foreground">Phone: {prescription.patientPhone}</p>
          )}
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-primary" />
            <span>Doctor</span>
          </div>
          <p className="font-bold text-sm text-foreground">{prescription.doctorName}</p>
          <p className="text-muted-foreground">
            {prescription.doctorSpecialization || 'Treating Physician'}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Healthcare Facility</span>
          </div>
          <p className="font-bold text-sm text-foreground">
            {prescription.facilityName || 'Authorized Healthcare Facility'}
          </p>
          <p className="text-muted-foreground">ABDM Health Repository Network</p>
        </Card>
      </div>

      {/* Prescribed Items Table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Prescribed Medications ({prescription.medications.length} items)</span>
            {verification?.isEligibleForDispensing && (
              <Link href={`/pharmacy/dispensing?prescriptionId=${prescription.id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-primary">
                  Verify & Dispense
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3 text-left">Medicine</th>
                <th className="py-2.5 px-3 text-left">Form & Strength</th>
                <th className="py-2.5 px-3 text-left">Frequency</th>
                <th className="py-2.5 px-3 text-left">Duration</th>
                <th className="py-2.5 px-3 text-center">Prescribed</th>
                <th className="py-2.5 px-3 text-left">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {prescription.medications.map((m, idx) => (
                <tr key={idx} className="hover:bg-muted/10">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground block">{m.medicationName}</span>
                    {m.genericName && m.genericName !== m.medicationName && (
                      <span className="text-[11px] text-muted-foreground block">
                        Generic: {m.genericName}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="outline" className="text-[10px] mr-1">
                      {m.dosageForm || 'Tablet'}
                    </Badge>
                    <span className="text-muted-foreground">{m.strength || m.dosage}</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground">
                    {m.frequency || 'As directed'}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{m.duration || '—'}</td>
                  <td className="py-3 px-3 text-center font-bold text-foreground">
                    {m.quantity}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground italic">
                    {m.instructions || 'Standard administration'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Clinical Instructions */}
      {prescription.instructions && (
        <Card className="border-amber-200 bg-amber-50/60 p-4">
          <h4 className="text-xs font-bold text-amber-900 mb-1">
            Doctor&apos;s Clinical Precautions & Instructions
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed font-sans">
            {prescription.instructions}
          </p>
        </Card>
      )}
    </div>
  );
}
