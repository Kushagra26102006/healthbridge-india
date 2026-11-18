'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileKey2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  abdmConsentApi,
  type AbdmConsentFhirProjectionResponse,
} from '@/features/abdm/api/abdm-consent-api';
import type {
  AbdmConsentArtefactRecordDto,
  AbdmConsentRevocationResponseDto,
} from '@healthbridge/shared-types';

const STATUS_BADGE: Record<string, string> = {
  GRANTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  REVOKED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  EXPIRED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  DENIED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  PENDING_CONFIRMATION: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  CONFIRMED_REVOKED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  VALID: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  SIGNATURE_UNVERIFIED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
};

export default function PatientAbdmConsentArtefactsPage() {
  const [artefacts, setArtefacts] = useState<AbdmConsentArtefactRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [revokeResult, setRevokeResult] = useState<AbdmConsentRevocationResponseDto | null>(null);

  const [fhirPreview, setFhirPreview] = useState<{
    artefactRef: string;
    data: AbdmConsentFhirProjectionResponse;
  } | null>(null);
  const [fhirLoadingId, setFhirLoadingId] = useState<string | null>(null);

  const loadArtefacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await abdmConsentApi.listOwnArtefacts();
      setArtefacts(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load ABDM consent artefacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtefacts();
  }, [loadArtefacts]);

  const handleConfirmRevoke = async (artefactId: string) => {
    if (revokeReason.trim().length < 3) {
      setError('Please enter a brief reason (at least 3 characters) to initiate revocation.');
      return;
    }
    try {
      setRevokeSubmitting(true);
      setError(null);
      const res = await abdmConsentApi.revokeOwnArtefact(artefactId, revokeReason.trim());
      setRevokeResult(res);
      setRevokingId(null);
      setRevokeReason('');
      await loadArtefacts();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initiate revocation.');
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const handleViewFhir = async (art: AbdmConsentArtefactRecordDto) => {
    try {
      setFhirLoadingId(art.id);
      setError(null);
      const data = await abdmConsentApi.getOwnArtefactFhirProjection(art.id);
      setFhirPreview({ artefactRef: art.internalReference, data });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to generate FHIR R4 Consent projection.');
    } finally {
      setFhirLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patient/consent">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileKey2 className="h-6 w-6 text-teal-600" />
              ABDM Consent Artefacts
            </h1>
            <p className="text-xs text-slate-500">
              Immutable external ABDM HIE-CM Consent Artefacts synchronized to your account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadArtefacts}
            disabled={loading}
            className="text-xs rounded-xl gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/patient/consent/requests">
            <Button variant="outline" size="sm" className="text-xs rounded-xl">
              View Requests
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {revokeResult && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-1 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {revokeResult.message} (Status: {revokeResult.revocationStatus})
          </p>
          <p>{revokeResult.guidance}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-xs text-slate-500">
          Loading synchronized ABDM consent artefacts...
        </div>
      ) : artefacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-2">
          <ShieldCheck className="h-8 w-8 text-teal-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No ABDM Consent Artefacts Synchronized
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Consent artefacts appear here once you approve an ABDM consent request in your official
            ABDM PHR application and the Consent Manager delivers the artefact callback. Your
            internal HealthBridge self-access remains unaffected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {artefacts.map((art) => {
            const canRevoke =
              art.externalStatus === 'GRANTED' && art.revocationStatus === 'NOT_REVOKED';
            return (
              <div
                key={art.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {art.hiuName || art.hiuId}
                      </span>
                      <Badge
                        className={`${
                          STATUS_BADGE[art.externalStatus] || 'bg-slate-100 text-slate-700'
                        } border-none font-mono text-[10px]`}
                      >
                        HIE-CM: {art.externalStatus}
                      </Badge>
                      <Badge
                        className={`${
                          STATUS_BADGE[art.validationStatus] || 'bg-slate-100 text-slate-700'
                        } border-none font-mono text-[10px]`}
                      >
                        Validation: {art.validationStatus}
                      </Badge>
                      {art.revocationStatus !== 'NOT_REVOKED' && (
                        <Badge
                          className={`${
                            STATUS_BADGE[art.revocationStatus] || 'bg-amber-100 text-amber-800'
                          } border-none font-mono text-[10px]`}
                        >
                          Revocation: {art.revocationStatus}
                        </Badge>
                      )}
                      {art.isMocked && (
                        <Badge className="bg-purple-100 text-purple-800 border-none font-mono text-[10px]">
                          MOCK DEV
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Purpose: <strong>{art.purposeText}</strong> ({art.purposeCode}) • Mode:{' '}
                      <span className="font-mono">{art.accessMode}</span> • Signature Verified:{' '}
                      <strong>{art.signatureVerified ? 'Yes' : 'No (Fail-Closed)'}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewFhir(art)}
                      disabled={fhirLoadingId === art.id}
                      className="text-xs rounded-xl gap-1.5"
                    >
                      <FileCode2 className="h-3.5 w-3.5 text-teal-600" />
                      {fhirLoadingId === art.id ? 'Mapping...' : 'FHIR Consent View'}
                    </Button>
                    {canRevoke && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRevokingId(revokingId === art.id ? null : art.id)
                        }
                        className="text-xs rounded-xl gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                        Initiate Revocation
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">HI-Types Scope</p>
                    <div className="flex flex-wrap gap-1">
                      {art.hiTypes.map((hi) => (
                        <span
                          key={hi}
                          className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[11px]"
                        >
                          {hi}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Validity &amp; Range
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      Records: {new Date(art.dateRange.from).toLocaleDateString()} –{' '}
                      {new Date(art.dateRange.to).toLocaleDateString()}
                    </p>
                    <p className="text-slate-500">
                      Expires / Erase: {new Date(art.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Immutable Integrity
                    </p>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                      Consent ID: {art.externalConsentId}
                    </p>
                    <p className="font-mono text-[10px] text-slate-500 truncate">
                      SHA-256: {art.payloadSha256}
                    </p>
                  </div>
                </div>

                {/* Inline Revocation Confirmation Form */}
                {revokingId === art.id && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-4 space-y-3">
                    <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                      Initiate ABDM Consent Revocation
                    </p>
                    <p className="text-[11px] text-rose-800/90 dark:text-rose-300">
                      HealthBridge will immediately block internal/outbound access under this
                      artefact and mark revocation <code>PENDING_CONFIRMATION</code> until your
                      official ABDM PHR application confirms revocation with the HIE-CM. Consent
                      history is preserved immutably.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        placeholder="Reason for revoking consent (e.g. Consultation completed)"
                        className="text-xs rounded-xl bg-white dark:bg-slate-900"
                      />
                      <Button
                        size="sm"
                        disabled={revokeSubmitting}
                        onClick={() => handleConfirmRevoke(art.id)}
                        className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                      >
                        {revokeSubmitting ? 'Initiating...' : 'Confirm Revocation'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FHIR R4 Consent Projection Preview Modal/Card */}
      {fhirPreview && (
        <div className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-slate-900 p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                FHIR R4 Consent Projection — {fhirPreview.artefactRef}
              </h3>
              <p className="text-[11px] text-slate-500">
                Mapping Status: <code>{fhirPreview.data.mappingStatus}</code> • Official NRCeS IG
                Conformance Claimed: <code>false</code> (original ABDM artefact preserved)
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFhirPreview(null)} className="text-xs">
              Close
            </Button>
          </div>

          {fhirPreview.data.unmappedFields.length > 0 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Explicitly Reported Unmapped ABDM Fields:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {fhirPreview.data.unmappedFields.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 text-[11px] overflow-x-auto max-h-80">
            {JSON.stringify(fhirPreview.data.resource, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
