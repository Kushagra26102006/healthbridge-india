'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  History,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type {
  AbhaLinkStatusDto,
  AbhaTransactionHistoryItemDto,
} from '@healthbridge/shared-types';
import { abhaApi, extractAbhaErrorMessage } from '@/features/abdm/api/abha-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientAbhaHistoryPage() {
  const [history, setHistory] = useState<AbhaTransactionHistoryItemDto[]>([]);
  const [status, setStatus] = useState<AbhaLinkStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [hist, stat] = await Promise.all([abhaApi.getHistory(50), abhaApi.getStatus()]);
      setHistory(hist);
      setStatus(stat);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Unable to load ABHA identity history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/patient/abha">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to ABHA Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 pt-1">
            <History className="h-6 w-6 text-teal-600" />
            ABHA Identity &amp; Verification History
          </h1>
          <p className="text-sm text-slate-500">
            Privacy-safe audit log of your ABHA verification attempts, links, and address updates.
            Sensitive values (Aadhaar, OTPs, full ABHA numbers) are never stored in history logs.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ABHA Address History */}
      {status && status.abhaAddressHistory.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            ABHA Address History
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {status.abhaAddressHistory.map((entry, idx) => (
              <div key={`${entry.address}-${idx}`} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {entry.address}
                  </span>
                  <span className="ml-3 text-slate-500">
                    Updated: {new Date(entry.updatedAt).toLocaleString()}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Audit Timeline */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Verification &amp; Linking Activity ({history.length})
          </h2>
        </div>

        {loading && history.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No ABHA verification or linking events recorded yet.
            </p>
            <Link href="/patient/abha/link">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white mt-2">
                Start ABHA Linking
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {history.map((item) => {
              const isSuccess = item.verificationStatus === 'VERIFIED';
              const isFailed = item.verificationStatus === 'VERIFICATION_FAILED';
              return (
                <div
                  key={item.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isFailed ? (
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.workflowType.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {item.verificationStatus}
                      </Badge>
                      {item.isMocked && (
                        <Badge className="bg-purple-100 text-purple-800 border-none font-mono text-[10px]">
                          MOCK
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {item.maskedIdentifier && (
                        <span className="font-mono">Identifier: {item.maskedIdentifier}</span>
                      )}
                      {item.verificationMethod && <span>Method: {item.verificationMethod}</span>}
                      <span className="font-mono">Correlation: {item.correlationId}</span>
                    </div>
                    {item.failureMessage && (
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        [{item.failureCategory || 'ERROR'}] {item.failureMessage}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
