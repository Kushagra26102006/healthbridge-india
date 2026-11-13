'use client';

import React, { useState } from 'react';
import { FileText, Download, ZoomIn, ZoomOut, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MedicalRecordDetailDto } from '@healthbridge/shared-types';

export interface RecordPreviewProps {
  record: MedicalRecordDetailDto;
  onDownload: () => void;
  isDownloading?: boolean;
}

export function RecordPreview({ record, onDownload, isDownloading = false }: RecordPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(100);

  const mimeType = (record.mimeType || 'application/pdf').toLowerCase();
  const isPdf = mimeType.includes('pdf');
  const isImage =
    mimeType.includes('image/jpeg') ||
    mimeType.includes('image/png') ||
    mimeType.includes('image/webp') ||
    mimeType.includes('image/jpg');

  // Preview data source: if Base64 exists or constructed authorized endpoint
  const previewSource = record.fileData
    ? record.fileData.startsWith('data:')
      ? record.fileData
      : `data:${mimeType};base64,${record.fileData}`
    : `/api/v1/records/${record.id}/download`;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));

  return (
    <Card className="border-border/70 bg-card overflow-hidden shadow-xs">
      <CardHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold text-foreground">Document Safe Preview</CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase font-mono">
            {mimeType.split('/')[1] || 'PDF'}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          {isImage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground font-mono w-10 text-center">
                {zoomLevel}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Download className="h-3 w-3" />
            <span>Download</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-muted/10 min-h-[360px] flex flex-col items-center justify-center relative">
        {/* PDF Safe Previewer */}
        {isPdf && (
          <div className="w-full h-[520px] relative bg-muted/20">
            <iframe
              src={`${previewSource}#toolbar=0&navpanes=0`}
              title={record.title}
              className="w-full h-full border-0 rounded-b-xl"
            />
            {/* Fallback overlay in case iframe cannot display directly */}
            <div className="hidden peer-invalid:flex absolute inset-0 flex-col items-center justify-center p-6 text-center space-y-3 bg-card">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground max-w-sm">
                In-browser preview is not supported on this browser device. You can download and
                open this document locally.
              </p>
              <Button variant="outline" size="sm" onClick={onDownload} className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        {/* Image Safe Previewer (JPEG / PNG / WebP) */}
        {isImage && (
          <div className="p-6 w-full flex items-center justify-center overflow-auto max-h-[520px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSource}
              alt={record.title}
              style={{ width: `${zoomLevel}%` }}
              className="max-w-full h-auto rounded-xl shadow-xs transition-all duration-200 object-contain border border-border/60"
            />
          </div>
        )}

        {/* Unsupported / Non-rendered File Types */}
        {!isPdf && !isImage && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3.5 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Direct Preview Not Supported</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For security and privacy integrity, file type{' '}
                <span className="font-mono font-medium text-foreground">{mimeType}</span> cannot be
                rendered directly in the web browser. Please use authorized download to inspect the
                original file.
              </p>
            </div>
            <Button
              variant="teal"
              size="sm"
              onClick={onDownload}
              disabled={isDownloading}
              className="text-xs h-8 px-3.5 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download {record.fileName || 'Document'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecordPreview;
