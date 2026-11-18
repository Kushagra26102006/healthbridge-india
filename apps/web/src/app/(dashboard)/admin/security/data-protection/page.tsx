'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  KeyRound,
  HardDrive,
  DatabaseBackup,
  RefreshCw,
} from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

interface KeyMetadataRow {
  keyId: string;
  version: number;
  status: string;
  createdAt: string;
  provider: string;
}

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
    keys: KeyMetadataRow[];
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
  const { toast } = useToast();
  const [status, setStatus] = useState<DataProtectionStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    setError(null);
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
    try {
      const res = await apiClient.post(API_ENDPOINTS.DATA_PROTECTION.ADMIN_ROTATE_KEY);
      const nextKeyId = res.data?.data?.rotatedTo?.keyId;
      toast({
        variant: 'success',
        title: 'Encryption key rotated',
        description: `Active key version rotated to ${nextKeyId}. Historical key versions remain available for decryption.`,
      });
      setRotateConfirmOpen(false);
      await loadStatus();
    } catch {
      setError('Failed to rotate active encryption key.');
      toast({
        variant: 'error',
        title: 'Key rotation failed',
        description: 'Verify administrator authorization and KMS provider health.',
      });
    } finally {
      setBusy(false);
    }
  };

  const keyColumns: DataTableColumn<KeyMetadataRow>[] = [
    {
      key: 'keyId',
      header: 'Key ID',
      cell: (row) => <span className="font-mono font-semibold text-foreground">{row.keyId}</span>,
    },
    {
      key: 'version',
      header: 'Version',
      cell: (row) => <span className="font-mono">v{row.version}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      cell: (row) => <span className="font-mono text-muted-foreground">{row.provider}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      cell: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-secondary" aria-hidden="true" />
              <span>Data Protection, Encryption &amp; Recovery</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Operational health metadata only — never exposes raw keys, credentials, clinical records, or backup contents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadStatus()}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => setRotateConfirmOpen(true)}
            >
              <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Rotate Active Key Version</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Data Protection Error">
            {error}
          </Alert>
        )}

        {/* Top Operational Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-secondary" aria-hidden="true" />
                <span>Key Management &amp; Encryption</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                Provider:{' '}
                <span className="font-mono text-foreground">
                  {status?.keyManagement.providerKind || '—'}
                </span>
              </p>
              <p className="text-muted-foreground">
                Active Key ID:{' '}
                <span className="font-mono text-foreground">
                  {status?.keyManagement.activeKeyId || '—'}
                </span>
              </p>
              <p className="text-muted-foreground">
                Production-Safe KMS:{' '}
                <strong
                  className={
                    status?.keyManagement.isProductionSafe ? 'text-emerald-600' : 'text-amber-600'
                  }
                >
                  {status?.keyManagement.isProductionSafe
                    ? 'Yes'
                    : 'No (Development Local Provider)'}
                </strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Private Document Storage &amp; AV</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                Store:{' '}
                <span className="font-mono text-foreground">
                  {status?.documentStorage.storageProvider || '—'}
                </span>
              </p>
              <p className="text-muted-foreground">
                Public Access:{' '}
                <strong
                  className={
                    status?.documentStorage.publicAccessEnabled
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }
                >
                  {status?.documentStorage.publicAccessEnabled ? 'ENABLED (RISK)' : 'DISABLED'}
                </strong>
              </p>
              <p className="text-muted-foreground">
                Malware Scanner:{' '}
                <strong
                  className={
                    status?.documentStorage.malwareScanningOperational
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }
                >
                  {status?.documentStorage.malwareScanningOperational
                    ? 'Operational'
                    : 'Not Configured (Quarantine Safe)'}
                </strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DatabaseBackup className="w-4 h-4 text-purple-600" aria-hidden="true" />
                <span>Backup &amp; Disaster Recovery</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
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
            </CardContent>
          </Card>
        </div>

        {/* Key Versions Metadata Table (Responsive DataTable) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Encryption Key Version Registry</CardTitle>
            <CardDescription>
              Metadata only — cryptographic key material is never transmitted or rendered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={keyColumns}
              data={status?.keyManagement.keys ?? []}
              getRowId={(row) => row.keyId}
              emptyState={
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No encryption key metadata records were returned by the key management provider.
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Recent Data Protection Security Incidents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Data-Protection Events</CardTitle>
          </CardHeader>
          <CardContent>
            {(status?.recentIncidents || []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                No data-protection incidents recorded.
              </p>
            ) : (
              <div className="space-y-2">
                {status!.recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-lg border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold mr-2">{inc.type}</span>
                      <span className="text-muted-foreground">{inc.message}</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {inc.severity} · {new Date(inc.timestamp).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mandatory Confirmation Dialog for Sensitive Key Rotation */}
        <Dialog
          open={rotateConfirmOpen}
          onClose={() => !busy && setRotateConfirmOpen(false)}
          title="Confirm Active Encryption Key Rotation"
          description="Rotating the active encryption key version immediately updates the key version used for newly encrypted healthcare payloads while retaining historical versions for decryption."
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            This sensitive administrative operation is recorded on the server audit trail under your administrator account. Proceed only if scheduled or authorized by security operations.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotateConfirmOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleRotateKey()} disabled={busy}>
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{busy ? 'Rotating...' : 'Confirm Key Rotation'}</span>
            </Button>
          </div>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
