'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  usePharmacySessions,
  useRevokePharmacySession,
  useRevokeOtherPharmacySessions,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { RolePrivacyBanner } from '@/components/security/RolePrivacyBanner';

export default function PharmacySessionsSettingsPage() {
  const { toast } = useToast();
  const { data: sessions, isLoading, refetch } = usePharmacySessions();
  const revokeSingleMutation = useRevokePharmacySession();
  const revokeOthersMutation = useRevokeOtherPharmacySessions();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [singleTarget, setSingleTarget] = useState<{ id: string; deviceName?: string } | null>(null);
  const [revokeOthersOpen, setRevokeOthersOpen] = useState(false);

  const handleRevokeSingle = (sessionId: string, deviceName?: string) => {
    setSingleTarget({ id: sessionId, deviceName });
  };

  const confirmRevokeSingle = async () => {
    if (!singleTarget) return;
    setFeedback(null);
    try {
      await revokeSingleMutation.mutateAsync(singleTarget.id);
      setFeedback({ type: 'success', message: 'Session terminated successfully' });
      toast({ variant: 'success', title: 'Session revoked', description: 'The selected terminal session has been signed out.' });
      setSingleTarget(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke session';
      setFeedback({ type: 'error', message: msg });
      toast({ variant: 'error', title: 'Revocation failed', description: msg });
    }
  };

  const handleRevokeOthers = () => {
    setRevokeOthersOpen(true);
  };

  const confirmRevokeOthers = async () => {
    setFeedback(null);
    try {
      const res = await revokeOthersMutation.mutateAsync();
      const message = `Successfully logged out from ${res.revokedCount} other session(s).`;
      setFeedback({ type: 'success', message });
      toast({ variant: 'success', title: 'Other sessions revoked', description: message });
      setRevokeOthersOpen(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to terminate other sessions';
      setFeedback({ type: 'error', message: msg });
      toast({ variant: 'error', title: 'Operation failed', description: msg });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full" />
        <div className="h-96 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <Laptop className="w-3.5 h-3.5" />
            <span>Active Device Sessions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Browser Sessions & Connected Devices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor and revoke active refresh tokens and connected dispensary terminals across facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRevokeOthers}
            disabled={revokeOthersMutation.isPending || (sessions && sessions.length <= 1)}
            className="text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            {revokeOthersMutation.isPending ? 'Logging out...' : 'Log Out All Other Devices'}
          </Button>
        </div>
      </div>

      <PharmacySettingsNav />

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Active Refresh Sessions ({sessions?.length || 0})
          </h2>
          <span className="text-[11px] text-slate-500">
            Central IAM Invariant: Raw refresh tokens are never exposed
          </span>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active sessions found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((sess) => {
              const isMobile =
                sess.os?.toLowerCase().includes('android') ||
                sess.os?.toLowerCase().includes('ios');
              return (
                <div
                  key={sess.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        sess.isCurrent
                          ? 'bg-teal-50 text-teal-600 border border-teal-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isMobile ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {sess.deviceName || `${sess.browser} on ${sess.os}`}
                        </span>
                        {sess.isCurrent && (
                          <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-[10px] px-2 py-0">
                            Current Device
                          </Badge>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>IP: {sess.ipAddress || '127.0.0.1'}</span>
                        <span>•</span>
                        <span>
                          Signed in: {new Date(sess.createdAt).toLocaleDateString('en-IN')}{' '}
                          {new Date(sess.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          Last active: {new Date(sess.lastActiveAt).toLocaleDateString('en-IN')}{' '}
                          {new Date(sess.lastActiveAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {!sess.isCurrent ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSingle(sess.id, sess.deviceName)}
                        disabled={revokeSingleMutation.isPending}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Revoke Session
                      </Button>
                    ) : (
                      <span className="text-[11px] text-teal-700 font-medium px-2 py-1 bg-teal-50 rounded-md">
                        Active in this window
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RolePrivacyBanner role="PHARMACY" />

      <ConfirmDialog
        open={Boolean(singleTarget)}
        onClose={() => setSingleTarget(null)}
        onConfirm={confirmRevokeSingle}
        loading={revokeSingleMutation.isPending}
        title="Terminate Device Session?"
        description={`Sign out the active pharmacy session on "${singleTarget?.deviceName || 'this device'}".`}
        confirmLabel="Revoke Session"
        variant="danger"
      />

      <ConfirmDialog
        open={revokeOthersOpen}
        onClose={() => setRevokeOthersOpen(false)}
        onConfirm={confirmRevokeOthers}
        loading={revokeOthersMutation.isPending}
        title="Sign Out All Other Devices?"
        description="Every other active pharmacy browser session will be terminated immediately. Your current window will remain signed in."
        confirmLabel="Sign Out Other Devices"
        variant="danger"
      />
    </div>
  );
}
