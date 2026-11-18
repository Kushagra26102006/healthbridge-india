'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Link2,
  RefreshCw,
  CheckCircle2,
  Unlink,
  AlertTriangle,
  FileText,
  Search,
  History,
  ShieldCheck,
} from 'lucide-react';
import type { AbdmLinkedHealthRecordDto } from '@healthbridge/shared-types';
import { abdmHieApi } from '@/features/abdm/api/abdm-hie-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientAbdmLinkedRecordsPage() {
  const [links, setLinks] = useState<AbdmLinkedHealthRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await abdmHieApi.listLinkedRecords();
      setLinks(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load linked ABDM health-record sources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (linkId: string) => {
    try {
      setBusyId(linkId);
      setError(null);
      await abdmHieApi.confirmLinking(linkId, {
        otpToken: otpInput[linkId]?.trim() || '123456',
        confirmed: true,
      });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to confirm care-context linking.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      setBusyId(linkId);
      setError(null);
      await abdmHieApi.unlinkRecord(linkId, 'Patient initiated local HealthBridge care-context unlink');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to unlink record.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="h-6 w-6 text-teal-600" />
            ABDM Linked Health-Record Sources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            External hospital &amp; laboratory care contexts linked to your verified ABHA profile.
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
          <Button size="sm" variant="default">
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
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm">
        <p className="font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Important Separation Notice
        </p>
        <p className="text-amber-800 dark:text-amber-300 mt-1">
          Linking your ABHA identity does <strong>not</strong> automatically link hospital records, and linking a care context does <strong>not</strong> grant consent to fetch medical data. Separate ABDM Consent Manager approval is always required before any health information exchange.
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
          Loading linked health-record sources...
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-2">
          <Link2 className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No Linked External Care Contexts</p>
          <p className="text-sm text-muted-foreground">
            Use Record Discovery to locate eligible care contexts from ABDM facilities and link them explicitly.
          </p>
          <Link href="/patient/abdm/record-discovery">
            <Button size="sm" className="mt-2">
              Go to Record Discovery
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-sm">{item.careContextDisplay}</h2>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {item.careContextReference}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {item.linkMode}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Facility: {item.participantName || item.participantId} &bull; Categories: {item.hiTypes.join(', ')}
                  </p>
                </div>
                <Badge
                  className={
                    item.status === 'LINKED'
                      ? 'bg-emerald-100 text-emerald-800 border-none'
                      : item.status === 'UNLINKED_LOCALLY'
                        ? 'bg-slate-200 text-slate-700 border-none'
                        : 'bg-amber-100 text-amber-800 border-none'
                  }
                >
                  {item.status}
                </Badge>
              </div>

              {item.status === 'OTP_VERIFICATION_PENDING' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={otpInput[item.id] || ''}
                    onChange={(e) =>
                      setOtpInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="Enter OTP token from HIP..."
                    className="rounded-md border bg-background px-3 py-1.5 text-xs w-56"
                  />
                  <Button
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => handleConfirm(item.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Link
                  </Button>
                </div>
              )}

              {item.status === 'LINKED' && (
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>
                    Linked: {item.linkedAt ? new Date(item.linkedAt).toLocaleString() : 'Confirmed'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => handleUnlink(item.id)}
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1" /> Local Unlink
                  </Button>
                </div>
              )}

              {item.unlinkScope === 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY' && (
                <p className="text-[11px] text-muted-foreground">
                  Scope: Unlinked locally inside HealthBridge only (external ABDM gateway unlinking is managed via your official ABDM PHR app).
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
