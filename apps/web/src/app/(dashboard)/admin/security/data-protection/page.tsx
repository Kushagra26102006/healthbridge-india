'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  KeyRound,
  HardDrive,
  DatabaseBackup,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface DataProtectionStatusDto {
  encryptionInTransit: {
    tlsBypassDisabled: boolean;
    productionHstsConfigured: boolean;
    cookieHttpOnly: boolean;
  };
  keyManagement: {
    providerKind: string;
    isProductionSafe: boolean;
    activeKeyId: string | null;
    activeKeyVersion: number | null;
    totalKeyVersions: number;
    keys: Array<{
      keyId: string;
      version: number;
      status: string;
      createdAt: string;
      provider: string;
    }>;
  };
  documentStorage: {
    storageProvider: string;
    publicAccessEnabled: boolean;
    atRestApplicationEncryption: string;
    scannerName: string;
    malwareScanningOperational: boolean;
    storedDocumentCount: number;
    quarantinedOrFailedCount: number;
    cleanCount: number;
  };
  backupAndRecovery: {
    atlasAutomatedBackupStatus: string;
    drReadinessClassification: string;
    proposedTargets: { rtoTarget: string; rpoTarget: string };
    lastVerifiedBackup: { backupId: string; createdAt: string; environment: string } | null;
    restoreTestHistory: Array<{
      restoreId: string;
      backupId: string;
      targetEnvironment: string;
      status: string;
      reconciliationIssuesCount: number;
      completedAt: string;
    }>;
  };
  recentIncidents: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDataProtectionPage() {
  const [status, setStatus] = useState<DataProtectionStatusDto | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: DataProtectionStatusDto }>(
        API_ENDPOINTS.DATA_PROTECTION.ADMIN_STATUS
      );
      setStatus(res.data.data);
    } catch {
      setError('Unable to load data protection status.');
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleRotateKey = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiClient.post(API_ENDPOINTS.DATA_PROTECTION.ADMIN_ROTATE_KEY);
      const nextKeyId = res.data?.data?.rotatedTo?.keyId;
      setMessage(`Rotated active key version to ${nextKeyId}. Historical keys remain active for decryption.`);
      await loadStatus();
    } catch {
      setError('Failed to rotate active encryption key.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              <span>Data Protection, Encryption & Recovery Status</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Operational health metadata only — never exposes raw keys, credentials, clinical records, or backup contents.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleRotateKey}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>Rotate Active Key Version</span>
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Operational Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <KeyRound className="w-4 h-4 text-teal-600" />
              <span>Key Management & Encryption</span>
            </div>
            <p className="text-muted-foreground">
              Provider: <span className="font-mono text-foreground">{status?.keyManagement.providerKind || '—'}</span>
            </p>
            <p className="text-muted-foreground">
              Active Key ID: <span className="font-mono text-foreground">{status?.keyManagement.activeKeyId || '—'}</span>
            </p>
            <p className="text-muted-foreground">
              Production-Safe KMS:{' '}
              <strong className={status?.keyManagement.isProductionSafe ? 'text-emerald-600' : 'text-amber-600'}>
                {status?.keyManagement.isProductionSafe ? 'Yes' : 'No (Development Local Provider)'}
              </strong>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Private Document Storage & AV</span>
            </div>
            <p className="text-muted-foreground">
              Store: <span className="font-mono text-foreground">{status?.documentStorage.storageProvider || '—'}</span>
            </p>
            <p className="text-muted-foreground">
              Public Access:{' '}
              <strong className="text-emerald-600">
                {status?.documentStorage.publicAccessEnabled ? 'ENABLED (RISK)' : 'DISABLED'}
              </strong>
            </p>
            <p className="text-muted-foreground">
              Malware Scanner:{' '}
              <strong className={status?.documentStorage.malwareScanningOperational ? 'text-emerald-600' : 'text-amber-600'}>
                {status?.documentStorage.malwareScanningOperational ? 'Operational' : 'Not Configured (Quarantine Safe)'}
              </strong>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <DatabaseBackup className="w-4 h-4 text-purple-600" />
              <span>Backup & Disaster Recovery</span>
            </div>
            <p className="text-muted-foreground">
              Atlas Backups:{' '}
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {status?.backupAndRecovery.atlasAutomatedBackupStatus || '—'}
              </span>
            </p>
            <p className="text-muted-foreground">
              Proposed RTO: {status?.backupAndRecovery.proposedTargets.rtoTarget || '—'}
            </p>
            <p className="text-muted-foreground">
              Proposed RPO: {status?.backupAndRecovery.proposedTargets.rpoTarget || '—'}
            </p>
          </div>
        </div>

        {/* Key Versions Metadata Table */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-sm font-bold">Encryption Key Version Registry (Metadata Only)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3">Key ID</th>
                  <th className="py-2 pr-3">Version</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(status?.keyManagement.keys || []).map((k) => (
                  <tr key={k.keyId}>
                    <td className="py-2 pr-3 font-mono font-semibold">{k.keyId}</td>
                    <td className="py-2 pr-3">v{k.version}</td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">{k.status}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono">{k.provider}</td>
                    <td className="py-2 text-muted-foreground">{new Date(k.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Data Protection Security Incidents */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-sm font-bold">Recent Data-Protection Events & Security Monitoring</h2>
          {(status?.recentIncidents || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No data-protection incidents recorded.</p>
          ) : (
            <div className="space-y-2">
              {status!.recentIncidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-xl border border-border text-xs flex justify-between gap-4">
                  <div>
                    <span className="font-mono font-bold mr-2">{inc.type}</span>
                    <span className="text-muted-foreground">{inc.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {inc.severity} • {new Date(inc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
