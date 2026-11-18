'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Building2,
  Calendar,
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { recordsApi } from '@/features/records/api/records-api';
import {
  formatFileSize,
  getRecordCategoryLabel,
} from '@/features/records/lib/document-helpers';
import { modalBackdrop, modalEntrance } from '@/lib/motion/variants';
import type { IMedicalRecord, MedicalRecordAccessTokenDto } from '@healthbridge/shared-types';

export interface SecureDocumentViewerProps {
  record: Pick<
    IMedicalRecord,
    | 'id'
    | 'title'
    | 'recordType'
    | 'recordDate'
    | 'createdAt'
    | 'fileName'
    | 'mimeType'
    | 'fileSize'
    | 'doctorName'
    | 'facilityName'
    | 'verificationStatus'
    | 'scanStatus'
    | 'source'
    | 'resourceReference'
  >;
  onDownload?: () => void;
  isDownloading?: boolean;
  showMetadataPanel?: boolean;
  viewerHeightClass?: string;
}

/**
 * Reusable Secure Document Viewer (Phase 16)
 *
 * Acquires a short-lived HMAC-signed access token from `/api/v1/records/:id/access-token`,
 * streams the private document bytes into an ephemeral in-memory Blob URL (never exposing
 * private storage bucket URLs), and renders PDF or Image content with zoom, rotation,
 * PDF page navigation, and full document/security metadata.
 */
