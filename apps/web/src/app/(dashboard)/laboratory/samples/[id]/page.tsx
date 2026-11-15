'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useLabSampleDetail,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  LabSampleStatusBadge,
  SpecimenTypeBadge,
  PrintableSampleLabelModal,
  AccessionSampleModal,
  RejectSampleModal,
  SampleTimelineView,
} from '@/components/laboratory';
import {
  FlaskConical,
  ArrowLeft,
  Printer,
  PackageCheck,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function LabSampleDetailPage() {
  const params = useParams();
  const sampleId = params.id as string;

  const { data: sample, isLoading, error, refetch } = useLabSampleDetail(sampleId);

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAccessionModalOpen, setIsAccessionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading specimen record & chain of custody...
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-destructive/20 my-6 shadow-xs max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-foreground mb-1">
          Specimen Record Not Found
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          The requested specimen could not be found or you lack laboratory access permissions.
        </p>
        <Link
          href="/laboratory/samples"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Samples
        </Link>
      </div>
    );
  }

  const canAccession =
    sample.status !== 'ACCESSIONED' &&
    sample.status !== 'REJECTED' &&
    sample.status !== 'COMPLETED';

  const canReject = sample.status !== 'REJECTED' && sample.status !== 'COMPLETED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/laboratory/samples"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
                {sample.sampleNumber}
              </h1>
              <LabSampleStatusBadge status={sample.status} />
              <SpecimenTypeBadge specimenType={sample.specimenType} />
            </div>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-mono mt-0.5">
              Barcode: {sample.barcode}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors border border-border"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            Print Barcode Tag
          </button>

          {canAccession && (
            <button
              onClick={() => setIsAccessionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              Accession Specimen
            </button>
          )}

          {canReject && (
            <button
              onClick={() => setIsRejectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-xl transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject Specimen
            </button>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner if Rejected */}
      {sample.status === 'REJECTED' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Specimen Rejected: {sample.rejectionReasonCode || 'OTHER'}</span>
          </div>
          <p className="pl-6 text-muted-foreground">{sample.rejectionReason}</p>
          {sample.recollectionRequested && (
            <p className="pl-6 font-semibold text-amber-600 dark:text-amber-400">
              Immediate specimen recollection has been requested for this patient.
            </p>
          )}
        </div>
      )}

      {/* Specimen & Order Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Specimen Specifications */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            Specimen Attributes
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Container / Tube</span>
              <span className="font-semibold text-foreground">
                {sample.containerType || 'Standard Container'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Collection Technique</span>
              <span className="font-semibold text-foreground">
                {sample.collectionMethod || 'Venipuncture'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Collection Location</span>
              <span className="font-semibold text-foreground">
                {sample.collectionCenterName || 'Main Laboratory'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Collection Time</span>
              <span className="font-mono text-foreground">
                {sample.collectedAt
                  ? new Date(sample.collectedAt).toLocaleString('en-IN')
                  : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Association */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Associated Diagnostic Order
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Order Number</span>
              <Link
                href={`/laboratory/orders/${sample.orderId}`}
                className="font-mono font-bold text-teal-600 hover:underline"
              >
                {sample.orderNumber}
              </Link>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Patient Name</span>
              <span className="font-semibold text-foreground">
                {sample.patientName || 'Patient'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Assigned Test Codes</span>
              <span className="font-mono font-bold text-foreground">
                {sample.testCodes?.join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Event Chain of Custody */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Chain of Custody & Lifecycle Audit Trail
          </h2>
          <p className="text-xs text-muted-foreground">
            Immutable chronological log of all pre-analytical custody transitions conforming to NABL standards
          </p>
        </div>

        <SampleTimelineView sampleId={sample.id} className="pt-2" />
      </div>

      {/* Modals */}
      {isPrintModalOpen && (
        <PrintableSampleLabelModal
          sampleId={sample.id}
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {isAccessionModalOpen && (
        <AccessionSampleModal
          initialBarcode={sample.barcode}
          isOpen={true}
          onClose={() => setIsAccessionModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {isRejectModalOpen && (
        <RejectSampleModal
          sampleId={sample.id}
          sampleNumber={sample.sampleNumber}
          barcode={sample.barcode}
          isOpen={true}
          onClose={() => setIsRejectModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
