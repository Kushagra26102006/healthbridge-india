'use client';

import React from 'react';
import { useSampleTimeline } from '@/features/laboratory/hooks/use-laboratory';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FlaskConical,
  PackageCheck,
  Barcode,
  Truck,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SampleTimelineEventDto } from '@healthbridge/shared-types';

export interface SampleTimelineViewProps {
  sampleId: string;
  className?: string;
}

export function SampleTimelineView({ sampleId, className }: SampleTimelineViewProps) {
  const { data: events, isLoading, error } = useSampleTimeline(sampleId);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'REGISTERED':
        return { icon: Clock, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30' };
      case 'BARCODE_GENERATED':
        return { icon: Barcode, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' };
      case 'COLLECTED':
        return { icon: FlaskConical, color: 'text-teal-500 bg-teal-500/10 border-teal-500/30' };
      case 'DISPATCHED':
        return { icon: Truck, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' };
      case 'RECEIVED':
        return { icon: PackageCheck, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
      case 'ACCESSIONED':
        return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
      case 'RECOLLECTION_REQUESTED':
        return { icon: RotateCcw, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
      case 'PROCESSING_STARTED':
        return { icon: Activity, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' };
      default:
        return { icon: Clock, color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' };
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Loading sample timeline...
      </div>
    );
  }

  if (error || !events || events.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
        No lifecycle events recorded for this sample yet.
      </div>
    );
  }

  return (
    <div className={cn('flow-root', className)}>
      <ul className="-mb-8">
        {events.map((event: SampleTimelineEventDto, idx: number) => {
          const isLast = idx === events.length - 1;
          const { icon: Icon, color } = getEventIcon(event.eventType);

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10',
                      color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                        {event.newStatus && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Status: {event.newStatus}
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.notes}
                        </p>
                      )}
                      {event.reason && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                          Reason: {event.reason}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        By <span className="font-medium text-foreground">{event.actorName || 'System'}</span>
                      </p>
                    </div>
                    <div className="text-right text-[10px] whitespace-nowrap text-muted-foreground font-mono">
                      {new Date(event.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SampleTimelineView;
