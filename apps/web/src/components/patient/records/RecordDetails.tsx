'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  User,
  ShieldCheck,
  Download,
  Share2,
  FileText,
  Clock,
  Info,
  Code,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCategoryBadge, getVerificationBadge } from './RecordCard';
import { RecordPreview } from './RecordPreview';
import type { MedicalRecordDetailDto } from '@healthbridge/shared-types';

export interface RecordDetailsProps {
  record: MedicalRecordDetailDto;
  onDownload: () => void;
  isDownloading?: boolean;
}

export function RecordDetails({ record, onDownload, isDownloading = false }: RecordDetailsProps) {
  const [showFhir, setShowFhir] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  const formattedRecordDate = new Date(record.recordDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedUploadDate = new Date(record.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCopyFhir = () => {
    if (record.fhirResource) {
      navigator.clipboard.writeText(JSON.stringify(record.fhirResource, null, 2));
      setCopiedFhir(true);
      setTimeout(() => setCopiedFhir(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patient/records">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              title="Return to Health Records List"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Health Records</span>
              <span className="text-xs text-muted-foreground/50">/</span>
              <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                {record.title}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {record.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Share via Consent Workflow (ABDM DISHA Guarded) */}
          <Link
            href={`/patient/consent?recordId=${record.id}&title=${encodeURIComponent(record.title)}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3 gap-1.5"
              title="Share with doctor or healthcare facility via consent"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share via Consent</span>
            </Button>
          </Link>

          {/* Download Document */}
          <Button
            variant="teal"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            className="text-xs h-9 px-3.5 gap-1.5 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Clinical Information & Notes */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border/70 bg-card p-5 space-y-5 shadow-xs">
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                {getCategoryBadge(record.recordType)}
                {getVerificationBadge(record.verificationStatus)}
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Indexed {formattedUploadDate}
              </span>
            </div>

            {/* Provider and Facility Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Practitioner / Doctor
                </span>
                <p className="text-sm font-bold text-foreground">
                  {record.doctorName || 'Authorized Medical Practitioner'}
                </p>
                <p className="text-xs text-muted-foreground">Treating Clinician</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Healthcare Facility
                </span>
                <p className="text-sm font-bold text-foreground truncate">
                  {record.facilityName || 'Registered Healthcare Facility'}
                </p>
                <p className="text-xs text-muted-foreground">Originating Organization</p>
              </div>
            </div>

            {/* Description & Clinical Observations */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Clinical Summary & Observations
              </h3>
              <div className="p-4 rounded-xl bg-muted/15 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-line font-sans">
                {record.description ||
                  'No supplementary clinical notes or observations were entered for this medical record.'}
              </div>
            </div>

            {/* Document safe preview */}
            <RecordPreview record={record} onDownload={onDownload} isDownloading={isDownloading} />
          </Card>
        </div>

        {/* Right Column: ABDM Technical & Security Specifications */}
        <div className="space-y-5">
          {/* ABDM & Privacy Metadata */}
          <Card className="border-border/70 bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-sm font-bold text-foreground">
                ABDM & Privacy Identity
              </CardTitle>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px] block">Record Date:</span>
                <span className="font-semibold text-foreground">{formattedRecordDate}</span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Ingestion Source:</span>
                <span className="font-semibold text-foreground">
                  {record.source === 'ABDM_INGESTION'
                    ? 'ABDM Health Information Provider (HIP)'
                    : record.source === 'EHR_SYNC'
                      ? 'Hospital Electronic Health Record Sync'
                      : 'Citizen Self-Reported Document'}
                </span>
              </div>

              {record.resourceReference && (
                <div>
                  <span className="text-muted-foreground text-[11px] block">
                    Health Information Exchange Reference:
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-foreground break-all">
                    {record.resourceReference}
                  </span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-[11px] block">File Metadata:</span>
                <span className="font-medium text-foreground">
                  {record.fileName || `${record.title}.pdf`} ({formatFileSize(record.fileSize)})
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFhir(!showFhir)}
                className="w-full text-xs h-8 gap-1.5"
              >
                <Code className="h-3.5 w-3.5" />
                <span>{showFhir ? 'Hide FHIR Resource' : 'View FHIR DocumentReference'}</span>
              </Button>
            </div>
          </Card>

          {/* Consent and Sharing Guard */}
          <Card className="border-teal-500/30 bg-teal-500/5 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-teal-900 dark:text-teal-300">
              <Info className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Consent-Based Sharing</span>
            </div>
            <p className="text-[11px] text-teal-800 dark:text-teal-200/90 leading-relaxed">
              In compliance with ABDM and DISHA, this medical record cannot be accessed by doctors
              or clinics without your explicit electronic consent. Use the consent module to manage
              or revoke data access at any time.
            </p>
          </Card>

          {/* FHIR DocumentReference Viewer (if expanded) */}
          {showFhir && record.fhirResource && (
            <Card className="border-border/70 bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-foreground">HL7 FHIR R4 JSON</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyFhir}
                  className="h-7 px-2 text-[11px] gap-1"
                >
                  {copiedFhir ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-teal-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-muted/40 text-[10px] font-mono overflow-x-auto max-h-60 leading-snug">
                {JSON.stringify(record.fhirResource, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecordDetails;
