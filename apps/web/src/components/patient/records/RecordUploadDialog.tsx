'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  RotateCw,
  Trash2,
  AlertTriangle,
  Loader2,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { recordsApi } from '@/features/records/api/records-api';
import { useQueryClient } from '@tanstack/react-query';
import {
  RECORDS_QUERY_KEY,
  RECORDS_SUMMARY_QUERY_KEY,
} from '@/features/records/hooks/use-records';
import {
  DOCUMENT_CATEGORIES,
  formatFileSize,
  validateClientUploadFile,
} from '@/features/records/lib/document-helpers';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';
import { modalBackdrop, modalEntrance } from '@/lib/motion/variants';
import type { MedicalRecordType } from '@healthbridge/shared-types';

export interface RecordUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type QueueItemStatus = 'queued' | 'uploading' | 'uploaded' | 'duplicate' | 'error' | 'cancelled';

interface QueuedDocumentFile {
  localId: string;
  file: File;
  title: string;
  mimeType: string;
  progress: number;
  status: QueueItemStatus;
  errorMessage?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to encode file for secure upload.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

function extractApiError(err: unknown): { message: string; code?: string; status?: number } {
  const axiosErr = err as {
    name?: string;
    code?: string;
    message?: string;
    response?: { status?: number; data?: { message?: string; code?: string } };
  };
  if (axiosErr?.name === 'CanceledError' || axiosErr?.code === 'ERR_CANCELED') {
    return { message: 'Upload cancelled.', code: 'CANCELLED' };
  }
  return {
    message:
      axiosErr?.response?.data?.message ||
      axiosErr?.message ||
      'Upload failed. Please check your connection and retry.',
    code: axiosErr?.response?.data?.code,
    status: axiosErr?.response?.status,
  };
}

export function RecordUploadDialog({ isOpen, onClose, onSuccess }: RecordUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const queryClient = useQueryClient();
  const { announce } = useLiveAnnouncer();

  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedDocumentFile[]>([]);
  const [recordType, setRecordType] = useState<MedicalRecordType>('DIAGNOSTIC_REPORT');
  const [recordDate, setRecordDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] || ''
  );
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [description, setDescription] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return () => {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const invalidateRecordCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: RECORDS_SUMMARY_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['patient', 'dashboard-summary'] });
  }, [queryClient]);

  const handleReset = useCallback(() => {
    controllersRef.current.forEach((ctrl) => ctrl.abort());
    controllersRef.current.clear();
    setQueue([]);
    setRecordType('DIAGNOSTIC_REPORT');
    setRecordDate(new Date().toISOString().split('T')[0] || '');
    setDoctorName('');
    setFacilityName('');
    setDescription('');
    setGlobalError(null);
    setIsSubmitting(false);
    setIsDragging(false);
  }, []);

  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    setGlobalError(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    const rejections: string[] = [];
    const additions: QueuedDocumentFile[] = [];

    setQueue((prev) => {
      const existingSignatures = new Set(prev.map((q) => `${q.file.name}:${q.file.size}`));

      for (const file of list) {
        const validation = validateClientUploadFile(file);
        if (!validation.valid) {
          rejections.push(`${file.name}: ${validation.error}`);
          continue;
        }
        const sig = `${file.name}:${file.size}`;
        if (existingSignatures.has(sig)) {
          rejections.push(`${file.name}: Already added to this upload queue.`);
          continue;
        }
        existingSignatures.add(sig);

        const defaultTitle =
          file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .trim() || 'Medical Document';

        additions.push({
          localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          title: defaultTitle.length >= 3 ? defaultTitle : `${defaultTitle} Record`,
          mimeType: validation.normalizedMime || 'application/pdf',
          progress: 0,
          status: 'queued',
        });
      }

      return [...prev, ...additions].slice(0, 10);
    });

    if (rejections.length > 0) {
      setGlobalError(rejections.join(' '));
    }
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const uploadSingleItem = async (item: QueuedDocumentFile, allowDuplicate = false) => {
    const controller = new AbortController();
    controllersRef.current.set(item.localId, controller);

    setQueue((prev) =>
      prev.map((q) =>
        q.localId === item.localId
          ? { ...q, status: 'uploading', progress: 8, errorMessage: undefined }
          : q
      )
    );

    try {
      const fileData = await readFileAsDataUrl(item.file);
      if (controller.signal.aborted) {
        throw Object.assign(new Error('Upload cancelled'), { name: 'CanceledError' });
      }

      await recordsApi.uploadRecord(
        {
          title: item.title.trim(),
          recordType,
          recordDate: new Date(recordDate).toISOString(),
          description: description.trim() || undefined,
          doctorName: doctorName.trim() || undefined,
          facilityName: facilityName.trim() || undefined,
          fileName: item.file.name,
          fileSize: item.file.size,
          mimeType: item.mimeType,
          fileData,
          allowDuplicate,
        },
        {
          signal: controller.signal,
          onProgress: (pct) => {
            setQueue((prev) =>
              prev.map((q) =>
                q.localId === item.localId ? { ...q, progress: Math.max(q.progress, pct) } : q
              )
            );
          },
        }
      );

      // Only mark uploaded AFTER backend confirms 201 Created
      setQueue((prev) =>
        prev.map((q) =>
          q.localId === item.localId
            ? { ...q, status: 'uploaded', progress: 100, errorMessage: undefined }
            : q
        )
      );
      invalidateRecordCaches();
      return true;
    } catch (err: unknown) {
      const parsed = extractApiError(err);
      const nextStatus: QueueItemStatus =
        parsed.code === 'CANCELLED'
          ? 'cancelled'
          : parsed.status === 409 || parsed.code === 'DUPLICATE_DOCUMENT'
            ? 'duplicate'
            : 'error';

      setQueue((prev) =>
        prev.map((q) =>
          q.localId === item.localId
            ? {
                ...q,
                status: nextStatus,
                progress: 0,
                errorMessage: parsed.message,
              }
            : q
        )
      );
      return false;
    } finally {
      controllersRef.current.delete(item.localId);
    }
  };

  const handleCancelItem = (localId: string) => {
    const ctrl = controllersRef.current.get(localId);
    if (ctrl) {
      ctrl.abort();
    }
  };

  const handleRemoveItem = (localId: string) => {
    handleCancelItem(localId);
    setQueue((prev) => prev.filter((q) => q.localId !== localId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (queue.length === 0) {
      setGlobalError('Please select or drag at least one valid medical document (PDF, JPG, PNG, WebP).');
      return;
    }

    if (!recordDate) {
      setGlobalError('Please select the document date.');
      return;
    }

    const pendingItems = queue.filter((q) => q.status === 'queued' || q.status === 'cancelled');
    if (pendingItems.length === 0) {
      return;
    }

    for (const item of pendingItems) {
      if (item.title.trim().length < 3) {
        setGlobalError(`Document title for "${item.file.name}" must be at least 3 characters.`);
        return;
      }
    }

    setIsSubmitting(true);
    let successCount = 0;

    for (const item of pendingItems) {
      const ok = await uploadSingleItem(item, false);
      if (ok) successCount += 1;
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      announce(
        `${successCount} medical document${successCount === 1 ? '' : 's'} uploaded and verified by server.`
      );
      onSuccess?.();
    }
  };

  const uploadedCount = queue.filter((q) => q.status === 'uploaded').length;
  const allUploaded = queue.length > 0 && uploadedCount === queue.length;
  const hasActionableQueue = queue.some((q) => q.status === 'queued' || q.status === 'cancelled');

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upload medical documents"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <m.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <m.div
            variants={modalEntrance}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-modal relative z-10 w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-float max-h-[92dvh] overflow-y-auto pb-safe"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Upload Medical Documents</h2>
                  <p className="text-xs text-muted-foreground">
                    Private, auth-gated storage with server-side file signature verification
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isSubmitting) {
                    handleReset();
                    onClose();
                  }
                }}
                disabled={isSubmitting}
                aria-label="Close upload dialog"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {globalError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-error flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* Drag & Drop Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Select or Drag Documents (PDF, JPG, JPEG, PNG, WebP — Max 10 MB each)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files) {
                      addFilesToQueue(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                  className={`p-6 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all flex flex-col items-center justify-center space-y-2 focus-ring ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-border/80 hover:border-primary/60 bg-muted/20'
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {isDragging
                        ? 'Drop files to add to secure upload queue'
                        : 'Drag & drop medical files here, or browse files'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Supports multiple PDFs or images • Executables & scripts are blocked
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-File Upload Queue */}
              {queue.length > 0 && (
                <div className="space-y-2" aria-label="Selected files queue">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      Upload Queue ({uploadedCount}/{queue.length} confirmed)
                    </span>
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => setQueue([])}
                        className="text-[11px] text-muted-foreground hover:text-error"
                      >
                        Clear queue
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {queue.map((item) => {
                      const isPdf = item.mimeType.includes('pdf');
                      return (
                        <div
                          key={item.localId}
                          className="p-3 rounded-xl border border-border bg-card space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                {isPdf ? (
                                  <FileText className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={item.title}
                                  disabled={item.status === 'uploading' || item.status === 'uploaded'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQueue((prev) =>
                                      prev.map((q) =>
                                        q.localId === item.localId ? { ...q, title: val } : q
                                      )
                                    );
                                  }}
                                  aria-label={`Document title for ${item.file.name}`}
                                  placeholder="Enter document title..."
                                  className="w-full bg-surface border border-border/70 rounded-md px-2 py-1 text-xs font-semibold text-foreground disabled:opacity-70 focus-ring"
                                />
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  <span className="truncate max-w-[200px]">{item.file.name}</span>
                                  <span>• {formatFileSize(item.file.size)}</span>
                                  {item.status === 'uploaded' && (
                                    <Badge variant="success" size="sm" className="gap-1">
                                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                      Confirmed
                                    </Badge>
                                  )}
                                  {item.status === 'uploading' && (
                                    <Badge variant="info" size="sm" className="gap-1">
                                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                      {item.progress}%
                                    </Badge>
                                  )}
                                  {item.status === 'duplicate' && (
                                    <Badge variant="warning" size="sm" className="gap-1">
                                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                      Duplicate Detected
                                    </Badge>
                                  )}
                                  {item.status === 'error' && (
                                    <Badge variant="destructive" size="sm">
                                      Failed
                                    </Badge>
                                  )}
                                  {item.status === 'cancelled' && (
                                    <Badge variant="outline" size="sm">
                                      Cancelled
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.status === 'uploading' ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelItem(item.localId)}
                                  aria-label={`Cancel upload for ${item.file.name}`}
                                  className="h-7 px-2 text-[11px] text-error gap-1"
                                >
                                  <Ban className="h-3 w-3" aria-hidden="true" />
                                  Cancel
                                </Button>
                              ) : item.status === 'error' || item.status === 'cancelled' ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => uploadSingleItem(item, false)}
                                  className="h-7 px-2 text-[11px] gap-1"
                                >
                                  <RotateCw className="h-3 w-3" aria-hidden="true" />
                                  Retry
                                </Button>
                              ) : item.status === 'duplicate' ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => uploadSingleItem(item, true)}
                                  className="h-7 px-2 text-[11px]"
                                >
                                  Upload Anyway
                                </Button>
                              ) : null}

                              {item.status !== 'uploading' && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.localId)}
                                  aria-label={`Remove ${item.file.name} from queue`}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-error"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Upload Progress Bar */}
                          {item.status === 'uploading' && (
                            <div
                              role="progressbar"
                              aria-valuenow={item.progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
                            >
                              <div
                                style={{ width: `${item.progress}%` }}
                                className="h-full bg-primary rounded-full transition-all duration-150"
                              />
                            </div>
                          )}

                          {item.errorMessage && (
                            <p className="text-[11px] text-error leading-snug">{item.errorMessage}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shared Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Document Category <span className="text-error">*</span>
                  </label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as MedicalRecordType)}
                    disabled={isSubmitting}
                    className="w-full h-11 sm:h-10 bg-surface border border-border rounded-lg px-3 text-base sm:text-xs text-foreground focus-ring"
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <span>Document Date</span> <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="w-full h-11 sm:h-10 bg-surface border border-border rounded-lg px-3 text-base sm:text-xs text-foreground focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <span>Doctor / Practitioner (Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. Dr. Rajesh Verma"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <span>Healthcare Facility (Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. City Diagnostics Centre"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Notes / Context (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Optional summary or context for this document..."
                  rows={2}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-base sm:text-xs text-foreground focus-ring"
                />
              </div>

              {/* Honest Privacy & Security Notice */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                <span>
                  Files are validated by server-side binary magic-byte inspection, stored privately
                  as <strong className="text-foreground">Self-Submitted</strong> documents, and
                  accessible only to you or doctors with active consent.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  disabled={isSubmitting}
                >
                  {allUploaded ? 'Done' : 'Cancel'}
                </Button>
                {hasActionableQueue && (
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          Upload {queue.filter((q) => q.status === 'queued' || q.status === 'cancelled').length}{' '}
                          Document
                          {queue.filter((q) => q.status === 'queued' || q.status === 'cancelled').length === 1
                            ? ''
                            : 's'}
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default RecordUploadDialog;
