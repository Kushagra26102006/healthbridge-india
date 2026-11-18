'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  securityMonitoringApi,
  type SecurityIncidentDto,
} from '@/features/security-monitoring/api/security-monitoring-api';

export default function AdminSecurityIncidentsPage() {
  const [incidents, setIncidents] = useState<SecurityIncidentDto[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: 'AUTHORIZATION',
    severity: 'HIGH',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    try {
      const res = await securityMonitoringApi.listIncidents();
      setIncidents(res.items || []);
    } catch {
      setError('Unable to load incidents (requires SECURITY_INCIDENTS_READ permission).');
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await securityMonitoringApi.createIncident(form);
      setForm({ title: '', category: 'AUTHORIZATION', severity: 'HIGH', description: '' });
      await loadIncidents();
    } catch {
      setError('Failed to create incident (requires SECURITY_INCIDENTS_MANAGE permission).');
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
            <Activity className="w-6 h-6 text-teal-600" />
            <span>Security Incident Management</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Formal lifecycle tracking with immutable timelines and separated containment response permissions.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-5 space-y-3 text-xs">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>Open Security Incident</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Incident title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-border bg-background"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-border bg-background"
            >
              <option value="AUTHENTICATION">Authentication</option>
              <option value="AUTHORIZATION">Authorization</option>
              <option value="API_SECURITY">API Security</option>
              <option value="DATA_PROTECTION">Data Protection</option>
              <option value="INTEGRATION">Integration</option>
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-border bg-background"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <textarea
            required
            rows={2}
            placeholder="Safe operational incident summary (no plaintext PHI or credentials)..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700">
            Create Incident
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {incidents.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No security incidents recorded.</p>
          ) : (
            incidents.map((inc) => (
              <Link
                key={inc.incidentId}
                href={`/admin/security/incidents/${inc.incidentId}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{inc.incidentId}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">{inc.severity}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">
                      {inc.status}
                    </span>
                  </div>
                  <p className="font-semibold">{inc.title}</p>
                </div>
                <span className="text-muted-foreground">{new Date(inc.createdAt).toLocaleString()}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
