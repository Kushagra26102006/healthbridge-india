'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConsentEmptyState } from './ConsentEmptyState';
import type { ConsentHistoryEventDto } from '@healthbridge/shared-types';

export interface ConsentHistoryTimelineProps {
  events: ConsentHistoryEventDto[];
  isLoading?: boolean;
}

export const getEventBadge = (eventType: ConsentHistoryEventDto['eventType']) => {
  switch (eventType) {
    case 'CONSENT_APPROVED':
      return {
        label: 'Approved',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'CONSENT_REQUESTED':
      return {
        label: 'Requested',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Clock,
      };
    case 'CONSENT_REJECTED':
      return {
        label: 'Declined',
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: XCircle,
      };
    case 'CONSENT_REVOKED':
      return {
        label: 'Revoked',
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        icon: AlertCircle,
      };
    case 'DATA_ACCESSED':
      return {
        label: 'Data Accessed',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: FileText,
      };
    case 'CONSENT_EXPIRED':
    default:
      return {
        label: 'Expired',
        bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
        icon: AlertCircle,
      };
  }
};

export const ConsentHistoryTimeline: React.FC<ConsentHistoryTimelineProps> = ({
  events,
}) => {
  if (events.length === 0) {
    return (
      <ConsentEmptyState
        title="No consent history events"
        description="There are currently no recorded access requests, approvals, or revocations on file."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {events.map((event) => {
          const badge = getEventBadge(event.eventType);
          const Icon = badge.icon;

          const formattedTime = new Date(event.timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={event.id} className="relative group">
              {/* Dot on timeline */}
              <div className="absolute -left-[27px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:border-teal-500 transition-colors">
                <div className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
              </div>

              {/* Event Card */}
              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${badge.bg} border text-[11px] font-medium flex items-center gap-1`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{badge.label}</span>
                    </Badge>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {event.title}
                    </h4>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {formattedTime}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {event.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.organization}</span>
                    {event.doctorName && <span>• {event.doctorName}</span>}
                  </div>

                  {event.consentId && (
                    <Link
                      href={`/patient/consent/${event.consentId}`}
                      className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>View Permission</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
