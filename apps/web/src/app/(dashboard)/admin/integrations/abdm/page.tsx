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
} from 'lucide-react';
import type {
  AbdmIntegrationStatus,
  AbdmIntegrationStatusDashboardDto,
} from '@healthbridge/shared-types';
import { abdmApi } from '@/features/abdm/api/abdm-api';
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
  const [data, setData] = useState<AbdmIntegrationStatusDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await abdmApi.getIntegrationStatus();
      setData(res);
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
              Day 7 Task 01 — Integration Foundation
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
