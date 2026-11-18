'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Award,
  HeartPulse,
  Calendar,
  Building2,
  User,
  Download,
  ChevronRight,
  ShieldCheck,
  Clock,
  ScanLine,
  FileBadge2,
  FolderArchive,
  Eye,
  Archive,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/features/records/lib/document-helpers';
import type { IMedicalRecord, MedicalRecordType } from '@healthbridge/shared-types';
import { cn } from '@/lib/utils';

export interface RecordCardProps {
  record: IMedicalRecord;
  onPreview?: (record: IMedicalRecord) => void;
  onDownload?: (recordId: string, fileName?: string) => void;
  onArchive?: (record: IMedicalRecord) => void;
  isDownloading?: boolean;
}

export const getCategoryIcon = (type: MedicalRecordType) => {
  switch (type) {
    case 'OP_CONSULTATION':
      return { icon: Stethoscope, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/15' };
    case 'DISCHARGE_SUMMARY':
      return { icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15' };
    case 'DIAGNOSTIC_REPORT':
      return {
        icon: FlaskConical,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-500/15',
      };
    case 'IMAGING_REPORT':
      return {
        icon: ScanLine,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-500/15',
      };
    case 'PRESCRIPTION':
      return { icon: Pill, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15' };
    case 'MEDICAL_CERTIFICATE':
      return {
        icon: FileBadge2,
        color: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-500/15',
      };
    case 'IMMUNIZATION_RECORD':
      return {
        icon: Award,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/15',
      };
    case 'OTHER_MEDICAL_DOCUMENT':
      return {
        icon: FolderArchive,
        color: 'text-slate-600 dark:text-slate-300',
        bg: 'bg-slate-500/15',
      };
    case 'WELLNESS_RECORD':
    default:
      return { icon: HeartPulse, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/15' };
  }
};

export const getCategoryBadge = (type: MedicalRecordType) => {
  switch (type) {
    case 'OP_CONSULTATION':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-teal-500/30 text-teal-700 dark:text-teal-300 bg-teal-500/10"
        >
          Consultation
        </Badge>
      );
    case 'DISCHARGE_SUMMARY':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10"
        >
          Discharge Summary
        </Badge>
      );
    case 'DIAGNOSTIC_REPORT':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-indigo-500/30 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10"
        >
          Lab Report
        </Badge>
      );
    case 'IMAGING_REPORT':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-500/10"
        >
          Imaging Report
        </Badge>
      );
    case 'PRESCRIPTION':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10"
        >
          Prescription
        </Badge>
      );
    case 'MEDICAL_CERTIFICATE':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/10"
        >
          Medical Certificate
        </Badge>
      );
    case 'IMMUNIZATION_RECORD':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
        >
          Immunization
        </Badge>
      );
    case 'OTHER_MEDICAL_DOCUMENT':
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-slate-400/40 text-slate-700 dark:text-slate-300 bg-slate-500/10"
        >
          Other Document
        </Badge>
      );
    case 'WELLNESS_RECORD':
    default:
      return (
        <Badge
          variant="outline"
          className="text-[11px] border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10"
        >
          Wellness Record
        </Badge>
      );
  }
};

export const getVerificationBadge = (status?: string) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge variant="teal" className="text-[10px] px-2 py-0.5 gap-1 font-semibold">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          <span>Verified</span>
        </Badge>
      );
    case 'SELF_SUBMITTED':
      return (
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
          <span>Self Submitted</span>
        </Badge>
      );
    case 'PENDING':
    default:
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 gap-1 text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10"
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>Pending</span>
        </Badge>
      );
  }
};

export function RecordCard({
  record,
  onPreview,
  onDownload,
  onArchive,
  isDownloading = false,
}: RecordCardProps) {
  const { icon: Icon, color, bg } = getCategoryIcon(record.recordType);
  const formattedDate = new Date(record.recordDate || record.createdAt).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

  return (
    <Card className="p-4 border-border/70 bg-card hover:border-primary/40 transition-all duration-200 shadow-xs hover:shadow-card">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              bg,
              color
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {getCategoryBadge(record.recordType)}
              {getVerificationBadge(record.verificationStatus)}
            </div>
            <Link
              href={`/patient/records/${record.id}`}
              className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {record.title}
            </Link>
          </div>
        </div>

        <Link
          href={`/patient/records/${record.id}`}
          aria-label={`Open details for ${record.title}`}
          className="shrink-0 text-muted-foreground hover:text-foreground p-1 rounded focus-ring"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 pb-3 border-b border-border/50">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
          <span className="truncate">{formattedDate}</span>
          {record.fileSize !== undefined && (
            <span className="text-[11px] text-muted-foreground/80">
              • {formatFileSize(record.fileSize)}
            </span>
          )}
        </div>

        {record.doctorName && (
          <div className="flex items-center gap-1.5 truncate">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span className="truncate">{record.doctorName}</span>
          </div>
        )}

        {record.facilityName && (
          <div className="flex items-center gap-1.5 truncate sm:col-span-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span className="truncate">{record.facilityName}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5">
        <span className="text-[11px] text-muted-foreground/80 truncate">
          {record.source === 'ABDM_INGESTION'
            ? 'Source: ABDM Import'
            : record.source === 'EHR_SYNC'
              ? 'Source: Clinical EHR'
              : 'Source: Patient Upload'}
        </span>

        <div className="flex items-center gap-1.5">
          {onPreview && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onPreview(record)}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              <span>Preview</span>
            </Button>
          )}
          {onDownload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDownload(record.id, record.fileName)}
              disabled={isDownloading}
              aria-label={`Download ${record.title}`}
              className="h-8 px-2.5 text-xs gap-1"
              title="Download Medical Record"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          )}
          {onArchive && record.verificationStatus === 'SELF_SUBMITTED' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onArchive(record)}
              aria-label={`Archive ${record.title}`}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-error"
              title="Archive self-uploaded document"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default RecordCard;
