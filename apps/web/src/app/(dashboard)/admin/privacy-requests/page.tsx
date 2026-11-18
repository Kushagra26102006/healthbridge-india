'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { privacyApi, type PrivacyRequestDto } from '@/features/privacy/api/privacy-api';

export default function AdminPrivacyRequestsPage() {
  const [requests, setRequests] = useState<PrivacyRequestDto[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const res = await privacyApi.listAdminRequests({
        page: 1,
        limit: 30,
        requestType: filterType || undefined,
        status: filterStatus || undefined,
      });
      setRequests(res.items || []);
    } catch {
      setError('Unable to fetch privacy request governance queue.');
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleDecision = async (
    id: string,
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  ) => {
    setError(null);
    setFeedback(null);
    try {
      await privacyApi.reviewAdminRequest(id, {
        status,
        decisionSummary: decisionNote.trim() || `Marked ${status} by privacy operations admin.`,
        actualDisposalOutcome:
          status === 'COMPLETED' ? 'PARTIAL_RESTRICTED_RETENTION' : undefined,
      });
      setDecisionNote('');
      setFeedback(`Request updated to ${status}.`);
      await loadQueue();
    } catch {
      setError('Unable to update request (active legal hold or invalid state).');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <span>Privacy Requests Governance Console</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage patient export, correction, account closure, and deletion requests using request metadata without unrestricted clinical record access.
          </p>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card"
          >
            <option value="">All Categories</option>
            <option value="EXPORT">Data Export</option>
            <option value="CORRECTION">Data Correction</option>
            <option value="DELETION">Data Deletion</option>
            <option value="ACCOUNT_CLOSURE">Account Closure</option>
            <option value="COMPLAINT">Privacy Complaint</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Optional review decision note..."
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            className="flex-1 min-w-[220px] px-3 py-2 text-xs rounded-xl border border-border bg-card"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {requests.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No privacy requests match the current filter.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{req.referenceNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">
                        {req.requestType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold text-[10px]">
                        {req.status}
                      </span>
                      {req.deletionDetails?.legalHoldBlocked && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                          LEGAL HOLD ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      Patient Ref: <span className="font-mono">{req.patientId}</span> • Submitted{' '}
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.decisionSummary && (
                      <p className="text-foreground/80">Decision: {req.decisionSummary}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecision(req.id, 'UNDER_REVIEW')}
                      className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted font-medium"
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(req.id, 'APPROVED')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(req.id, 'COMPLETED')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(req.id, 'REJECTED')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
