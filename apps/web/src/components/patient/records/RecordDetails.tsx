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
  Archive,
  Lock,
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCategoryBadge, getVerificationBadge } from './RecordCard';
import { RecordPreview } from './RecordPreview';
import { formatFileSize } from '@/features/records/lib/document-helpers';
import type { MedicalRecordDetailDto } from '@healthbridge/shared-types';

export interface RecordDetailsProps {
  record: MedicalRecordDetailDto;
  onDownload: () => void;
  onArchive?: () => void;
  isDownloading?: boolean;
  isArchiving?: boolean;
}

export function RecordDetails({
  record,
  onDownload,
  onArchive,
  isDownloading = false,
  isArchiving = false,
}: RecordDetailsProps) {
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
              aria-label="Return to medical documents"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              title="Return to Medical Documents"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Medical Documents</span>
              <span className="text-xs text-muted-foreground/50">/</span>
              <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                {record.title}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5 break-words">
              {record.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/patient/consent?recordId=${record.id}&title=${encodeURIComponent(record.title)}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3 gap-1.5"
              title="Manage consent-based sharing"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Share via Consent</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            className="text-xs h-9 px-3.5 gap-1.5 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </Button>

          {onArchive && record.verificationStatus === 'SELF_SUBMITTED' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onArchive}
              disabled={isArchiving}
              className="text-xs h-9 px-3 gap-1.5 text-error hover:bg-rose-500/10"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Clinical Information & Secure Document Viewer */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border/70 bg-card p-5 space-y-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/60">
              <div className="flex flex-wrap items-center gap-2">
                {getCategoryBadge(record.recordType)}
                {getVerificationBadge(record.verificationStatus)}
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Uploaded {formattedUploadDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Practitioner / Doctor
                </span>
                <p className="text-sm font-bold text-foreground">
                  {record.doctorName || 'Not specified'}
                </p>
                <p className="text-xs text-muted-foreground">Recorded Clinician</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  Healthcare Facility
                </span>
                <p className="text-sm font-bold text-foreground truncate">
                  {record.facilityName || 'Not specified'}
                </p>
                <p className="text-xs text-muted-foreground">Originating Organization</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Document Notes & Summary
              </h3>
              <div className="p-4 rounded-xl bg-muted/15 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-line font-sans">
                {record.description ||
                  'No supplementary notes were recorded for this medical document.'}
              </div>
            </div>

            {/* Secure Document Preview (Short-Lived Access Link + Blob Viewer) */}
            <RecordPreview record={record} onDownload={onDownload} isDownloading={isDownloading} />
          </Card>
        </div>

        {/* Right Column: Security, Access Permissions & Technical Metadata */}
        <div className="space-y-5">
          <Card className="border-border/70 bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-sm font-bold text-foreground">
                Document Metadata & Security
              </CardTitle>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px] block">Document Date:</span>
                <span className="font-semibold text-foreground">{formattedRecordDate}</span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Source:</span>
                <span className="font-semibold text-foreground">
                  {record.source === 'ABDM_INGESTION'
                    ? 'ABDM Imported Record'
                    : record.source === 'EHR_SYNC'
                      ? 'Clinical EHR Record'
                      : 'Patient Self-Uploaded Document'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Access Permissions:</span>
                <span className="font-semibold text-foreground inline-flex items-center gap-1">
                  <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
                  Owner + Consent-Authorized Doctors Only
                </span>
              </div>

              {record.resourceReference && (
                <div>
                  <span className="text-muted-foreground text-[11px] block">Reference ID:</span>
                  <span className="font-mono text-[11px] font-semibold text-foreground break-all">
                    {record.resourceReference}
                  </span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-[11px] block">File Info:</span>
                <span className="font-medium text-foreground break-all">
                  {record.fileName || `${record.title}.pdf`} ({formatFileSize(record.fileSize)})
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] block">Malware Scan Status:</span>
                <span className="font-medium text-foreground">
                  {record.scanStatus === 'CLEAN'
                    ? 'Verified Clean'
                    : record.scanStatus === 'INFECTED'
                      ? 'Quarantined'
                      : 'Scanner Not Configured (Signature Verified)'}
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
                <Code className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showFhir ? 'Hide FHIR Resource' : 'View FHIR DocumentReference'}</span>
              </Button>
            </div>
          </Card>

          <Card className="border-primary/25 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-foreground">
              <Info className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Consent-Guarded Access</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This document is stored privately and never exposed via public URLs. Doctors can only
              preview or download it when active consent exists, and every access event is logged in
              the audit trail.
            </p>
          </Card>

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
                      <CheckCircle className="h-3 w-3 text-teal-500" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" aria-hidden="true" />
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
