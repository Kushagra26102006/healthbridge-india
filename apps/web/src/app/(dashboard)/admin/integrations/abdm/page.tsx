'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  Webhook,
  FileCode2,
  FileCheck2,
  Server,
  DownloadCloud,
  Lock,
  ArrowLeft,
  Clock,
  Fingerprint,
  Activity,
} from 'lucide-react';
import type {
  AbdmConsentAdminAnalyticsDto,
  AbdmIntegrationStatus,
  AbhaIntegrationAnalyticsDto,
} from '@healthbridge/shared-types';
import { abdmApi, type AbdmAdminStatusWithAbhaDto } from '@/features/abdm/api/abdm-api';
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_BADGE_MAP: Record<AbdmIntegrationStatus, string> = {
  NOT_CONFIGURED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  CONFIGURED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  PENDING_ONBOARDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  MOCKED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  CONNECTIVITY_VERIFIED: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  SANDBOX_TESTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  PRODUCTION_NOT_ENABLED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
};

const CHECKLIST_STATUS_STYLE: Record<string, string> = {
  VERIFIED_FROM_DOCS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  PENDING_USER_ACTION: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  DEPENDENT_ON_ACCOUNT_ACCESS: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  DEPENDENT_ON_OFFICIAL_APPROVAL: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  NOT_YET_VERIFIED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function StatusPill({ status }: { status: AbdmIntegrationStatus }) {
  return (
    <Badge className={`${STATUS_BADGE_MAP[status]} border-none font-mono text-[11px]`}>
      {status}
    </Badge>
  );
}

export default function AdminAbdmIntegrationStatusPage() {
  const [data, setData] = useState<AbdmAdminStatusWithAbhaDto | null>(null);
  const [abhaAnalytics, setAbhaAnalytics] = useState<AbhaIntegrationAnalyticsDto | null>(null);
  const [consentAnalytics, setConsentAnalytics] = useState<AbdmConsentAdminAnalyticsDto | null>(
    null
  );
  const [syncingConsent, setSyncingConsent] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await abdmApi.getIntegrationStatus();
      setData(res);
      if (res.abhaAnalytics) {
        setAbhaAnalytics(res.abhaAnalytics);
      } else {
        const analytics = await abdmApi.getAbhaAnalytics();
        setAbhaAnalytics(analytics);
      }
      if (res.consentAnalytics) {
        setConsentAnalytics(res.consentAnalytics);
      } else {
        const cAnalytics = await abdmApi.getConsentAnalytics().catch(() => null);
        setConsentAnalytics(cAnalytics);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load ABDM integration readiness status. Ensure you are authenticated as ADMIN.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRunConsentSync = async () => {
    try {
      setSyncingConsent(true);
      setSyncNotice(null);
      const summary = await abdmConsentApi.triggerAdminSync();
      setSyncNotice(
        `Sync sweep (${summary.status}): ${summary.expiredRequestsMarked} expired requests, ${summary.expiredArtefactsMarked} expired artefacts, ${summary.externalStatusChecked} external checks.`
      );
      await loadStatus();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Consent sync sweep failed.');
    } finally {
      setSyncingConsent(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Admin
              </Button>
            </Link>
            <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-none">
              Day 7 Tasks 01–03 — ABDM, ABHA &amp; Consent Manager
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 pt-1">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            ABDM Integration Status & Onboarding Readiness
          </h1>
          <p className="text-sm text-slate-500">
            Internal governance view for Ayushman Bharat Digital Mission (ABDM) configuration,
            FHIR R4 mapping readiness, consent adapter separation, and sandbox onboarding prerequisites.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadStatus}
          disabled={loading}
          className="gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </Button>
      </div>

      {/* Security & Non-Production Governance Banner */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex items-start gap-3">
        <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-semibold">
            Foundation Mode Active — Zero Secrets Exposed &amp; Production Locked
          </p>
          <p>
            Credentials and secrets are managed exclusively through backend runtime environment
            variables and are never returned to the browser. Status badges only reflect
            <code> CONNECTIVITY_VERIFIED </code> or <code> SANDBOX_TESTED </code> once real
            official ABDM sandbox requests and test suites are executed.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadStatus}>
            Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Evaluating ABDM integration status...</p>
        </div>
      ) : data ? (
        <>
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Integration State
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {data.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <StatusPill status={data.overallStatus} />
              </div>
              <p className="text-xs text-slate-500">
                Environment: <strong className="font-mono uppercase">{data.environment}</strong>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Configuration Completeness
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {data.configurationCompletenessPercent}%
                </span>
                <span className="text-xs text-slate-500">parameters set</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${data.configurationCompletenessPercent}%` }}
                  className="h-full bg-teal-600 transition-all"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sandbox Connectivity
              </p>
              <StatusPill status={data.sandboxConnectivityStatus} />
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last success: {data.lastSuccessfulConnectivityCheckAt || 'Never'}
                </p>
                <p className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Last failure: {data.lastFailedConnectivityCheckAt || 'None'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Production Gate
              </p>
              <StatusPill
                status={
                  data.configSummary.productionLocked
                    ? 'PRODUCTION_NOT_ENABLED'
                    : 'PENDING_ONBOARDING'
                }
              />
              <p className="text-xs text-slate-500">
                {data.configSummary.productionLocked
                  ? 'Locked by ABDM_ALLOW_PRODUCTION=false'
                  : 'Production unlock flag set'}
              </p>
            </div>
          </div>

          {/* Subsystem Readiness Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                  <KeyRound className="h-4 w-4 text-teal-600" /> Credentials (Masked)
                </div>
                <StatusPill status={data.credentialStatus} />
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center justify-between">
                  <span>ABDM_CLIENT_ID</span>
                  {data.configSummary.clientIdConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span>ABDM_CLIENT_SECRET</span>
                  {data.configSummary.clientSecretConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span>ABDM_X_CM_ID</span>
                  {data.configSummary.xCmIdConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                  <Webhook className="h-4 w-4 text-teal-600" /> Callback / Webhook
                </div>
                <StatusPill status={data.callbackStatus} />
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center justify-between">
                  <span>ABDM_CALLBACK_URL</span>
                  {data.configSummary.callbackUrlConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span>ABDM_WEBHOOK_SECRET</span>
                  {data.configSummary.webhookSecretConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400" />
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span>Idempotency &amp; ±5m Replay Guard</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                  <FileCode2 className="h-4 w-4 text-teal-600" /> FHIR R4 Mapping
                </div>
                <StatusPill status={data.fhirMappingReadiness} />
              </div>
              <p className="text-xs text-slate-500">
                Dedicated internal-to-FHIR R4 mappers &amp; NRCeS Document Bundle structural
                validator ready (Composition entry[0], urn:uuid references, unmapped field tracking).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                  <FileCheck2 className="h-4 w-4 text-teal-600" /> Consent Adapter
                </div>
                <StatusPill status={data.consentAdapterReadiness} />
              </div>
              <p className="text-xs text-slate-500">
                Strict separation enforced between internal HealthBridge consents and ABDM HIE-CM
                signed Consent Artefacts.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                  <Server className="h-4 w-4 text-teal-600" /> HIP Readiness (M2)
                </div>
                <StatusPill status={data.hipReadiness} />
              </div>
              <p className="text-xs text-slate-500">
                Proposed Health Information Provider role pending HFR sandbox registration and
                Fidelius Curve25519 encryption integration.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                  <DownloadCloud className="h-4 w-4 text-teal-600" /> HIU Readiness (M3)
                </div>
                <StatusPill status={data.hiuReadiness} />
              </div>
              <p className="text-xs text-slate-500">
                Proposed Health Information User role pending HIE-CM consent-request workflow and
                external FHIR bundle decryption setup.
              </p>
            </div>
          </div>

          {/* ABHA Identity Integration Section (Day 7 Task 02) */}
          {abhaAnalytics && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-teal-600" />
                      ABHA Identity Integration &amp; Persisted Verification Telemetry
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Aggregate counts derived strictly from persisted ABHA link &amp; transaction
                      records. Zero patient identifiers, tokens, or secrets are exposed.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500">Auth:</span>
                    <StatusPill status={abhaAnalytics.authReadiness} />
                    <span className="text-[11px] text-slate-500">ABHA API:</span>
                    <StatusPill status={abhaAnalytics.abhaApiConfigStatus} />
                    <span className="text-[11px] text-slate-500">Sandbox:</span>
                    <StatusPill status={abhaAnalytics.sandboxAvailability} />
                  </div>
                </div>

                {/* Persisted Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-[11px] text-slate-500">Successful Verifications</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {abhaAnalytics.metrics.successfulVerifications}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-[11px] text-slate-500">Failed Verifications</p>
                    <p className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                      {abhaAnalytics.metrics.failedVerifications}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-[11px] text-slate-500">Pending Linking</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                      {abhaAnalytics.metrics.pendingLinkingRequests}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-[11px] text-slate-500">Active Linked Patients</p>
                    <p className="text-xl font-bold text-teal-700 dark:text-teal-400 mt-1">
                      {abhaAnalytics.metrics.activeLinkedPatients}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-[11px] text-slate-500">Total Transactions</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {abhaAnalytics.metrics.totalTransactions}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-[11px] text-slate-500">Unlinked Records</p>
                    <p className="text-xl font-bold text-slate-600 dark:text-slate-300 mt-1">
                      {abhaAnalytics.metrics.unlinkedLinks}
                    </p>
                  </div>
                </div>

                {/* Last Request Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Last Successful
                      ABHA Request
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {abhaAnalytics.lastSuccessfulRequestAt
                        ? new Date(abhaAnalytics.lastSuccessfulRequestAt).toLocaleString()
                        : 'None recorded'}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-rose-600" /> Last Failed ABHA Request
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {abhaAnalytics.lastFailedRequestAt
                        ? new Date(abhaAnalytics.lastFailedRequestAt).toLocaleString()
                        : 'None recorded'}
                    </span>
                  </div>
                </div>

                {/* Supported ABHA V3 Workflows Matrix */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-600" /> Verified ABHA V3 Workflows
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Workflow</th>
                          <th className="px-3 py-2 font-semibold">Official API</th>
                          <th className="px-3 py-2 font-semibold">Version</th>
                          <th className="px-3 py-2 font-semibold">Implementation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {abhaAnalytics.supportedWorkflows.map((wf) => (
                          <tr key={wf.workflow}>
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                              {wf.workflow}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              {wf.officialApi}
                            </td>
                            <td className="px-3 py-2 font-mono">{wf.version}</td>
                            <td className="px-3 py-2">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px]"
                              >
                                {wf.implementationStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Sanitized Integration Errors */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recent Sanitized ABHA Integration Errors ({abhaAnalytics.recentErrors.length})
                  </h3>
                  {abhaAnalytics.recentErrors.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No recent ABHA integration failures recorded.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800">
                      {abhaAnalytics.recentErrors.map((errItem, idx) => (
                        <div
                          key={`${errItem.correlationId}-${idx}`}
                          className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-rose-100 text-rose-800 border-none font-mono text-[10px]">
                                {errItem.failureCategory || 'ERROR'}
                              </Badge>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {errItem.workflowType}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">
                              {errItem.failureMessage || 'Verification error'}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              Correlation: {errItem.correlationId}
                            </p>
                          </div>
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {new Date(errItem.occurredAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABDM Consent Manager Integration Section (Day 7 Task 03 — Aggregate Only, Zero PII) */}
          {consentAnalytics && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-teal-600" />
                    ABDM Consent Manager Integration &amp; Synchronization Telemetry
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aggregate consent lifecycle metrics only. Zero patient-identifiable details are
                    exposed. Mocked development, sandbox, and production records are separated below.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={consentAnalytics.consentReadiness} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunConsentSync}
                    disabled={syncingConsent}
                    className="text-xs gap-1.5 h-8"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingConsent ? 'animate-spin' : ''}`} />
                    Run Expiry &amp; Status Sync
                  </Button>
                </div>
              </div>

              {syncNotice && (
                <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 px-3.5 py-2 text-xs text-teal-900 dark:text-teal-200">
                  {syncNotice}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-[11px] text-slate-500">Pending Requests</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {consentAnalytics.metrics.pendingRequests}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-[11px] text-slate-500">Approved Requests</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {consentAnalytics.metrics.approvedRequests}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-[11px] text-slate-500">Rejected Requests</p>
                  <p className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                    {consentAnalytics.metrics.rejectedRequests}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-[11px] text-slate-500">Expired Artefacts</p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {consentAnalytics.metrics.expiredArtefacts}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-[11px] text-slate-500">Revoked Artefacts</p>
                  <p className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
                    {consentAnalytics.metrics.revokedArtefacts}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Sync Failures</span>
                  <span className="font-mono font-semibold text-rose-600">
                    {consentAnalytics.metrics.syncFailures}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Callback Processing Failures</span>
                  <span className="font-mono font-semibold text-rose-600">
                    {consentAnalytics.metrics.callbackProcessingFailures}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Last Successful Sync</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {consentAnalytics.lastSuccessfulSyncAt
                      ? new Date(consentAnalytics.lastSuccessfulSyncAt).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              {/* Environment Separation Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 p-3">
                  <p className="font-semibold text-purple-900 dark:text-purple-200">
                    Mocked (Development)
                  </p>
                  <p className="text-purple-700 dark:text-purple-300 mt-0.5">
                    Requests: {consentAnalytics.environmentBreakdown.mockedDevelopment.requests} •
                    Artefacts: {consentAnalytics.environmentBreakdown.mockedDevelopment.artefacts}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 p-3">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">ABDM Sandbox</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                    Requests: {consentAnalytics.environmentBreakdown.sandbox.requests} • Artefacts:{' '}
                    {consentAnalytics.environmentBreakdown.sandbox.artefacts}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Production (Locked)
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Requests: {consentAnalytics.environmentBreakdown.production.requests} •
                    Artefacts: {consentAnalytics.environmentBreakdown.production.artefacts}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Onboarding Tasks Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Pending ABDM Sandbox Onboarding &amp; Certification Prerequisites
              </h2>
              <span className="text-xs text-slate-500">
                Evaluated: {new Date(data.evaluatedAt).toLocaleString()}
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.pendingOnboardingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {task.category}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{task.notes}</p>
                  </div>
                  <Badge
                    className={`${
                      CHECKLIST_STATUS_STYLE[task.status] || CHECKLIST_STATUS_STYLE.NOT_YET_VERIFIED
                    } border-none font-mono text-[10px] shrink-0 self-start sm:self-center`}
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
