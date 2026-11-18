'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { PatientEmptyState } from './PatientEmptyState';
import { SecureDocumentViewerModal } from '@/components/documents/SecureDocumentViewer';
import { useDoctorPatientRecords } from '@/features/doctor/hooks/use-doctor';
import { recordsApi } from '@/features/records/api/records-api';
import {
  DOCUMENT_CATEGORIES,
  getRecordCategoryLabel,
} from '@/features/records/lib/document-helpers';
import type {
  MedicalRecordType,
  PatientRecordFilterQueryDto,
} from '@healthbridge/shared-types';

interface MedicalRecordListProps {
  patientId: string;
}

const RECORD_TYPES: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'All Documents' },
  ...DOCUMENT_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
];

export const MedicalRecordList: React.FC<MedicalRecordListProps> = ({ patientId }) => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    title: string;
    recordType: MedicalRecordType;
    recordDate: string;
    createdAt: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    doctorName?: string;
    facilityName?: string;
    verificationStatus?: 'VERIFIED' | 'PENDING' | 'SELF_SUBMITTED';
    source: 'MANUAL_ENTRY' | 'ABDM_INGESTION' | 'EHR_SYNC';
  } | null>(null);
  const limit = 10;

  const query: PatientRecordFilterQueryDto = {
    recordType: selectedType === 'ALL' ? undefined : selectedType,
    search: searchTerm || undefined,
    page,
    limit,
  };

  const { records, pagination, isLoading, isError, error, refetch } =
    useDoctorPatientRecords(patientId, query);

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const handleAuthorizedDownload = async (recordId: string, fileName?: string) => {
    setDownloadingId(recordId);
    setDownloadError(null);
    try {
      await recordsApi.downloadRecord(recordId, fileName);
    } catch (err: unknown) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : 'Unable to download document. Please verify active patient consent.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Consent-Scoped Notice */}
      <div className="px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>
          Displaying consent-authorized medical documents only. Every preview and download is
          verified server-side and recorded in the audit log.
        </span>
      </div>

      {downloadError && (
        <div
          role="alert"
          className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-error"
        >
          {downloadError}
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              aria-label="Search patient medical documents"
              placeholder="Search documents by title, doctor, or facility..."
              className="w-full h-10 sm:h-9 bg-muted/30 text-base sm:text-xs rounded-xl pl-10 pr-4 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-9 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {/* Record Type Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/50 pb-1">
          {RECORD_TYPES.map((t) => {
            const isActive = selectedType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setSelectedType(t.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all focus-ring ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Roster */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-muted/40 animate-pulse border border-border/40"
            />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          title="Authorized Patient Records Unavailable"
          onRetry={() => refetch()}
        />
      ) : records.length === 0 ? (
        <PatientEmptyState
          icon={FileText}
          title="No Medical Documents Found"
          description={
            searchTerm || selectedType !== 'ALL'
              ? 'No records match the current filter and search query.'
              : 'Authorized medical records uploaded by the patient or clinical facilities will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <Card
              key={rec.id}
              className="border border-border/80 bg-card hover:border-primary/40 transition-all shadow-xs"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground truncate">{rec.title}</span>
                    <Badge variant="info" size="sm">
                      {getRecordCategoryLabel(rec.recordType)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 gap-1 px-1.5 py-0"
                    >
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {(rec.verificationStatus || 'VERIFIED').replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {rec.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {formatDate(rec.recordDate)}
                    </span>
                    {rec.facilityName && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" aria-hidden="true" />
                          {rec.facilityName}
                        </span>
                      </>
                    )}
                    {rec.doctorName && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3 w-3" aria-hidden="true" />
                          {rec.doctorName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      setPreviewDoc({
                        id: rec.id,
                        title: rec.title,
                        recordType: (rec.recordType || 'OTHER_MEDICAL_DOCUMENT') as MedicalRecordType,
                        recordDate: rec.recordDate,
                        createdAt: rec.recordDate,
                        doctorName: rec.doctorName,
                        facilityName: rec.facilityName,
                        verificationStatus:
                          (rec.verificationStatus as 'VERIFIED' | 'PENDING' | 'SELF_SUBMITTED') ||
                          'VERIFIED',
                        source:
                          (rec.source as 'MANUAL_ENTRY' | 'ABDM_INGESTION' | 'EHR_SYNC') ||
                          'MANUAL_ENTRY',
                      })
                    }
                    className="text-xs gap-1.5 h-8"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Preview</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={downloadingId === rec.id}
                    onClick={() => handleAuthorizedDownload(rec.id)}
                    className="text-xs gap-1.5 h-8"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{downloadingId === rec.id ? 'Downloading...' : 'Download'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> (
                {pagination.total} records)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consented In-App Secure Document Viewer Modal */}
      <SecureDocumentViewerModal
        record={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={(id, name) => handleAuthorizedDownload(id, name)}
        isDownloading={Boolean(downloadingId)}
      />
    </div>
  );
};
