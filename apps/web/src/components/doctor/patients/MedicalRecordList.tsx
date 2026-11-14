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
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientEmptyState } from './PatientEmptyState';
import { useDoctorPatientRecords } from '@/features/doctor/hooks/use-doctor';
import type { PatientRecordFilterQueryDto } from '@healthbridge/shared-types';

interface MedicalRecordListProps {
  patientId: string;
}

const RECORD_TYPES = [
  { id: 'ALL', label: 'All Records' },
  { id: 'OP_CONSULTATION', label: 'Consultations' },
  { id: 'DISCHARGE_SUMMARY', label: 'Discharge Summaries' },
  { id: 'DIAGNOSTIC_REPORT', label: 'Diagnostic Imaging' },
  { id: 'PRESCRIPTION', label: 'Prescriptions' },
  { id: 'LAB_REPORT', label: 'Lab Reports' },
  { id: 'IMMUNIZATION_RECORD', label: 'Vaccination' },
];

export const MedicalRecordList: React.FC<MedicalRecordListProps> = ({ patientId }) => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
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

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search documents by title, doctor, or facility..."
              className="w-full bg-muted/30 text-xs rounded-xl pl-10 pr-4 py-2 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Record Type Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/50">
          {RECORD_TYPES.map((t) => {
            const isActive = selectedType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedType(t.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
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
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <PatientEmptyState
          title="Records Unavailable"
          description={error?.message || 'Failed to load authorized patient records.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : records.length === 0 ? (
        <PatientEmptyState
          icon={FileText}
          title="No Medical Documents Found"
          description={
            searchTerm || selectedType !== 'ALL'
              ? 'No records match the current filter and search query.'
              : 'Medical records uploaded by the patient or clinical facilities will be listed here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <Card
              key={rec.id}
              className="border border-border/80 bg-card hover:border-teal-500/40 transition-all shadow-xs"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground truncate">
                      {rec.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                      {rec.recordType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-500/40 text-emerald-600 bg-emerald-50/40 gap-1 px-1.5 py-0"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {rec.verificationStatus || 'VERIFIED'}
                    </Badge>
                  </div>

                  {rec.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rec.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(rec.recordDate)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {rec.facilityName || rec.source}
                    </span>
                    {rec.doctorName && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3 w-3" />
                          {rec.doctorName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {rec.fileUrl ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 h-8 text-teal-600 border-teal-500/40 hover:bg-teal-50/50"
                    >
                      <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Document
                      </a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 h-8"
                    >
                      <a href={`/api/v1/records/${rec.id}/download`} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} records)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
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
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