export function SecureDocumentViewer({
  record,
  onDownload,
  isDownloading = false,
  showMetadataPanel = false,
  viewerHeightClass = 'h-[500px]',
}: SecureDocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [resolvedMime, setResolvedMime] = useState<string>(
    (record.mimeType || 'application/pdf').toLowerCase()
  );
  const [accessMeta, setAccessMeta] = useState<MedicalRecordAccessTokenDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadSecurePreview = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const tokenData = await recordsApi.getAccessToken(record.id, signal);
        if (signal.aborted) return;
        setAccessMeta(tokenData);

        const preview = await recordsApi.fetchPreviewBlob(record.id, tokenData.token, signal);
        if (signal.aborted) {
          window.URL.revokeObjectURL(preview.blobUrl);
          return;
        }
        setResolvedMime(preview.mimeType.toLowerCase());
        setBlobUrl((prev) => {
          if (prev) window.URL.revokeObjectURL(prev);
          return preview.blobUrl;
        });
      } catch (err: unknown) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'CanceledError' || name === 'AbortError') return;
        setLoadError(err);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [record.id]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadSecurePreview(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadSecurePreview, reloadKey]);

  // Revoke private Blob URL cleanly on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const isPdf = resolvedMime.includes('pdf');
  const isImage =
    resolvedMime.includes('image/jpeg') ||
    resolvedMime.includes('image/jpg') ||
    resolvedMime.includes('image/png') ||
    resolvedMime.includes('image/webp');

  const handleDownloadClick = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    await recordsApi.downloadRecord(record.id, record.fileName);
  };

  const formattedRecordDate = record.recordDate
    ? new Date(record.recordDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not recorded';

  const formattedUploadDate = record.createdAt
    ? new Date(record.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not recorded';

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-border bg-muted/25 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
            {record.fileName || record.title}
          </span>
          <Badge variant="outline" size="sm" className="font-mono uppercase shrink-0">
            {resolvedMime.split('/')[1] || 'DOC'}
          </Badge>
          {accessMeta && (
            <Badge variant="info" size="sm" className="hidden sm:inline-flex gap-1 shrink-0">
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>{accessMeta.accessScope === 'OWNER' ? 'Owner Access' : 'Consented Access'}</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* PDF Page Controls */}
          {isPdf && blobUrl && (
            <div className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded-lg border border-border bg-surface text-xs">
              <button
                type="button"
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                disabled={pdfPage <= 1}
                aria-label="Previous PDF page"
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 focus-ring rounded"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="font-mono text-[11px] px-1 text-foreground">Pg {pdfPage}</span>
              <button
                type="button"
                onClick={() => setPdfPage((p) => p + 1)}
                aria-label="Next PDF page"
                className="p-1 text-muted-foreground hover:text-foreground focus-ring rounded"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Zoom Controls (PDF & Image) */}
          {(isImage || isPdf) && blobUrl && (
            <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-lg border border-border bg-surface">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                disabled={zoom <= 50}
                aria-label="Zoom out"
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setZoom(100);
                  setRotation(0);
                }}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-1.5 min-w-[44px] text-center"
                title="Reset zoom"
              >
                {zoom}%
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => Math.min(250, z + 25))}
                disabled={zoom >= 250}
                aria-label="Zoom in"
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}

          {/* Image Rotation */}
          {isImage && blobUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="Rotate image 90 degrees"
              className="h-8 w-8 p-0"
              title="Rotate 90°"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}

          {/* Refresh Short-Lived Access Link */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={isLoading}
            aria-label="Refresh secure preview link"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Refresh secure access link"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </Button>

          {/* Authorized Download */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </Button>
        </div>
      </div>

      {/* Viewer + Optional Metadata Layout */}
      <div className={showMetadataPanel ? 'grid grid-cols-1 lg:grid-cols-12' : 'block'}>
        <div
          className={`${
            showMetadataPanel ? 'lg:col-span-8 lg:border-r border-border' : ''
          } bg-muted/15 relative flex flex-col items-center justify-center min-h-[340px]`}
        >
          {isLoading ? (
            <div className="w-full p-6 space-y-3" aria-busy="true" aria-label="Loading secure document preview">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">
                Verifying authorization and streaming private document...
              </p>
            </div>
          ) : loadError ? (
            <div className="p-6 w-full max-w-md mx-auto">
              <ErrorState
                compact
                error={loadError}
                title="Document preview unavailable"
                onRetry={() => setReloadKey((k) => k + 1)}
              />
            </div>
          ) : isPdf && blobUrl ? (
            <div className={`w-full ${viewerHeightClass} overflow-auto bg-muted/20`}>
              <div
                style={{
                  width: `${zoom}%`,
                  minWidth: '100%',
                  height: '100%',
                }}
                className="transition-all duration-150"
              >
                <iframe
                  key={`${blobUrl}#page=${pdfPage}`}
                  src={`${blobUrl}#page=${pdfPage}&toolbar=0&navpanes=0`}
                  title={record.title}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : isImage && blobUrl ? (
            <div
              className={`w-full ${viewerHeightClass} overflow-auto p-6 flex items-center justify-center bg-muted/20`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl}
                alt={record.title}
                style={{
                  width: `${zoom}%`,
                  transform: `rotate(${rotation}deg)`,
                }}
                className="max-w-none h-auto rounded-lg shadow-sm border border-border transition-transform duration-200 object-contain"
              />
            </div>
          ) : (
            <div className="p-10 text-center space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Direct Preview Not Supported</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  File format <span className="font-mono text-foreground">{resolvedMime}</span>{' '}
                  cannot be rendered inline. Use the authorized download button to open it locally.
                </p>
              </div>
              <Button type="button" variant="primary" size="sm" onClick={handleDownloadClick}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Document</span>
              </Button>
            </div>
          )}
        </div>

        {showMetadataPanel && (
          <aside className="lg:col-span-4 p-4 sm:p-5 space-y-4 bg-card text-xs">
            <div className="space-y-1 pb-3 border-b border-border">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="info" size="sm">
                  {getRecordCategoryLabel(record.recordType)}
                </Badge>
                {record.verificationStatus && (
                  <Badge variant="outline" size="sm">
                    {record.verificationStatus.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground pt-1">{record.title}</h3>
              {record.resourceReference && (
                <p className="font-mono text-[11px] text-muted-foreground">
                  Ref: {record.resourceReference}
                </p>
              )}
            </div>

            <dl className="space-y-2.5">
              <div className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-muted-foreground">Document Date</dt>
                  <dd className="font-medium text-foreground">{formattedRecordDate}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-muted-foreground">Uploaded / Indexed</dt>
                  <dd className="font-medium text-foreground">{formattedUploadDate}</dd>
                </div>
              </div>
              {record.doctorName && (
                <div className="flex items-start gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Healthcare Provider</dt>
                    <dd className="font-medium text-foreground">{record.doctorName}</dd>
                  </div>
                </div>
              )}
              {record.facilityName && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Facility</dt>
                    <dd className="font-medium text-foreground">{record.facilityName}</dd>
                  </div>
                </div>
              )}
            </dl>

            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">File Size</span>
                <span className="font-medium text-foreground">{formatFileSize(record.fileSize)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Storage Policy</span>
                <span className="font-medium text-foreground">Private Auth-Gated</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Malware Scan</span>
                <span className="font-medium text-foreground">
                  {record.scanStatus === 'CLEAN'
                    ? 'Verified Clean'
                    : record.scanStatus === 'INFECTED'
                      ? 'Quarantined'
                      : 'Scanner Not Configured'}
                </span>
              </div>
              {accessMeta && (
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground flex items-start gap-2 mt-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Short-lived signed link expires at{' '}
                    <strong className="text-foreground">
                      {new Date(accessMeta.expiresAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                    .
                  </span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Security Bar (inline compact mode) */}
      {!showMetadataPanel && accessMeta && (
        <div className="px-4 py-2 bg-muted/30 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>
              Private short-lived preview link • Expires{' '}
              {new Date(accessMeta.expiresAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            {rotation !== 0 && (
              <button
                type="button"
                onClick={() => setRotation(0)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset rotation
              </button>
            )}
            <span>{formatFileSize(record.fileSize)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export interface SecureDocumentViewerModalProps {
  record: SecureDocumentViewerProps['record'] | null;
  onClose: () => void;
  onDownload?: (recordId: string, fileName?: string) => void;
  isDownloading?: boolean;
}

export function SecureDocumentViewerModal({
  record,
  onClose,
  onDownload,
  isDownloading = false,
}: SecureDocumentViewerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!record) return () => {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [record, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {record && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Secure document viewer: ${record.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          <m.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
          />
          <m.div
            variants={modalEntrance}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-modal relative z-10 w-full max-w-5xl max-h-[92dvh] rounded-2xl overflow-y-auto p-3 sm:p-4 shadow-float pb-safe"
          >
            <div className="flex items-center justify-between gap-3 pb-3 px-1">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {record.title}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Authorized Private Document Preview • Audit Logged
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close document preview"
                className="h-8 w-8 p-0 rounded-full shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <SecureDocumentViewer
              record={record}
              showMetadataPanel
              viewerHeightClass="h-[58dvh] sm:h-[64dvh]"
              isDownloading={isDownloading}
              onDownload={
                onDownload ? () => onDownload(record.id, record.fileName) : undefined
              }
            />
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default SecureDocumentViewer;
