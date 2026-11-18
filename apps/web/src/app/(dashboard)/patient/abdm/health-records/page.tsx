'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Link2,
  Search,
  History,
  Lock,
} from 'lucide-react';
import type { AbdmImportedRecordDto } from '@healthbridge/shared-types';
import { abdmHieApi } from '@/features/abdm/api/abdm-hie-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientAbdmHealthRecordsPage() {
  const [records, setRecords] = useState<AbdmImportedRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await abdmHieApi.listImportedRecords();
      setRecords(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load imported ABDM health records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (recordId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      setReviewingId(recordId);
      await abdmHieApi.reviewImportedRecord(recordId, {
        decision,
        reviewNotes: reviewNotes.trim() || `Patient ${decision.toLowerCase()}d quarantined external record`,
      });
      setReviewNotes('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to record review decision.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            ABDM External Health Records
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only external FHIR R4 clinical records imported through consent-governed ABDM HIU transfers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Navigation bar across ABDM HIE patient workflows */}
      <div className="flex flex-wrap gap-2">
        <Link href="/patient/abdm/health-records">
          <Button size="sm" variant="default">
            <FileText className="h-4 w-4 mr-1.5" /> Imported Records
          </Button>
        </Link>
        <Link href="/patient/abdm/linked-records">
          <Button size="sm" variant="outline">
            <Link2 className="h-4 w-4 mr-1.5" /> Linked Sources
          </Button>
        </Link>
        <Link href="/patient/abdm/record-discovery">
          <Button size="sm" variant="outline">
            <Search className="h-4 w-4 mr-1.5" /> Record Discovery
          </Button>
        </Link>
        <Link href="/patient/abdm/transfer-history">
          <Button size="sm" variant="outline">
            <History className="h-4 w-4 mr-1.5" /> Transfer History
          </Button>
        </Link>
        <Link href="/patient/consent">
          <Button size="sm" variant="outline">
            <Lock className="h-4 w-4 mr-1.5" /> Consent Manager
          </Button>
        </Link>
      </div>

      {/* Authorization boundary notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-900 p-4 text-sm">
        <p className="font-medium text-blue-900 dark:text-blue-200">
          Patient Authorization Flow (Strictly Separated Layers)
        </p>
        <p className="text-blue-800 dark:text-blue-300 mt-1">
          1. Verify ABHA Identity &rarr; 2. Discover &amp; Link External Care Contexts &rarr; 3. Approve ABDM Consent in Official PHR App &rarr; 4. Encrypted HIU Retrieval &amp; FHIR Validation. Imported records retain immutable provenance and cannot be altered.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Loading imported ABDM health records...
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-2">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No Imported External ABDM Records Yet</p>
          <p className="text-sm text-muted-foreground">
            Start by discovering facilities in Record Discovery, linking eligible care contexts, and authorizing consent via the ABDM Consent Manager.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border bg-card p-5 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-base">{rec.summary.title}</h2>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {rec.hiType}
                    </Badge>
                    {rec.isAmended && (
                      <Badge className="bg-amber-100 text-amber-800 border-none text-[11px]">
                        AMENDED REPORT
                      </Badge>
                    )}
                    {rec.isMocked && (
                      <Badge className="bg-purple-100 text-purple-800 border-none text-[11px]">
                        MOCKED_DEV
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: <span className="font-medium text-foreground">{rec.sourceOrganizationName}</span> ({rec.sourceParticipantId}) &bull; Consent: <span className="font-mono">{rec.externalConsentId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      rec.reviewStatus === 'QUARANTINED_REVIEW'
                        ? 'bg-amber-100 text-amber-800 border-none'
                        : rec.reviewStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-none'
                          : 'bg-emerald-100 text-emerald-800 border-none'
                    }
                  >
                    {rec.reviewStatus}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    FHIR: {rec.validationStatus}
                  </Badge>
                </div>
              </div>

              {rec.summary.clinicalHighlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {rec.summary.clinicalHighlights.map((item, idx) => (
                    <div key={idx} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                      <div className="text-muted-foreground">{item.label}</div>
                      <div className="font-semibold mt-0.5">
                        {item.value} {item.unit || ''}
                      </div>
                      {item.referenceRange && (
                        <div className="text-[11px] text-muted-foreground">
                          Ref: {item.referenceRange}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 border-t pt-2">
                <span>Imported: {new Date(rec.importedAt).toLocaleString()}</span>
                {rec.originalIssuedAt && (
                  <span>Issued: {new Date(rec.originalIssuedAt).toLocaleString()}</span>
                )}
                <span className="font-mono">SHA-256: {rec.bundleSha256.slice(0, 16)}...</span>
                <span>Read-Only External Provenance Preserved</span>
              </div>

              {rec.reviewStatus === 'QUARANTINED_REVIEW' && (
                <div className="rounded-md border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Quarantined for Manual Verification: {rec.quarantineReason}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Review verification notes..."
                      className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="default"
                      disabled={reviewingId === rec.id}
                      onClick={() => handleReview(rec.id, 'APPROVE')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve Match
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={reviewingId === rec.id}
                      onClick={() => handleReview(rec.id, 'REJECT')}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
