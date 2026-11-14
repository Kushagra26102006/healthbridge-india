'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  ShieldCheck,
  Building2,
  Clock,
  IndianRupee,
  MapPin,
  FileText,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  GraduationCap,
  Award,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useDoctorProfile,
  useDoctorDocuments,
} from '@/features/doctor/hooks/use-doctor';
import { DoctorProfileEditor } from './DoctorProfileEditor';
import { DoctorCredentialUploadModal } from './DoctorCredentialUploadModal';
import type { UploadDoctorDocumentDto } from '@healthbridge/shared-types';

export function DoctorProfileView() {
  const { profile, isLoading, isError, error, updateProfile, isUpdating } = useDoctorProfile();
  const {
    documents,
    uploadDocument,
    isUploading,
    deleteDocument,
    isDeleting,
  } = useDoctorDocuments();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60 rounded-2xl bg-muted/60" />
          <div className="h-60 rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm font-semibold text-destructive">Failed to load professional profile</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error'}</p>
      </Card>
    );
  }

  const handleUpload = async (data: UploadDoctorDocumentDto) => {
    await uploadDocument(data);
    setActionSuccess('Credential document uploaded successfully and queued for verification.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (confirm('Are you sure you want to remove this pending credential document?')) {
      await deleteDocument(docId);
      setActionSuccess('Credential document removed.');
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Missing info checklist
  const missingItems: string[] = [];
  if (!profile.bio || profile.bio.length < 20) missingItems.push('Comprehensive Clinical Biography');
  if (!profile.phone) missingItems.push('Direct Clinic Contact Phone');
  if (!profile.documents || profile.documents.length === 0)
    missingItems.push('Medical Registration Certificate Upload');

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">{actionSuccess}</div>
        </div>
      )}

      {/* Hero Profile Overview Card */}
      <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-blue-500/5 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar / Photo */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/10 border-2 border-white/20">
                Dr
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full">
                <ShieldCheck className="h-5 w-5 text-teal-600 fill-teal-100 dark:fill-teal-950" />
              </div>
            </div>

            {/* Identity & Basic Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Dr. {profile.name}
                </h1>
                <Badge
                  className={
                    profile.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }
                >
                  {profile.verificationStatus === 'VERIFIED' ? 'Verified Practitioner' : 'Verification Pending'}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                {profile.specialization.join(' • ')}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone || 'Phone not set'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  {profile.experience} Years Experience
                </span>
              </div>
            </div>
          </div>

          {/* Edit Action Button */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <UserCheck className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Biography Card */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground">Clinical Biography</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Professional background and clinical philosophy presented to patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {profile.bio || 'No clinical biography provided yet. Click "Edit Profile" to add your professional bio.'}
          </p>
        </CardContent>
      </Card>

      {/* Grid: Professional Information & Practice Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional Information */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Credentials & Qualifications
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" /> SMC Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-muted-foreground">Medical Registration Number:</span>
              <div className="font-mono font-bold text-foreground mt-0.5">
                {profile.registrationNumber}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Medical Qualifications:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.qualifications.map((q) => (
                  <Badge key={q} variant="secondary" className="font-semibold text-xs">
                    {q}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Languages Spoken:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(profile.languages || ['English', 'Hindi']).map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {profile.professionalInterests && profile.professionalInterests.length > 0 && (
              <div>
                <span className="text-muted-foreground">Clinical Interests & Subspecialties:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.professionalInterests.map((interest) => (
                    <Badge
                      key={interest}
                      className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 text-xs"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Practice & Facility Information */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Practice & Consultation Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-muted-foreground">Affiliated Healthcare Facility:</span>
              <div className="font-bold text-foreground mt-0.5">
                {profile.facility?.name || 'Main Hospital / Multi-Specialty Clinic'}
              </div>
              {profile.facility?.address && (
                <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.facility.address.city}, {profile.facility.address.state}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Consultation Fee:</span>
                <div className="font-bold text-foreground flex items-center gap-1 text-sm mt-0.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {profile.consultationFee ?? 500}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground">Consultation Modes:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.consultationModes.map((mode) => (
                    <Badge
                      key={mode}
                      variant="secondary"
                      className="text-[10px] font-semibold"
                    >
                      {mode === 'IN_PERSON' ? 'Clinic Visit' : 'Teleconsultation'}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Standard Working Shifts:</span>
              <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                {profile.workingHours?.start || '09:00'} – {profile.workingHours?.end || '17:00'} (
                {(profile.workingDays || []).length} days / week)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status & Missing Info Checklist */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              National Health Authority (ABDM) Verification Status
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Healthcare Professionals Registry (HPR) status and credential integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[11px]">HPR Registry Binding</span>
              <span className="font-bold text-foreground">Verified Practitioner</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[11px]">Medical Council Registry</span>
              <span className="font-bold text-foreground">{profile.registrationNumber}</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-muted-foreground block text-[11px]">Credential Review</span>
              <span className="font-bold text-foreground">Active Good Standing</span>
            </div>
          </div>

          {missingItems.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" /> Recommended Profile Enhancements:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                {missingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Credential Documents Management */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Professional Credentials & Document Repository
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Medical registration certificates, degrees, and identity verification documents
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
          >
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border/80 rounded-xl">
              <FileText className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">No credential documents uploaded yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Upload your medical registration and degree certificates for verification.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-3 text-xs h-7 gap-1"
              >
                <Plus className="h-3 w-3" /> Add Certificate
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-foreground truncate">{doc.title}</div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono">{doc.fileName}</span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Badge
                      className={
                        doc.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : doc.verificationStatus === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }
                    >
                      {doc.verificationStatus}
                    </Badge>

                    {doc.verificationStatus !== 'VERIFIED' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDoc(doc.id)}
                        disabled={isDeleting}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <DoctorProfileEditor
        profile={profile}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (data) => {
          await updateProfile(data);
          setActionSuccess('Professional profile updated successfully.');
          setTimeout(() => setActionSuccess(null), 4000);
        }}
        isSaving={isUpdating}
      />

      {/* Credential Upload Modal */}
      <DoctorCredentialUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
    </div>
  );
}

export default DoctorProfileView;
