'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UploadDoctorDocumentDto, DoctorDocumentType } from '@healthbridge/shared-types';

interface DoctorCredentialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: UploadDoctorDocumentDto) => Promise<void>;
  isUploading: boolean;
}

const DOCUMENT_TYPES: { label: string; value: DoctorDocumentType; description: string }[] = [
  {
    label: 'Medical Registration Certificate',
    value: 'MEDICAL_REGISTRATION',
    description: 'State Medical Council (SMC) or National Medical Commission (NMC) registration certificate.',
  },
  {
    label: 'Educational Qualification Certificate',
    value: 'QUALIFICATION',
    description: 'MBBS, MD, MS, DNB, or Super-specialty degree completion certificate.',
  },
  {
    label: 'Identity Verification Document',
    value: 'IDENTITY',
    description: 'Aadhaar Card, Passport, or Government photo ID for identity binding.',
  },
  {
    label: 'Experience Certificate / Appointment Letter',
    value: 'EXPERIENCE_CERTIFICATE',
    description: 'Hospital association or previous clinical consultant experience certificate.',
  },
  {
    label: 'Other Professional Credential',
    value: 'OTHER',
    description: 'Additional clinical fellowship, accreditation, or specialty board certification.',
  },
];

export function DoctorCredentialUploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
}: DoctorCredentialUploadModalProps) {
  const [documentType, setDocumentType] = useState<DoctorDocumentType>('MEDICAL_REGISTRATION');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Unsupported file format. Please upload a PDF, JPEG, or PNG document.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      const defaultTitle = DOCUMENT_TYPES.find((d) => d.value === documentType)?.label || file.name;
      setTitle(defaultTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg('Please select a document file to upload');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide a descriptive title for this credential');
      return;
    }

    try {
      setUploadProgress(40);
      await onUpload({
        documentType,
        title: title.trim(),
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
      });
      setUploadProgress(100);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload credential document');
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Upload Credential Document</h2>
              <p className="text-xs text-muted-foreground">
                Submit medical council certificates and credentials for administrative verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3 rounded-xl border border-border/80 bg-muted/40 text-xs flex items-start gap-2.5 text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Private & Encrypted Storage: </span>
              Uploaded medical certificates are strictly stored in private, access-controlled healthcare storage and are never exposed via public URLs.
            </div>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Credential Type</label>
            <select
              value={documentType}
              onChange={(e) => {
                const val = e.target.value as DoctorDocumentType;
                setDocumentType(val);
                const found = DOCUMENT_TYPES.find((d) => d.value === val);
                if (found && !selectedFile) {
                  setTitle(found.label);
                }
              }}
              className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {DOCUMENT_TYPES.find((d) => d.value === documentType)?.description}
            </p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Document Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Delhi Medical Council Registration Certificate 2024"
              className="text-xs h-9"
              maxLength={150}
            />
          </div>

          {/* File Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Choose Document File</label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-blue-500/50 transition-colors">
              <input
                type="file"
                id="doctor-file-upload"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
              />
              <label
                htmlFor="doctor-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Upload className="h-5 w-5" />
                </div>
                {selectedFile ? (
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      Click to select file or drag and drop
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Supported formats: PDF, JPEG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Uploading encrypted file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/80 flex items-center justify-end gap-3 bg-muted/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? 'Uploading Document...' : 'Upload Document'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DoctorCredentialUploadModal;
