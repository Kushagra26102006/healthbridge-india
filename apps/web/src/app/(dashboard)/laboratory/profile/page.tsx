'use client';

import React, { useState } from 'react';
import {
  useLaboratoryProfile,
  useUpdateLaboratoryProfile,
  useUploadLaboratoryDocument,
  useDeleteLaboratoryDocument,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Save,
  UploadCloud,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import type { LaboratoryDocumentType } from '@healthbridge/shared-types';

const DOCUMENT_TYPES: { type: LaboratoryDocumentType; label: string }[] = [
  { type: 'NABL_ACCREDITATION', label: 'NABL Accreditation Certificate' },
  { type: 'CLINICAL_ESTABLISHMENT_LICENSE', label: 'Clinical Establishment License' },
  { type: 'REGISTRATION_CERTIFICATE', label: 'State Medical Council / Lab Registration' },
  { type: 'ICMR_APPROVAL', label: 'ICMR Diagnostic Approval' },
  { type: 'BIO_MEDICAL_WASTE_CERTIFICATE', label: 'Bio-Medical Waste Management Authorization' },
  { type: 'POLLUTION_CONTROL_NOC', label: 'Pollution Control Board NOC' },
  { type: 'OTHER', label: 'Other Statutory Compliance Document' },
];

export default function LaboratoryProfilePage() {
  const { data: profile, isLoading } = useLaboratoryProfile();
  const updateProfileMutation = useUpdateLaboratoryProfile();
  const uploadDocMutation = useUploadLaboratoryDocument();
  const deleteDocMutation = useDeleteLaboratoryDocument();

  // Form State
  const [laboratoryName, setLaboratoryName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [facilityName, setFacilityName] = useState('');

  // Upload State
  const [uploadDocType, setUploadDocType] =
    useState<LaboratoryDocumentType>('NABL_ACCREDITATION');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadDocUrl, setUploadDocUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync state once profile is loaded
  React.useEffect(() => {
    if (profile) {
      setLaboratoryName(profile.laboratoryName || '');
      setDescription(profile.description || '');
      setContactEmail(profile.contactEmail || '');
      setContactPhone(profile.contactPhone || '');
      setWebsiteUrl(profile.websiteUrl || '');
      setStreet(profile.address?.street || '');
      setCity(profile.address?.city || '');
      setState(profile.address?.state || '');
      setPostalCode(profile.address?.postalCode || '');
      setFacilityName(profile.facilityName || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        laboratoryName,
        description,
        contactEmail,
        contactPhone,
        websiteUrl,
        facilityName,
        address: {
          street,
          city,
          state,
          postalCode,
          country: 'India',
        },
      });
      setStatusMessage({
        type: 'success',
        text: 'Laboratory profile updated successfully.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to update profile.',
      });
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!uploadDocNumber.trim() || !uploadDocUrl.trim() || !uploadFileName.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide document number, document URL, and file name.',
      });
      return;
    }

    try {
      await uploadDocMutation.mutateAsync({
        documentType: uploadDocType,
        documentNumber: uploadDocNumber.trim(),
        documentUrl: uploadDocUrl.trim(),
        fileName: uploadFileName.trim(),
        fileSize: Math.max(1024, uploadFileName.trim().length * 1024),
        mimeType: 'application/pdf',
      });
      setUploadDocNumber('');
      setUploadDocUrl('');
      setUploadFileName('');
      setStatusMessage({
        type: 'success',
        text: 'Document submitted to statutory verification vault.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Document upload failed.',
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document from the vault?')) return;
    try {
      await deleteDocMutation.mutateAsync(docId);
      setStatusMessage({
        type: 'success',
        text: 'Document removed from verification vault.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to delete document.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground">
        Loading laboratory profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {profile?.laboratoryName || 'Diagnostic Laboratory Profile'}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              License: {profile?.laboratoryLicenseNumber || 'N/A'} • Reg:{' '}
              {profile?.registrationNumber || 'Pending'}
            </p>
          </div>
        </div>

        {/* Zero Self-Approval Statutory Invariant Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-700 dark:text-teal-300">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span>Status: {profile?.verificationStatus || 'UNDER_REVIEW'}</span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Strict Invariant Warning */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block">Regulatory Safeguard (Zero Self-Approval):</strong>
          Laboratory statutory accreditation status is governed strictly by state health authorities and NABL. Manual alteration of verification badges by laboratory operators is programmatically blocked.
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            General Information & Facility Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Laboratory Brand Name
              </label>
              <input
                type="text"
                value={laboratoryName}
                onChange={(e) => setLaboratoryName(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Facility Name / Center
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description & Specializations
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://"
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Physical Laboratory Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Street Address & Premises
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Postal PIN
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Statutory Document Vault */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Statutory Document Vault & Accreditations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uploaded compliance documents are audited by regulatory bodies for NABL & ABDM accreditation.
          </p>
        </div>

        {/* Existing Documents List */}
        <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
          {!profile?.documents || profile.documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No compliance documents uploaded yet.
            </div>
          ) : (
            profile.documents.map((doc) => (
              <div
                key={doc.documentId}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {doc.documentType.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Doc #{doc.documentNumber} • {doc.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    {doc.verificationStatus}
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(doc.documentId)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Document Section */}
        <form onSubmit={handleUploadDocument} className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-teal-600" />
            Upload New Accreditation Document
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Document Type
              </label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value as LaboratoryDocumentType)}
                className="w-full text-xs rounded-xl bg-background border border-border p-2 focus:outline-none focus:border-teal-500"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.type} value={dt.type}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Document / Certificate #
              </label>
              <input
                type="text"
                value={uploadDocNumber}
                onChange={(e) => setUploadDocNumber(e.target.value)}
                placeholder="e.g. NABL-MC-2026-09"
                className="w-full text-xs rounded-xl bg-background border border-border p-2 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                File Display Name
              </label>
              <input
                type="text"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="e.g. nabl_certificate_2026.pdf"
                className="w-full text-xs rounded-xl bg-background border border-border p-2 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Secure Document Vault URL
            </label>
            <input
              type="url"
              value={uploadDocUrl}
              onChange={(e) => setUploadDocUrl(e.target.value)}
              placeholder="https://vault.healthbridge.in/docs/lab/..."
              className="w-full text-xs rounded-xl bg-background border border-border p-2 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={uploadDocMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {uploadDocMutation.isPending ? 'Submitting...' : 'Submit to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
