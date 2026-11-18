'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  User,
  Eye,
  Download,
  ExternalLink,
  Link2,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getCategoryIcon,
  getCategoryBadge,
  getVerificationBadge,
} from '@/components/patient/records/RecordCard';
import {
  formatFileSize,
  groupRecordsByMonth,
} from '@/features/records/lib/document-helpers';
import type { IMedicalRecord } from '@healthbridge/shared-types';

export interface MedicalRecordTimelineProps {
  records: IMedicalRecord[];
  onPreview?: (record: IMedicalRecord) => void;
  onDownload?: (recordId: string, fileName?: string) => void;
  isDownloading?: boolean;
  detailHrefPrefix?: string;
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

/**
 * Chronological Medical Record Timeline (Phase 16)
 *
 * Groups authorized medical documents by month/year using real record dates
 * (never fabricates missing dates, providers, or appointments).
 */
export function MedicalRecordTimeline({
  records,
  onPreview,
  onDownload,
  isDownloading = false,
  detailHrefPrefix = '/patient/records',
  isFiltered = false,
  onResetFilters,
}: MedicalRecordTimelineProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-5 w-5" />}
        title={isFiltered ? 'No Timeline Documents Match Filters' : 'No Medical Documents Yet'}
        description={
          isFiltered
            ? 'Adjust your date range, category, or provider filter to view matching documents on the timeline.'
            : 'Uploaded medical records, prescriptions, and published reports will appear here in chronological order.'
        }
        action={
          isFiltered && onResetFilters ? (
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Reset Filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  const groups = groupRecordsByMonth(records);

  return (
    <div className="space-y-6" aria-label="Chronological medical records timeline">
      {groups.map((group) => (
        <section key={group.monthKey} className="space-y-3">
          <div className="sticky top-[72px] z-10 flex items-center gap-2 py-1.5 bg-background/90 backdrop-blur-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {group.monthLabel}
            </h2>
            <Badge variant="outline" size="sm">
              {group.records.length}
            </Badge>
            <div className="flex-1 h-px bg-border" aria-hidden="true" />
          </div>

          <ol className="relative border-l-2 border-border/80 ml-3 sm:ml-4 pl-5 sm:pl-6 space-y-4">
            {group.records.map((record) => {
              const { icon: Icon, color, bg } = getCategoryIcon(record.recordType);
              const rawDate = record.recordDate || record.createdAt;
              const formattedDate = rawDate
                ? new Date(rawDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date not recorded';

              return (
                <li key={record.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[31px] sm:-left-[35px] top-4 h-6 w-6 rounded-full border-2 border-background flex items-center justify-center ${bg} ${color}`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>

                  <Card className="p-4 border-border/75 bg-card hover:border-primary/40 transition-colors shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            {formattedDate}
                          </span>
                          {getCategoryBadge(record.recordType)}
                          {getVerificationBadge(record.verificationStatus)}
                          {record.appointmentId && (
                            <Badge variant="outline" size="sm" className="gap-1 font-mono text-[10px]">
                              <Link2 className="h-2.5 w-2.5" aria-hidden="true" />
                              Appointment Linked
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-foreground break-words">
                          <Link
                            href={`${detailHrefPrefix}/${record.id}`}
                            className="hover:text-primary transition-colors focus-ring rounded"
                          >
                            {record.title}
                          </Link>
                        </h3>

                        {record.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {record.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
                          {record.doctorName && (
                            <span className="inline-flex items-center gap-1 text-foreground/90 font-medium">
                              <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                              {record.doctorName}
                            </span>
                          )}
                          {record.facilityName && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                              {record.facilityName}
                            </span>
                          )}
                          {record.fileSize !== undefined && (
                            <span>{formatFileSize(record.fileSize)}</span>
                          )}
                          {record.resourceReference && (
                            <span className="font-mono">Ref: {record.resourceReference}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-start">
                        {onPreview && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => onPreview(record)}
                            className="h-8 px-2.5 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
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
                            className="h-8 w-8 p-0"
                            title="Download document"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs gap-1">
                          <Link href={`${detailHrefPrefix}/${record.id}`}>
                            <span>Details</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default MedicalRecordTimeline;
