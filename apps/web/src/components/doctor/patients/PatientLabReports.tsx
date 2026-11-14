'use client';

import React, { useState } from 'react';
import {
  TestTube,
  Calendar,
  Building2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientEmptyState } from './PatientEmptyState';
import { useDoctorPatientLabReports } from '@/features/doctor/hooks/use-doctor';

interface PatientLabReportsProps {
  patientId: string;
}

export const PatientLabReports: React.FC<PatientLabReportsProps> = ({ patientId }) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { labReports, pagination, isLoading, isError, error, refetch } =
    useDoctorPatientLabReports(patientId, page, limit);

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

  const getInterpretationBadge = (interpretation: string) => {
    switch (interpretation) {
      case 'NORMAL':
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/40 text-[10px]">
            NORMAL
          </Badge>
        );
      case 'ABOVE_RANGE':
      case 'HIGH':
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/40 text-[10px]">
            ABOVE RANGE
          </Badge>
        );
      case 'BELOW_RANGE':
      case 'LOW':
        return (
          <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-50/40 text-[10px]">
            BELOW RANGE
          </Badge>
        );
      case 'CRITICAL':
      case 'ABNORMAL':
        return (
          <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-50/40 text-[10px]">
            ABNORMAL
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {interpretation}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Diagnostic Laboratory Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pathology and diagnostic investigation results with laboratory-certified reference ranges.
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 h-8 self-start sm:self-center"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Non-Diagnostic Safety Notice */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 p-4 flex items-start gap-3 text-xs text-blue-800 dark:text-blue-200">
        <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-bold">Clinical Safety & Non-Diagnostic Boundary</span>
          <p className="text-muted-foreground text-[11px]">
            Test interpretations and reference ranges shown below are strictly those supplied by the performing laboratory. HealthBridge India does not autonomously generate diagnoses, infer disease states, or recommend treatment changes from laboratory data.
          </p>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <PatientEmptyState
          title="Laboratory Reports Unavailable"
          description={error?.message || 'Failed to load laboratory reports.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : labReports.length === 0 ? (
        <PatientEmptyState
          icon={TestTube}
          title="No Diagnostic Reports Found"
          description="There are no laboratory investigation results documented for this patient."
        />
      ) : (
        <div className="space-y-4">
          {labReports.map((report) => (
            <Card
              key={report.id}
              className="border border-border/80 bg-card hover:border-teal-500/40 transition-all shadow-xs overflow-hidden"
            >
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Report Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-600 text-xs">
                        {report.reportNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {report.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/40 text-emerald-600 bg-emerald-50/40"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {report.testName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Reported: {formatDate(report.publishedAt)}
                    </span>
                    {report.reportUrl && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-teal-600 border-teal-500/40 gap-1"
                      >
                        <a href={report.reportUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          View Document
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Observations Table */}
                {report.observations && report.observations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground text-[11px] font-semibold">
                          <th className="pb-2">Test Parameter</th>
                          <th className="pb-2">Observed Value</th>
                          <th className="pb-2">Reference Range</th>
                          <th className="pb-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {report.observations.map((obs, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-2.5 font-sans font-medium text-foreground">
                              {obs.testName}
                            </td>
                            <td className="py-2.5 font-bold text-foreground">
                              {obs.value} <span className="text-[11px] font-normal text-muted-foreground">{obs.unit}</span>
                            </td>
                            <td className="py-2.5 text-muted-foreground text-[11px]">
                              {obs.referenceRange}
                            </td>
                            <td className="py-2.5 text-right font-sans">
                              {getInterpretationBadge(obs.interpretation)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Summary diagnostic investigation. Document attached.
                  </p>
                )}

                {/* Footer notes & Source attribution */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    Performing Laboratory: {report.laboratory.name}
                  </span>
                  {report.doctorName && (
                    <span>Ordering Physician: {report.doctorName}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} reports)
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
