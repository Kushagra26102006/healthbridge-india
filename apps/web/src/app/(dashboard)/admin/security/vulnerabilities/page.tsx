'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bug, ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  securityMonitoringApi,
  type VulnerabilityDto,
} from '@/features/security-monitoring/api/security-monitoring-api';

export default function AdminSecurityVulnerabilitiesPage() {
  const [vulns, setVulns] = useState<VulnerabilityDto[]>([]);
  const [form, setForm] = useState({
    component: '',
    advisoryReference: '',
    severity: 'HIGH',
    affectedVersion: '',
    fixedVersion: '',
    remediation: '',
    owner: 'Security Engineering',
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await securityMonitoringApi.listVulnerabilities();
      setVulns(res.items || []);
    } catch {
      setError('Unable to load vulnerabilities (requires SECURITY_VULNERABILITIES_READ permission).');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await securityMonitoringApi.createVulnerability(form);
      setForm({
        component: '',
        advisoryReference: '',
        severity: 'HIGH',
        affectedVersion: '',
        fixedVersion: '',
        remediation: '',
        owner: 'Security Engineering',
      });
      await load();
    } catch {
      setError('Failed to record vulnerability (requires SECURITY_VULNERABILITIES_MANAGE permission).');
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
            <Bug className="w-6 h-6 text-teal-600" />
            <span>Vulnerability Management Tracker</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Track real verified dependency, runtime, and configuration advisories with mandatory justification for accepted risks.
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
            <span>Log Verified Advisory</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input required placeholder="Component / Package" value={form.component} onChange={(e) => setForm((f) => ({ ...f, component: e.target.value }))} className="px-3 py-2 rounded-xl border border-border bg-background" />
            <input required placeholder="Advisory Reference (e.g. GHSA-...)" value={form.advisoryReference} onChange={(e) => setForm((f) => ({ ...f, advisoryReference: e.target.value }))} className="px-3 py-2 rounded-xl border border-border bg-background" />
            <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="px-3 py-2 rounded-xl border border-border bg-background">
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <input required placeholder="Affected version" value={form.affectedVersion} onChange={(e) => setForm((f) => ({ ...f, affectedVersion: e.target.value }))} className="px-3 py-2 rounded-xl border border-border bg-background" />
            <input placeholder="Fixed version (if known)" value={form.fixedVersion} onChange={(e) => setForm((f) => ({ ...f, fixedVersion: e.target.value }))} className="px-3 py-2 rounded-xl border border-border bg-background" />
            <input required placeholder="Owner" value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} className="px-3 py-2 rounded-xl border border-border bg-background" />
          </div>
          <textarea required rows={2} placeholder="Remediation plan..." value={form.remediation} onChange={(e) => setForm((f) => ({ ...f, remediation: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700">
            Record Vulnerability
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {vulns.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No tracked vulnerabilities recorded.</p>
          ) : (
            vulns.map((v) => (
              <div key={v.vulnerabilityId} className="p-4 flex flex-col md:flex-row justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{v.vulnerabilityId}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">{v.severity}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">{v.status}</span>
                  </div>
                  <p className="font-semibold">
                    {v.component} ({v.affectedVersion}) — {v.advisoryReference}
                  </p>
                  <p className="text-muted-foreground">{v.remediation}</p>
                </div>
                <span className="text-muted-foreground shrink-0">Owner: {v.owner}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
