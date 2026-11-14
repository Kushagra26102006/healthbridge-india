'use client';

import React from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Building2,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LabReportListItemDto, LabReportStatus } from '@healthbridge/shared-types';

export interface LabReportCardProps {
  report: LabReportListItemDto;
  onDownload?: (reportId: string, testName: string) => void;
  isDownloading?: boolean;
}

export const getReportStatusBadge = (status: LabReportStatus) => {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Completed & Verified',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'PRELIMINARY':
      return {
        label: 'Preliminary Report',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: Clock,
      };
    case 'PENDING':
      return {
        label: 'Under Analysis',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Clock,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: AlertTriangle,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: FlaskConical,
      };
  }
};

export const getCategoryBadge = (category: string) => {
  const map: Record<string, string> = {
    BLOOD_TESTS: 'Blood Test',
    URINE_TESTS: 'Urine Test',
    BIOCHEMISTRY: 'Biochemistry',
    HEMATOLOGY: 'Hematology',
    IMAGING: 'Imaging & Radiology',
    MICROBIOLOGY: 'Microbiology',
    OTHER: 'Diagnostic Test',
  };
  return map[category] || category;
};

export const LabReportCard: React.FC<LabReportCardProps> = ({
  report,
  onDownload,
  isDownloading = false,
}) => {
  const statusInfo = getReportStatusBadge(report.status);
  const StatusIcon = statusInfo.icon;

  const testFormattedDate = new Date(report.testDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const reportFormattedDate = new Date(report.reportDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-5 space-y-4">
        {/* Top Header: Category + Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
            >
              {getCategoryBadge(report.category)}
            </Badge>

            <Badge className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              <span>{statusInfo.label}</span>
            </Badge>
          </div>

          <span className="font-mono text-xs text-slate-400">
            {report.reportNumber}
          </span>
        </div>

        {/* Test Name & Laboratory */}
        <div className="space-y-1.5">
          <Link
            href={`/patient/lab-reports/${report.id}`}
            className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors line-clamp-1 block"
          >
            {report.testName}
          </Link>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium truncate">{report.laboratoryName}</span>
          </div>

          {report.doctorName && (
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">Ordered by {report.doctorName}</span>
            </div>
          )}
        </div>

        {/* Schedule & Metadata Bar */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>Sample: {testFormattedDate}</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Report: {reportFormattedDate}</span>
          </div>
        </div>

        {/* Observations & Abnormal result indicator */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-slate-500 font-medium">
            {report.observationCount} Test Parameters
          </span>

          {report.hasAbnormalResults ? (
            <span className="inline-flex items-center space-x-1 text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              <AlertTriangle className="h-3 w-3" />
              <span>Out of Range Value(s)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="h-3 w-3" />
              <span>All Normal</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <Link href={`/patient/lab-reports/${report.id}`}>
            <span>View Observations</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>

        {report.hasDocument && onDownload && (
          <Button
            size="sm"
            variant="outline"
            disabled={isDownloading}
            onClick={() => onDownload(report.id, report.testName)}
            className="text-xs h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 flex items-center space-x-1 hover:border-teal-500 hover:text-teal-600"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
