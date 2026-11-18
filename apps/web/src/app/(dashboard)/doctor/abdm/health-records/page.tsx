'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  FileText,
  RefreshCw,
  Lock,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import type { AbdmImportedRecordDto } from '@healthbridge/shared-types';
import { abdmHieApi } from '@/features/abdm/api/abdm-hie-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DoctorAbdmHealthRecordsPage() {
  const [records, setRecords] = useState<AbdmImportedRecordDto[]>([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (patientId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await abdmHieApi.listImportedRecords(patientId?.trim() || undefined);
      setRecords(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Unable to load authorized imported ABDM health records.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            Authorized External ABDM Health Records
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consent-scoped, strictly read-only clinical documents imported via ABDM HIU exchange.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(patientFilter)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Read-only provenance integrity guard banner */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 p-4 text-sm flex items-start gap-3">
        <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Read-Only External Provenance Enforcement</p>
          <p className="text-xs text-muted-foreground mt-1">
            Only verified records covered by an active, unrevoked ABDM Consent Artefact are displayed. Clinicians cannot edit, overwrite, or delete imported external source records, and no automated clinical diagnoses are synthesized from imported values.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
          placeholder="Optional Patient ObjectId filter..."
          className="rounded-md border bg-background px-3 py-1.5 text-sm w-72 font-mono"
        />
        <Button size="sm" onClick={() => load(patientFilter)}>
          Filter
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Loading consent-authorized ABDM records...
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-2">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No Consent-Authorized Imported Records Available</p>
          <p className="text-sm text-muted-foreground">
            External records become visible here only after an active ABDM Consent Artefact is granted and HIU validation completes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div key={rec.id} className="rounded-lg border bg-card p-5 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-base">{rec.summary.title}</h2>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {rec.hiType}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-none text-[11px]">
                      READ-ONLY EXTERNAL
                    </Badge>
                    {rec.isAmended && (
                      <Badge className="bg-amber-100 text-amber-800 border-none text-[11px]">
                        AMENDED
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {rec.sourceOrganizationName} ({rec.sourceParticipantId})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Imported: {new Date(rec.importedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[11px]">
                    {rec.validationStatus}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {rec.provenance.patientMatchConfidence}
                  </Badge>
                </div>
              </div>

              {rec.summary.clinicalHighlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rec.summary.clinicalHighlights.map((item, idx) => (
                    <div key={idx} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                      <div className="text-muted-foreground">{item.label}</div>
                      <div className="font-semibold mt-0.5">
                        {item.value} {item.unit || ''}
                      </div>
                      {item.referenceRange && (
                        <div className="text-[11px] text-muted-foreground">
                          Reference: {item.referenceRange}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Consent Context: <span className="font-mono">{rec.externalConsentId}</span>
                </span>
                <span>
                  Transaction: <span className="font-mono">{rec.externalTransactionId}</span>
                </span>
                <span>
                  Provenance Hash: <span className="font-mono">{rec.bundleSha256.slice(0, 16)}...</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
