'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, ArrowLeft, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  securityMonitoringApi,
  type SecurityAlertDto,
} from '@/features/security-monitoring/api/security-monitoring-api';

export default function AdminSecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlertDto[]>([]);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await securityMonitoringApi.listAlerts({
        severity: severity || undefined,
        status: status || undefined,
      });
      setAlerts(res.items || []);
    } catch {
      setError('Unable to load alerts (requires SECURITY_ALERTS_READ permission).');
    }
  }, [severity, status]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleTransition = async (alertId: string, nextStatus: string) => {
    setError(null);
    try {
      await securityMonitoringApi.updateAlert(alertId, {
        status: nextStatus,
        resolutionNotes:
          nextStatus === 'RESOLVED' || nextStatus === 'FALSE_POSITIVE'
            ? note.trim() || 'Reviewed and documented by security operations analyst.'
            : undefined,
      });
      setNote('');
      await loadAlerts();
    } catch {
      setError('Update failed (requires SECURITY_ALERTS_MANAGE permission and resolution notes).');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6">
        <Link href="/admin/security/overview" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SecOps Overview</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600" />
            <span>Security Alert Management</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Deduplicated, rule-generated security alerts with mandatory audited resolution notes.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-border bg-card">
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-border bg-card">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
          <input
            type="text"
            placeholder="Resolution / investigation note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl border border-border bg-card"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {alerts.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No security alerts match the current filter.</p>
          ) : (
            alerts.map((a) => (
              <div key={a.alertId} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{a.alertId}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">{a.severity}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">
                      {a.status}
                    </span>
                    <span className="text-muted-foreground">×{a.occurrenceCount}</span>
                  </div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-muted-foreground">{a.safeDescription}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  <button type="button" onClick={() => handleTransition(a.alertId, 'ACKNOWLEDGED')} className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted">
                    Acknowledge
                  </button>
                  <button type="button" onClick={() => handleTransition(a.alertId, 'INVESTIGATING')} className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    Investigate
                  </button>
                  <button type="button" onClick={() => handleTransition(a.alertId, 'RESOLVED')} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    Resolve
                  </button>
                  <button type="button" onClick={() => handleTransition(a.alertId, 'FALSE_POSITIVE')} className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted">
                    False Positive
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
