'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShieldAlert, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  securityMonitoringApi,
  type SecurityIncidentDto,
} from '@/features/security-monitoring/api/security-monitoring-api';

export default function AdminSecurityIncidentDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [incident, setIncident] = useState<SecurityIncidentDto | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await securityMonitoringApi.getIncident(id);
      setIncident(data);
    } catch {
      setError('Unable to load incident detail.');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleTransition = async (status: string) => {
    setError(null);
    try {
      await securityMonitoringApi.updateIncident(id, {
        status,
        containmentAction: status === 'CONTAINMENT' ? note || 'Initiated containment' : undefined,
        note: note || `Transitioned to ${status}`,
      });
      setNote('');
      await load();
    } catch {
      setError('Transition blocked (CONTAINMENT/ERADICATION/RECOVERY require SECURITY_INCIDENTS_RESPOND permission).');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link href="/admin/security/incidents" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {incident && (
          <>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldAlert className="w-5 h-5 text-teal-600" />
                <span className="font-mono font-bold">{incident.incidentId}</span>
                <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">{incident.severity}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">
                  {incident.status}
                </span>
              </div>
              <h1 className="text-xl font-bold">{incident.title}</h1>
              <p className="text-sm text-muted-foreground">{incident.description}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs">
              <h2 className="text-sm font-bold">Workflow & Response Actions</h2>
              <input
                type="text"
                placeholder="Timeline / containment / resolution note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background"
              />
              <div className="flex flex-wrap gap-2">
                {['TRIAGED', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'RESOLVED', 'CLOSED'].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleTransition(st)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted font-medium"
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs">
              <h2 className="text-sm font-bold">Immutable Investigation Timeline</h2>
              <div className="space-y-2">
                {incident.timeline.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted/40 flex justify-between gap-4">
                    <div>
                      <span className="font-mono font-semibold">
                        {entry.fromStatus} → {entry.toStatus}
                      </span>
                      <p className="text-muted-foreground mt-0.5">{entry.note}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
