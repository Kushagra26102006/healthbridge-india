'use client';

import React from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Building2,
  Calendar,
  Clock,
  Download,
  ArrowLeft,
  User,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LabResultTable } from './LabResultTable';
import { LabDocumentPreview } from './LabDocumentPreview';
import { getReportStatusBadge, getCategoryBadge } from './LabReportCard';
import type { LabReportDetailDto } from '@healthbridge/shared-types';

export interface LabReportDetailsProps {
  report: LabReportDetailDto;
  onDownload: () => void;
  isDownloading?: boolean;
}

export const LabReportDetails: React.FC<LabReportDetailsProps> = ({
  report,
  onDownload,
  isDownloading = false,
}) => {
  const statusInfo = getReportStatusBadge(report.status);
  const StatusIcon = statusInfo.icon;

  const testFormattedDate = new Date(report.testDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const reportFormattedDate = new Date(report.reportDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 -ml-2"
        >
          <Link href="/patient/lab-reports">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Laboratory Reports
          </Link>
        </Button>
      </div>

      {/* Main Report Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                {getCategoryBadge(report.category)}
              </Badge>

              <Badge className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1`}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{statusInfo.label}</span>
              </Badge>

              {report.nablAccreditationNumber && (
                <Badge
                  variant="secondary"
                  className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs font-mono"
                >
                  {report.nablAccreditationNumber}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pt-1">
              {report.testName}
            </h1>

            <p className="text-xs text-slate-400 font-mono">
              Report Ref ID: {report.reportNumber}
            </p>
          </div>

          <Button
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl shadow-sm font-semibold flex items-center space-x-1 w-full sm:w-auto justify-center"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span>{isDownloading ? 'Downloading...' : 'Download Report PDF'}</span>
          </Button>
        </div>

        {/* Schedule & Metadata Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              <span>Sample Collection Date</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {testFormattedDate}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>Report Publication Date</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {reportFormattedDate}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Diagnostic Laboratory</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {report.laboratoryName}
            </p>
            {report.laboratoryAddress && (
              <p className="text-[11px] text-slate-500 truncate">{report.laboratoryAddress}</p>
            )}
          </div>
        </div>

        {/* Doctor and Order details if available */}
        {(report.doctorName || report.orderNumber) && (
          <div className="p-3.5 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            {report.doctorName && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <span>
                  Prescribed / Ordered by{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {report.doctorName}
                  </span>
                  {report.doctorSpecialization && (
                    <span className="text-slate-500"> ({report.doctorSpecialization.join(', ')})</span>
                  )}
                </span>
              </div>
            )}

            {report.orderNumber && report.orderId && (
              <Link
                href={`/patient/lab-orders/${report.orderId}`}
                className="text-teal-700 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Order {report.orderNumber}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Observations Section */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-teal-600" />
              <span>Quantitative Observations & Telemetry</span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated against laboratory reference ranges
            </p>
          </div>

          <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {report.observations.length} Parameters Measured
          </Badge>
        </div>

        <LabResultTable observations={report.observations} />

        {report.clinicalNotes && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Pathologist / Clinical Notes:
            </span>
            <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {report.clinicalNotes}
            </p>
          </div>
        )}

        {/* Mandatory Clinical Disclaimer */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            Laboratory results should be reviewed with a qualified healthcare professional.
            Reference ranges and interpretation may vary by laboratory and clinical context. Do not
            alter your treatment or medication regimen without consulting your physician.
          </p>
        </div>
      </Card>

      {/* Document Preview Card */}
      <LabDocumentPreview
        reportId={report.id}
        reportNumber={report.reportNumber}
        testName={report.testName}
        documentMimeType={report.documentMimeType}
        documentFileSize={report.documentFileSize}
        onDownload={onDownload}
        isDownloading={isDownloading}
      />
    </div>
  );
};
