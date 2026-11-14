'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Pill,
  User,
  Building2,
  Edit3,
  Ban,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrescriptionDocument } from './PrescriptionDocument';
import { PrescriptionDetailDto } from '@healthbridge/shared-types';

interface PrescriptionDetailsProps {
  prescription: PrescriptionDetailDto;
  onDiscontinue?: (reason: string) => void;
  isDiscontinuing?: boolean;
}

export function PrescriptionDetails({
  prescription,
  onDiscontinue,
  isDiscontinuing = false,
}: PrescriptionDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'document'>('overview');
  const [showDiscontinueModal, setShowDiscontinueModal] = useState(false);
  const [discontinueReason, setDiscontinueReason] = useState('');

  const isDraft = prescription.status === 'DRAFT';
  const isActive = prescription.status === 'ACTIVE';

  const handleDiscontinueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discontinueReason.trim()) return;
    onDiscontinue?.(discontinueReason.trim());
    setShowDiscontinueModal(false);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link href="/doctor/prescriptions">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight font-mono">
                {prescription.prescriptionNumber}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isDraft
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : prescription.status === 'DISCONTINUED'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {prescription.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Issued on {formattedIssuedDate} &bull; Valid until {formattedValidUntil}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="p-1 rounded-lg bg-muted/40 border border-border flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Clinical Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'document'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Print Document
            </button>
          </div>

          {isDraft && (
            <Link href={`/doctor/prescriptions/${prescription.id}/edit`}>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                <Edit3 className="h-3.5 w-3.5" />
                Edit Draft
              </Button>
            </Link>
          )}

          {isActive && onDiscontinue && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDiscontinueModal(true)}
              className="h-8 text-xs gap-1.5 border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <Ban className="h-3.5 w-3.5" />
              Discontinue
            </Button>
          )}
        </div>
      </div>

      {/* Discontinue Modal */}
      {showDiscontinueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full border border-border shadow-xl bg-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-foreground">
                  Discontinue Prescription
                </CardTitle>
              </div>
            </CardHeader>
            <form onSubmit={handleDiscontinueSubmit}>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Please document the clinical reason for discontinuing this prescription. This action is permanently recorded in the audit trail.
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">
                    Discontinuation Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={discontinueReason}
                    onChange={(e) => setDiscontinueReason(e.target.value)}
                    placeholder="e.g. Adverse gastric intolerance observed; switching patient to alternate anti-inflammatory regimen..."
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    required
                    minLength={3}
                  />
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscontinueModal(false)}
                  disabled={isDiscontinuing}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isDiscontinuing || !discontinueReason.trim()}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  {isDiscontinuing ? 'Discontinuing...' : 'Confirm Discontinuation'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* View Selector: Overview vs Printable Document */}
      {activeTab === 'document' ? (
        <PrescriptionDocument
          prescription={prescription}
          onBack={() => setActiveTab('overview')}
        />
      ) : (
        <div className="space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Patient Card */}
            <Card className="border border-border/80 bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-600">
                  <User className="h-4 w-4" />
                  <span>Patient Identity</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {prescription.patientName || 'Authorized Patient'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {prescription.patientId}
                  </p>
                  {prescription.patientAbhaId && (
                    <span className="text-[11px] text-blue-600 font-mono block mt-1">
                      ABHA: {prescription.patientAbhaId}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescribing Doctor Card */}
            <Card className="border border-border/80 bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Attending Doctor</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{prescription.doctorName}</h3>
                  {prescription.doctorSpecialization && (
                    <p className="text-xs text-muted-foreground">
                      {prescription.doctorSpecialization.join(', ')}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground font-mono mt-1">
                    Reg: {prescription.doctorRegistrationNumber || 'MCI-REG-VERIFIED'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Clinic / Facility Card */}
            <Card className="border border-border/80 bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
                  <Building2 className="h-4 w-4" />
                  <span>Facility & Validity</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {prescription.facilityName || 'Main Healthcare Facility'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Valid Until: {formattedValidUntil}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Dispensing Refills: {prescription.refillsAllowed || 0} allowed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diagnosis banner if provided */}
          {prescription.diagnosis && (
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
                Provisional / Clinical Diagnosis
              </span>
              <p className="text-foreground font-medium">{prescription.diagnosis}</p>
            </div>
          )}

          {/* Prescribed Medications Section */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Prescribed Medications ({prescription.medications.length})
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {prescription.medications.map((m, idx) => (
                  <div key={m.id || idx} className="p-4 hover:bg-muted/10 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-blue-600 font-mono">
                            #{idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-foreground">{m.name}</h4>
                          <Badge variant="outline" className="text-[10px] bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                            {m.strength}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            Qty: {m.quantity}
                          </Badge>
                          {m.status === 'DISCONTINUED' && (
                            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-300">
                              Discontinued
                            </Badge>
                          )}
                        </div>
                        {m.genericName && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            Composition: {m.genericName}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-bold text-foreground">{m.dosage}</span>
                        <span className="text-muted-foreground block text-[10px]">{m.route}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-muted/20 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Frequency</span>
                        <span className="font-medium text-foreground">{m.frequency}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Duration</span>
                        <span className="font-medium text-foreground">{m.duration}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Dispense Quantity</span>
                        <span className="font-medium text-foreground">{m.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Route</span>
                        <span className="font-medium text-foreground">{m.route}</span>
                      </div>
                    </div>

                    {m.instructions && (
                      <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 pt-0.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>Instructions: {m.instructions}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions and Follow-up Advice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-border/80 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  General Administration & Dietary Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {prescription.instructions}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Follow-Up Review & Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {prescription.followUpInstructions || 'Return to clinic if symptoms persist or in case of any drug allergy.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}