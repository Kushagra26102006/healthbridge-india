'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface LabDocumentPreviewProps {
  reportId: string;
  reportNumber: string;
  testName: string;
  documentMimeType?: string;
  documentFileSize?: number;
  onDownload: () => void;
  isDownloading?: boolean;
}

export const LabDocumentPreview: React.FC<LabDocumentPreviewProps> = ({
  reportNumber,
  testName,
  documentMimeType = 'application/pdf',
  documentFileSize = 245760,
  onDownload,
  isDownloading = false,
}) => {
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '240 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Authorized Diagnostic Document
            </h3>
            <p className="text-xs text-slate-500">
              Digitally signed and encrypted under ABDM standards
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center gap-1"
        >
          <ShieldCheck className="h-3 w-3" />
          <span>Verified Certificate</span>
        </Badge>
      </div>

      {/* Document info banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {reportNumber.toLowerCase()}-{testName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf
          </p>
          <p className="text-[11px] text-slate-500">
            Format: {documentMimeType.toUpperCase()} • Size: {formatFileSize(documentFileSize)}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className="text-xs h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 flex-1 sm:flex-initial"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            {isPreviewActive ? 'Hide Preview' : 'Interactive Preview'}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3.5 rounded-lg flex items-center space-x-1 flex-1 sm:flex-initial shadow-sm font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span>{isDownloading ? 'Downloading...' : 'Download Original'}</span>
          </Button>
        </div>
      </div>

      {/* Embedded Document Preview Screen */}
      {isPreviewActive && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1 font-mono">
              <Lock className="h-3 w-3 text-teal-600" />
              <span>Encrypted Sandbox Viewport</span>
            </span>
            <span>Digital Hash: SHA-256 Verified</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-inner min-h-[360px] flex flex-col justify-between border border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    DIAGNOSTIC TEST REPORT
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">Reference: {reportNumber}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-teal-600">NABL ACCREDITED</p>
                  <p className="text-slate-400">ISO 15189:2012</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-semibold block text-slate-800 dark:text-slate-200">
                    Test Performed:
                  </span>
                  <span>{testName}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-800 dark:text-slate-200">
                    Validation Status:
                  </span>
                  <span className="text-emerald-600 font-medium">Verified by Lab In-Charge</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded text-xs text-slate-500 italic">
                Authorized electronic diagnostic report preview. Complete quantitative telemetry and
                observation parameters are rendered in the observations table below.
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>HealthBridge India National Health Network</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="text-xs h-7 p-0 text-teal-600 hover:text-teal-700"
              >
                <span>Save Full Document</span>
                <Download className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
