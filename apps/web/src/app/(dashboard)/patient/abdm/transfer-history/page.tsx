'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Link2,
  Search,
  Lock,
} from 'lucide-react';
import type { AbdmHealthInformationTransferDto } from '@healthbridge/shared-types';
import { abdmHieApi } from '@/features/abdm/api/abdm-hie-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientAbdmTransferHistoryPage() {
  const [transfers, setTransfers] = useState<AbdmHealthInformationTransferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await abdmHieApi.listTransfers();
      setTransfers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load ABDM transfer history.');
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
            <History className="h-6 w-6 text-teal-600" />
            ABDM Health Information Transfer History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auditable status history of consent-authorized HIP outbound pushes and HIU inbound imports.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/patient/abdm/health-records">
          <Button size="sm" variant="outline">
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
          <Button size="sm" variant="default">
            <History className="h-4 w-4 mr-1.5" /> Transfer History
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Loading transfer history...
        </div>
      ) : transfers.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-2">
          <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No ABDM Data Transfers Recorded</p>
          <p className="text-sm text-muted-foreground">
            Completed and pending consent-authorized health information exchanges will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((trf) => (
            <div key={trf.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm font-mono">{trf.internalTransferRef}</span>
                    <Badge variant="outline">{trf.role}</Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {trf.direction}
                    </Badge>
                    {trf.isMocked && (
                      <Badge className="bg-purple-100 text-purple-800 border-none text-[11px]">
                        MOCKED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Participant: {trf.participantId} &bull; Consent: <span className="font-mono">{trf.externalConsentId}</span> &bull; Categories: {trf.hiTypes.join(', ')}
                  </p>
                </div>
                <Badge
                  className={
                    trf.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 border-none'
                      : trf.status === 'FAILED'
                        ? 'bg-rose-100 text-rose-800 border-none'
                        : 'bg-amber-100 text-amber-800 border-none'
                  }
                >
                  {trf.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Encryption: {trf.encryptionApplied ? trf.encryptionProviderMode : 'Not applied'}
                </span>
                <span>Entries: {trf.totalEntries}</span>
                <span>Validated: {trf.validatedEntries}</span>
                <span>Imported: {trf.importedEntries}</span>
                <span>Quarantined: {trf.quarantinedEntries}</span>
              </div>

              {trf.stateHistory.length > 0 && (
                <div className="border-t pt-2 space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase">
                    State Transition Ledger
                  </p>
                  <div className="space-y-1">
                    {trf.stateHistory.map((step, idx) => (
                      <div key={idx} className="text-xs flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {new Date(step.occurredAt).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {step.fromState ? `${step.fromState} → ${step.toState}` : step.toState}
                        </Badge>
                        {step.reason && <span className="text-muted-foreground">{step.reason}</span>}
                      </div>
                    ))}
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
