'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadRecord } from '@/features/records/hooks/use-records';
import type { MedicalRecordType, CreateMedicalRecordDto } from '@healthbridge/shared-types';
import { RECORD_CONFIG } from '@healthbridge/config';

export interface RecordUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: Array<{ value: MedicalRecordType; label: string }> = [
  { value: 'OP_CONSULTATION', label: 'Doctor Consultation (OPD)' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'DIAGNOSTIC_REPORT', label: 'Diagnostic / Lab Report' },
  { value: 'DISCHARGE_SUMMARY', label: 'Hospital Discharge Summary' },
  { value: 'IMMUNIZATION_RECORD', label: 'Vaccination / Immunization' },
  { value: 'WELLNESS_RECORD', label: 'Wellness & Health History' },
];

export function RecordUploadDialog({ isOpen, onClose, onSuccess }: RecordUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState<MedicalRecordType>('OP_CONSULTATION');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [description, setDescription] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const uploadMutation = useUploadRecord({
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        handleReset();
        onSuccess?.();
        onClose();
      }, 1200);
    },
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setTitle('');
    setRecordType('OP_CONSULTATION');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setDoctorName('');
    setFacilityName('');
    setDescription('');
    setSelectedFile(null);
    setFileBase64('');
    setValidationError(null);
    setIsSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Size (10MB max)
    if (file.size > RECORD_CONFIG.maxFileSize) {
      setValidationError('File size exceeds the 10 MB limit. Please select a smaller document.');
      return;
    }

    // Validate MIME Type
    const allowed = RECORD_CONFIG.allowedMimeTypes as readonly string[];
    if (!allowed.includes(file.type)) {
      setValidationError(
        `Unsupported file type (${file.type || 'unknown'}). Supported formats: PDF, JPEG, PNG, WebP.`
      );
      return;
    }

    setSelectedFile(file);

    // Auto-fill title if empty
    if (!title) {
      const sanitizedName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();
      setTitle(sanitizedName);
    }

    // Read file as Base64 for safe upload
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim() || title.trim().length < 3) {
      setValidationError('Record title must be at least 3 characters long.');
      return;
    }

    if (!recordDate) {
      setValidationError('Please select the date of the medical record.');
      return;
    }

    const payload: CreateMedicalRecordDto = {
      title: title.trim(),
      recordType,
      recordDate: new Date(recordDate).toISOString(),
      description: description.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      facilityName: facilityName.trim() || undefined,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      mimeType: selectedFile?.type,
      fileData: fileBase64 || undefined,
    };

    uploadMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Upload Health Record</h2>
              <p className="text-xs text-muted-foreground">
                Securely store documents in your ABDM-compliant vault
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Record Uploaded Successfully!</h3>
            <p className="text-xs text-muted-foreground">
              Your health record has been indexed and encrypted in your personal vault.
            </p>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Validation or Mutation Error */}
            {(validationError || uploadMutation.isError) && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {validationError ||
                    uploadMutation.error?.message ||
                    'Failed to upload record. Please try again.'}
                </span>
              </div>
            )}

            {/* File Selection Dropzone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Document File (PDF, JPEG, PNG, WebP — Max 10MB)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/15 cursor-pointer text-center transition-colors flex flex-col items-center justify-center space-y-2"
              >
                {selectedFile ? (
                  <>
                    <FileCheck className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">
                        Click to select document or drag & drop
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Supports PDF prescriptions, discharge summaries, or diagnostic scans
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Document Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Record Title <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cardiology OPD Follow-up Note"
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Category and Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Record Category <span className="text-destructive">*</span>
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as MedicalRecordType)}
                  className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Record Date</span> <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Provider and Facility row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>Doctor / Practitioner</span>
                </label>
                <Input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Verma"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span>Healthcare Facility</span>
                </label>
                <Input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. AIIMS New Delhi"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Clinical description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Clinical Notes / Observations
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter doctor's diagnosis, medication instructions, or diagnostic remarks..."
                rows={3}
                className="w-full bg-background border border-border/80 rounded-xl p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
              />
            </div>

            {/* Privacy note */}
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>
                Document will be tagged as <strong>Self-Submitted</strong> and protected under DISHA
                privacy standards.
              </span>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={uploadMutation.isPending}
                className="text-xs h-9 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                size="sm"
                disabled={uploadMutation.isPending}
                className="text-xs h-9 px-4 gap-1.5"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Save Health Record'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RecordUploadDialog;
