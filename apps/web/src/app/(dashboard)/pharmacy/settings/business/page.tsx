'use client';

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  X,
  FileCheck2,
} from 'lucide-react';
import {
  usePharmacyProfile,
  useUploadPharmacyDocument,
  useDeletePharmacyDocument,
  useUpdatePharmacyProfile,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PharmacyDocumentType } from '@healthbridge/shared-types';

export default function PharmacyBusinessSettingsPage() {
  const { data: profile, isLoading } = usePharmacyProfile();
  const updateProfileMutation = useUpdatePharmacyProfile();
  const uploadDocMutation = useUploadPharmacyDocument();
  const deleteDocMutation = useDeletePharmacyDocument();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [licenseIssueDate, setLicenseIssueDate] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState<PharmacyDocumentType>('DRUG_LICENSE');
  const [docNumber, setDocNumber] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setRegistrationNumber(profile.registrationNumber || '');
      setGstin(profile.gstin || '');
      if (profile.licenseIssueDate) {
        setLicenseIssueDate(profile.licenseIssueDate.slice(0, 10));
      }
      if (profile.licenseExpiryDate) {
        setLicenseExpiryDate(profile.licenseExpiryDate.slice(0, 10));
      }
    }
  }, [profile]);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingBusiness(true);
    setFeedbackMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        registrationNumber: registrationNumber.trim() || undefined,
        licenseIssueDate: licenseIssueDate ? new Date(licenseIssueDate).toISOString() : undefined,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate).toISOString() : undefined,
      });
      setFeedbackMessage({ type: 'success', text: 'Business registration details updated successfully' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to update registration details' });
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!docUrl.trim() || !fileName.trim()) {
      setUploadError('Document URL and file name are required');
      return;
    }

    try {
      await uploadDocMutation.mutateAsync({
        documentType: docType,
        documentNumber: docNumber.trim() || undefined,
        documentUrl: docUrl.trim(),
        fileName: fileName.trim(),
        fileSize: 1024 * 512, // 512KB mock size
        mimeType: 'application/pdf',
      });
      setShowUploadModal(false);
      setDocNumber('');
      setDocUrl('');
      setFileName('');
      setFeedbackMessage({ type: 'success', text: 'Document submitted for administrative audit' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this statutory document?')) return;
    try {
      await deleteDocMutation.mutateAsync(docId);
      setFeedbackMessage({ type: 'success', text: 'Document removed successfully' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to remove document' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full" />
        <div className="h-96 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
          <FileText className="w-3.5 h-3.5" />
          <span>Statutory Compliance & Licensing</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Business Details & Drug Licensing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review state drug controller credentials, pharmacy registration certificates, and compliance documents.
        </p>
      </div>

      <PharmacySettingsNav />

      {/* Security Invariant Alert: Zero Self-Approval */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <p className="font-semibold">
            Zero Self-Approval Statutory Compliance Rule (CDSCO / ABDM Invariant)
          </p>
          <p className="text-amber-700">
            Dispensaries cannot self-approve drug licenses or verification statuses. All uploaded certificates are verified independently by state regulatory officers. Document tampering is cryptographically audited.
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Verification Status Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Statutory Drug License Status
            </h2>
            <p className="text-xs text-slate-500">
              CDSCO / State Drugs Standard Control Organization verification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                profile?.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-3 py-1'
                  : 'bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-1'
              }
            >
              {profile?.verificationStatus === 'VERIFIED' ? (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
              )}
              {profile?.verificationStatus || 'PENDING'}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleUpdateBusiness} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Drug License Number (Form 20/21) *
              </label>
              <Input
                value={profile?.pharmacyLicenseNumber || ''}
                disabled
                className="bg-slate-50 text-slate-600 font-mono font-medium cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Issued by State Licensing Authority (Non-editable directly)
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Establishment Registration Number
              </label>
              <Input
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. REG-DL-2024-99881"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                GSTIN
              </label>
              <Input
                value={profile?.gstin || gstin}
                disabled
                className="bg-slate-50 text-slate-600 font-mono cursor-not-allowed"
                placeholder="07AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Issuing Regulatory Authority
              </label>
              <Input
                value={profile?.issuingAuthority || 'State Drugs Standard Control Organization'}
                disabled
                className="bg-slate-50 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                License Issue Date
              </label>
              <Input
                type="date"
                value={licenseIssueDate}
                onChange={(e) => setLicenseIssueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                License Expiry Date
              </label>
              <Input
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isUpdatingBusiness}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUpdatingBusiness ? 'Saving...' : 'Update Registration Dates'}
            </Button>
          </div>
        </form>
      </div>

      {/* Statutory Documents Section */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Statutory Verification Documents
            </h2>
            <p className="text-xs text-slate-500">
              Certified copies of Drug Licenses, Registered Pharmacist Certificates, and GST registration
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Upload Document
          </Button>
        </div>

        {(!profile?.documents || profile.documents.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">No documents submitted yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Please upload certified statutory certificates for verification.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {profile.documents.map((doc) => (
              <div
                key={doc.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      {doc.fileName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {doc.documentType.replace(/_/g, ' ')} {doc.documentNumber ? `• No: ${doc.documentNumber}` : ''}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Uploaded on {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      doc.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]'
                        : doc.verificationStatus === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border-rose-200 text-[11px]'
                        : 'bg-amber-100 text-amber-800 border-amber-200 text-[11px]'
                    }
                  >
                    {doc.verificationStatus}
                  </Badge>

                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-sky-600 rounded-md hover:bg-slate-100"
                    title="View Document"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    disabled={deleteDocMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Upload Statutory Document
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as PharmacyDocumentType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="DRUG_LICENSE">Drug License (Form 20/21)</option>
                  <option value="GST_CERTIFICATE">GST Registration Certificate</option>
                  <option value="PHARMACIST_REGISTRATION">Registered Pharmacist Registration Certificate</option>
                  <option value="SHOP_ESTABLISHMENT">Shop & Commercial Establishment Act License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document / Certificate Number
                </label>
                <Input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. DL-DEL-2024-99881"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  File Display Name *
                </label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Drug_License_Form_20_Certified.pdf"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Secure URL *
                </label>
                <Input
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://storage.healthbridge.in/pharmacy-docs/dl.pdf"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Hosted on secure HealthBridge S3/GCS private storage bucket
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploadDocMutation.isPending}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  {uploadDocMutation.isPending ? 'Submitting...' : 'Submit Document'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
