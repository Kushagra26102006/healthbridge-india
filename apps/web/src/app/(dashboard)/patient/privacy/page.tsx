'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  Download,
  FileEdit,
  Trash2,
  CheckCircle2,
  Clock,
  Share2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  privacyApi,
  type PatientPrivacyOverviewDto,
  type AccessHistoryItemDto,
  type PrivacyRequestDto,
} from '@/features/privacy/api/privacy-api';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { RolePrivacyBanner } from '@/components/security/RolePrivacyBanner';

type PrivacyTab = 'overview' | 'access' | 'export' | 'correction' | 'closure';

const EXPORT_CATEGORIES = [
  { key: 'PROFILE', label: 'Profile & Contact Details' },
  { key: 'APPOINTMENTS', label: 'Appointments' },
  { key: 'PRESCRIPTIONS', label: 'Prescriptions' },
  { key: 'LAB_REPORTS', label: 'Published Lab Reports' },
  { key: 'MEDICAL_RECORDS', label: 'Medical Records Metadata' },
  { key: 'CONSENT_HISTORY', label: 'Consent History' },
  { key: 'ACCESS_HISTORY', label: 'Data Access History' },
];

export default function PatientPrivacyDashboardPage() {
  const [tab, setTab] = useState<PrivacyTab>('overview');
  const [overview, setOverview] = useState<PatientPrivacyOverviewDto | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessHistoryItemDto[]>([]);
  const [exportsList, setExportsList] = useState<PrivacyRequestDto[]>([]);
  const [correctionsList, setCorrectionsList] = useState<PrivacyRequestDto[]>([]);
  const [deletionsList, setDeletionsList] = useState<PrivacyRequestDto[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'PROFILE',
    'APPOINTMENTS',
    'CONSENT_HISTORY',
  ]);
  const [correctionForm, setCorrectionForm] = useState({
    targetResource: 'PATIENT_PROFILE',
    fieldOrCategory: 'Emergency Contact',
    originalValueSnapshot: '',
    requestedCorrection: '',
    patientExplanation: '',
  });
  const [deletionForm, setDeletionForm] = useState({
    requestedAction: 'ACCOUNT_CLOSURE' as
      | 'ACCOUNT_DEACTIVATION'
      | 'ACCOUNT_CLOSURE'
      | 'DATA_DELETION'
      | 'DATA_ANONYMIZATION',
    reason: '',
    acknowledgeRetentionRules: false,
  });

  const loadAll = useCallback(async () => {
    try {
      const [ov, hist, exp, cor, del] = await Promise.all([
        privacyApi.getPatientOverview(),
        privacyApi.getAccessHistory(1, 20),
        privacyApi.listExportRequests(),
        privacyApi.listCorrectionRequests(),
        privacyApi.listDeletionRequests(),
      ]);
      setOverview(ov);
      setAccessHistory(hist.items || []);
      setExportsList(exp.items || []);
      setCorrectionsList(cor.items || []);
      setDeletionsList(del.items || []);
    } catch {
      setError('Unable to load privacy governance details right now.');
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleAcknowledgeNotice = async () => {
    if (!overview) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      await privacyApi.acknowledgeNotice(overview.privacyNotice.currentVersion);
      setFeedback('Privacy notice acknowledgement recorded.');
      await loadAll();
    } catch {
      setError('Failed to record privacy notice acknowledgement.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const created = await privacyApi.createExportRequest(selectedCategories);
      setFeedback(`Export ${created.referenceNumber} is ready (expires in 15 minutes).`);
      await loadAll();
    } catch {
      setError('Unable to generate data export request.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const created = await privacyApi.createCorrectionRequest(correctionForm);
      setFeedback(
        `Correction request ${created.referenceNumber} submitted for authorized review (original data preserved).`
      );
      setCorrectionForm({
        targetResource: 'PATIENT_PROFILE',
        fieldOrCategory: '',
        originalValueSnapshot: '',
        requestedCorrection: '',
        patientExplanation: '',
      });
      await loadAll();
    } catch {
      setError('Please complete all required correction fields.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const created = await privacyApi.createDeletionRequest(deletionForm);
      setFeedback(
        `Privacy request ${created.referenceNumber} submitted. Finalized clinical records remain protected under retention rules.`
      );
      setDeletionForm({
        requestedAction: 'ACCOUNT_CLOSURE',
        reason: '',
        acknowledgeRetentionRules: false,
      });
      await loadAll();
    } catch {
      setError('Please provide a reason and acknowledge clinical retention rules.');
    } finally {
      setBusy(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  return (
    <ProtectedRoute allowedRoles={['PATIENT']} redirectUnauth>
      <div className="space-y-6 max-w-6xl mx-auto">
        <RolePrivacyBanner role="PATIENT" />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              <span>Privacy & Personal Data Controls</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your health data permissions, see who accessed your records, and exercise your data rights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/patient/consent"
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted"
            >
              Manage Consents
            </Link>
            <Link
              href="/patient/data-sharing"
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Data Sharing & ABDM</span>
            </Link>
            <Link
              href="/patient/privacy-notice"
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Privacy Notice</span>
            </Link>
          </div>
        </div>

        {/* Feedback banners */}
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: 'overview', label: 'Privacy Overview', icon: ShieldCheck },
            { id: 'access', label: 'Data Access History', icon: Eye },
            { id: 'export', label: 'Export My Data', icon: Download },
            { id: 'correction', label: 'Request Correction', icon: FileEdit },
            { id: 'closure', label: 'Closure & Deletion', icon: Trash2 },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as PrivacyTab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Active Consent Grants</p>
                <p className="text-2xl font-bold mt-1">{overview?.consentSummary.activeGrants ?? 0}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {overview?.consentSummary.pendingRequests ?? 0} pending •{' '}
                  {overview?.consentSummary.revokedConsents ?? 0} revoked
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Logged Access Events</p>
                <p className="text-2xl font-bold mt-1">
                  {overview?.accessTransparency.totalLoggedAccessEvents ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Auditable record views & access attempts
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Open Privacy Requests</p>
                <p className="text-2xl font-bold mt-1">{overview?.rightsRequests.openCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {overview?.rightsRequests.total ?? 0} total submitted
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">External Sharing (ABDM)</p>
                <p className="text-lg font-bold mt-1 capitalize">
                  {overview?.dataSharingStatus.abdmEnabled ? 'Active (Consent-Gated)' : 'Disabled / Local Only'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Explicit consent required before sharing
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold">
                  Privacy Notice Version {overview?.privacyNotice.currentVersion || '1.0.0-draft'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.privacyNotice.acknowledged
                    ? 'You have acknowledged the current privacy notice.'
                    : 'Review how HealthBridge India handles your health information and record your acknowledgement.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/patient/privacy-notice"
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Read Notice
                </Link>
                {!overview?.privacyNotice.acknowledged && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleAcknowledgeNotice}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
                  >
                    Acknowledge Notice
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Access Transparency History */}
        {tab === 'access' && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold">Who Accessed Your Health Information</h2>
              <p className="text-xs text-muted-foreground">
                Every authorized view and denied access attempt is logged in an append-only transparency ledger.
              </p>
            </div>
            {accessHistory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No access events have been recorded yet for your account.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-3">Actor / Role</th>
                      <th className="py-2 pr-3">Organization</th>
                      <th className="py-2 pr-3">Resource Category</th>
                      <th className="py-2 pr-3">Purpose</th>
                      <th className="py-2 pr-3">Decision</th>
                      <th className="py-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {accessHistory.map((ev) => (
                      <tr key={ev.accessEventId}>
                        <td className="py-2.5 pr-3 font-medium">
                          {ev.actorDisplay} ({ev.actorRole})
                        </td>
                        <td className="py-2.5 pr-3">{ev.organization}</td>
                        <td className="py-2.5 pr-3 font-mono">{ev.resourceCategory}</td>
                        <td className="py-2.5 pr-3">{ev.accessPurpose}</td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              ev.authorizationDecision === 'ALLOWED'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {ev.authorizationDecision}
                          </span>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Patient Data Export */}
        {tab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleCreateExport} className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-base font-bold">Request Eligible Data Export (JSON)</h2>
              <p className="text-xs text-muted-foreground">
                Exports are generated privately for your account, exclude authentication secrets, and expire automatically after 15 minutes.
              </p>
              <div className="space-y-2">
                {EXPORT_CATEGORIES.map((cat) => (
                  <label key={cat.key} className="flex items-center gap-2.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.key)}
                      onChange={(e) =>
                        setSelectedCategories((prev) =>
                          e.target.checked ? [...prev, cat.key] : prev.filter((k) => k !== cat.key)
                        )
                      }
                      className="rounded border-border"
                    />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={busy || selectedCategories.length === 0}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
              >
                Generate Private Export
              </button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-sm font-bold">Recent Export Requests</h3>
              {exportsList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No exports requested yet.</p>
              ) : (
                exportsList.map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl border border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">{req.referenceNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[10px]">{req.status}</span>
                    </div>
                    <p className="text-muted-foreground">
                      Categories: {(req.exportCategories || []).join(', ')}
                    </p>
                    {req.exportArtifact && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {req.exportArtifact.expired
                            ? 'Expired'
                            : `Expires ${new Date(req.exportArtifact.expiresAt).toLocaleTimeString()}`}
                        </span>
                        {!req.exportArtifact.expired && (
                          <a
                            href={`${apiBase}${API_ENDPOINTS.PRIVACY.EXPORT_DOWNLOAD(req.id)}`}
                            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                          >
                            Download JSON
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Correction Request */}
        {tab === 'correction' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleCreateCorrection} className="rounded-2xl border border-border bg-card p-6 space-y-3.5">
              <h2 className="text-base font-bold">Request Data Correction or Clinical Amendment</h2>
              <p className="text-xs text-muted-foreground">
                Original clinical records are never overwritten directly. Corrections to finalized medical records, prescriptions, or lab reports are routed for authorized amendment review.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium">Target Record Category</label>
                <select
                  value={correctionForm.targetResource}
                  onChange={(e) => setCorrectionForm((f) => ({ ...f, targetResource: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                >
                  <option value="PATIENT_PROFILE">Personal Profile</option>
                  <option value="MEDICAL_RECORD">Medical Record (Clinical Amendment)</option>
                  <option value="PRESCRIPTION">Prescription (Clinical Amendment)</option>
                  <option value="LAB_REPORT">Laboratory Report (Clinical Amendment)</option>
                  <option value="APPOINTMENT">Appointment Record</option>
                  <option value="ABHA_MAPPING">ABHA Identity Mapping</option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Field or section (e.g. Date of Birth, Allergy List)"
                value={correctionForm.fieldOrCategory}
                onChange={(e) => setCorrectionForm((f) => ({ ...f, fieldOrCategory: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
              />
              <input
                type="text"
                placeholder="Current value shown (optional)"
                value={correctionForm.originalValueSnapshot}
                onChange={(e) => setCorrectionForm((f) => ({ ...f, originalValueSnapshot: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
              />
              <textarea
                required
                rows={2}
                placeholder="Requested correction"
                value={correctionForm.requestedCorrection}
                onChange={(e) => setCorrectionForm((f) => ({ ...f, requestedCorrection: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
              />
              <textarea
                required
                rows={2}
                placeholder="Explain why this correction is needed"
                value={correctionForm.patientExplanation}
                onChange={(e) => setCorrectionForm((f) => ({ ...f, patientExplanation: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
              >
                Submit Correction Request
              </button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-sm font-bold">Your Correction Requests</h3>
              {correctionsList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No correction requests submitted.</p>
              ) : (
                correctionsList.map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl border border-border text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-mono font-semibold">{req.referenceNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[10px]">{req.status}</span>
                    </div>
                    <p className="font-medium">
                      {req.correctionDetails?.targetResource} — {req.correctionDetails?.fieldOrCategory}
                    </p>
                    <p className="text-muted-foreground">{req.correctionDetails?.requestedCorrection}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Account Closure & Deletion */}
        {tab === 'closure' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleCreateDeletion} className="rounded-2xl border border-border bg-card p-6 space-y-3.5">
              <h2 className="text-base font-bold">Account Closure & Personal Data Deletion</h2>
              <p className="text-xs text-muted-foreground">
                We distinguish between account closure, personal data erasure, and restricted clinical retention. Finalized clinical records, prescriptions, lab reports, and audit trails are protected for patient safety and legal obligations and are never automatically deleted on account closure.
              </p>
              <select
                value={deletionForm.requestedAction}
                onChange={(e) =>
                  setDeletionForm((f) => ({
                    ...f,
                    requestedAction: e.target.value as typeof f.requestedAction,
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
              >
                <option value="ACCOUNT_DEACTIVATION">Account Deactivation (Reversible)</option>
                <option value="ACCOUNT_CLOSURE">Account Closure (Retain Protected Clinical Records)</option>
                <option value="DATA_DELETION">Eligible Personal Data Deletion</option>
                <option value="DATA_ANONYMIZATION">Eligible Data Anonymization</option>
              </select>
              <textarea
                required
                rows={3}
                placeholder="Reason for request"
                value={deletionForm.reason}
                onChange={(e) => setDeletionForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
              />
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={deletionForm.acknowledgeRetentionRules}
                  onChange={(e) =>
                    setDeletionForm((f) => ({ ...f, acknowledgeRetentionRules: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-border"
                />
                <span className="text-muted-foreground">
                  I understand that finalized clinical records, active legal holds, encrypted disaster-recovery backups, and records stored independently by external hospitals/ABDM HIPs cannot be instantaneously deleted.
                </span>
              </label>
              <button
                type="submit"
                disabled={busy || !deletionForm.acknowledgeRetentionRules}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                Submit Closure / Deletion Request
              </button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-sm font-bold">Your Closure & Deletion Requests</h3>
              {deletionsList.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No closure or deletion requests submitted.</p>
              ) : (
                deletionsList.map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl border border-border text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-mono font-semibold">{req.referenceNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[10px]">{req.status}</span>
                    </div>
                    <p className="font-medium">{req.deletionDetails?.requestedAction}</p>
                    {req.deletionDetails?.legalHoldBlocked && (
                      <p className="text-amber-600 dark:text-amber-400 font-semibold">
                        Active Legal Hold detected — disposal deferred pending legal review.
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Retained under policy:{' '}
                      {(req.deletionDetails?.retentionBlockedCategories || []).slice(0, 4).join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
