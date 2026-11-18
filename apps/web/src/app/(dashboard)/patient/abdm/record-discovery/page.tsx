'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Link2,
  AlertTriangle,
  FileText,
  History,
  PlusCircle,
} from 'lucide-react';
import type {
  AbdmDiscoveredCareContextDto,
  AbdmDiscoveryRequestDto,
  AbdmHealthInfoType,
} from '@healthbridge/shared-types';
import { abdmHieApi } from '@/features/abdm/api/abdm-hie-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const HI_TYPE_OPTIONS: AbdmHealthInfoType[] = [
  'OPConsultation',
  'Prescription',
  'DiagnosticReport',
  'DischargeSummary',
  'HealthDocumentRecord',
];

export default function PatientAbdmRecordDiscoveryPage() {
  const [discoveries, setDiscoveries] = useState<AbdmDiscoveryRequestDto[]>([]);
  const [participantId, setParticipantId] = useState('IN2910000182');
  const [participantName, setParticipantName] = useState('ABDM Sandbox General Hospital');
  const [selectedCategories, setSelectedCategories] = useState<AbdmHealthInfoType[]>([
    'OPConsultation',
    'DiagnosticReport',
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await abdmHieApi.listDiscoveryHistory();
      setDiscoveries(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load ABDM discovery history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCategory = (cat: AbdmHealthInfoType) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleInitiateDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      setError('Select at least one health information category.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setNotice(null);
      const created = await abdmHieApi.initiateDiscovery({
        participantId: participantId.trim(),
        participantName: participantName.trim() || undefined,
        requestedCategories: selectedCategories,
      });
      setNotice(
        `Discovery initiated (${created.internalDiscoveryRef}). Status: ${created.status}${
          created.isMocked ? ' [MOCKED DEV MODE]' : ''
        }.`
      );
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initiate ABDM discovery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkContext = async (
    disc: AbdmDiscoveryRequestDto,
    ctx: AbdmDiscoveredCareContextDto
  ) => {
    try {
      setError(null);
      setNotice(null);
      const link = await abdmHieApi.initiateLinking({
        discoveryId: disc.id,
        participantId: disc.participantId,
        participantName: disc.participantName,
        careContextReference: ctx.careContextReference,
        careContextDisplay: ctx.display,
        hiTypes: ctx.hiTypes,
        linkMode: 'USER_INITIATED',
      });
      setNotice(
        `Linking initiated (${link.internalLinkRef}) — confirm OTP on the Linked Sources page.`
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initiate care-context linking.');
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6 text-teal-600" />
            ABDM Health Record Discovery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover eligible unlinked care contexts at external ABDM-registered Health Information Providers (HIPs).
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
          <Button size="sm" variant="outline">
            <Link2 className="h-4 w-4 mr-1.5" /> Linked Sources
          </Button>
        </Link>
        <Link href="/patient/abdm/record-discovery">
          <Button size="sm" variant="default">
            <Search className="h-4 w-4 mr-1.5" /> Record Discovery
          </Button>
        </Link>
        <Link href="/patient/abdm/transfer-history">
          <Button size="sm" variant="outline">
            <History className="h-4 w-4 mr-1.5" /> Transfer History
          </Button>
        </Link>
      </div>

      <form
        onSubmit={handleInitiateDiscovery}
        className="rounded-lg border bg-card p-5 space-y-4 shadow-sm"
      >
        <h2 className="font-semibold text-base">Initiate Care-Context Discovery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">External HIP Facility / Participant ID</label>
            <input
              type="text"
              required
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Facility Display Name (Optional)</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2">Requested Health Record Categories</label>
          <div className="flex flex-wrap gap-2">
            {HI_TYPE_OPTIONS.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs border transition ${
                    active
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-background text-foreground border-input hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" size="sm" disabled={submitting}>
          <PlusCircle className="h-4 w-4 mr-1.5" />
          {submitting ? 'Initiating Discovery...' : 'Start Discovery Request'}
        </Button>
      </form>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-base">Discovery History</h2>
        {loading ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Loading discovery requests...
          </div>
        ) : discoveries.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            No ABDM care-context discovery sessions yet.
          </div>
        ) : (
          discoveries.map((disc) => (
            <div key={disc.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {disc.participantName || disc.participantId}
                    </span>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {disc.internalDiscoveryRef}
                    </Badge>
                    {disc.isMocked && (
                      <Badge className="bg-purple-100 text-purple-800 border-none text-[11px]">
                        MOCKED
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Categories: {disc.requestedCategories.join(', ')} &bull; {new Date(disc.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">{disc.status}</Badge>
              </div>

              {disc.discoveredCareContexts.length > 0 && (
                <div className="space-y-2 border-t pt-2">
                  <p className="text-xs font-medium">Discovered Care Contexts:</p>
                  {disc.discoveredCareContexts.map((ctx) => (
                    <div
                      key={ctx.careContextReference}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-medium">{ctx.display}</span>{' '}
                        <span className="font-mono text-muted-foreground">
                          ({ctx.careContextReference})
                        </span>
                      </div>
                      {ctx.alreadyLinked ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none">
                          Already Linked
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLinkContext(disc, ctx)}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-1" /> Link Care Context
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
