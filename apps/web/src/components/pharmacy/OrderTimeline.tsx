'use client';

import React from 'react';
import type { OrderStatusEventDto } from '@healthbridge/shared-types';
import {
  CheckCircle2,
  Clock,
  Package,
  Boxes,
  MapPin,
  XCircle,
  Ban,
  Eye,
  User,
  ShieldCheck,
} from 'lucide-react';

interface OrderTimelineProps {
  timeline: OrderStatusEventDto[];
  isLoading?: boolean;
}

export function OrderTimeline({ timeline, isLoading = false }: OrderTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p>No timeline events recorded yet.</p>
      </div>
    );
  }

  const getEventIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'UNDER_REVIEW':
        return <Eye className="w-3.5 h-3.5 text-purple-600" />;
      case 'ACCEPTED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'PROCESSING':
        return <Package className="w-3.5 h-3.5 text-sky-600" />;
      case 'PARTIALLY_FULFILLED':
        return <Boxes className="w-3.5 h-3.5 text-indigo-600" />;
      case 'READY_FOR_PICKUP':
        return <MapPin className="w-3.5 h-3.5 text-teal-600" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'CANCELLED':
        return <Ban className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getEventBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNDER_REVIEW':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'PARTIALLY_FULFILLED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'READY_FOR_PICKUP':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CANCELLED':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Sort chronological
  const sortedEvents = [...timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-teal-600" />
        <span>Persisted Order Audit Timeline</span>
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {sortedEvents.map((evt, idx) => {
          const isLatest = idx === sortedEvents.length - 1;

          return (
            <div key={evt.id || idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-[19px] top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                  isLatest
                    ? 'border-teal-600 ring-2 ring-teal-100'
                    : 'border-slate-300'
                }`}
              >
                {getEventIcon(evt.newStatus)}
              </div>

              {/* Event Content */}
              <div className="text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getEventBadge(
                      evt.newStatus
                    )}`}
                  >
                    {evt.newStatus.replace(/_/g, ' ')}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {new Date(evt.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {evt.reason && (
                  <p className="mt-1 text-slate-700 font-medium">
                    {evt.reason}
                  </p>
                )}

                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>
                    Action by: <strong className="text-slate-600 font-medium">{evt.actorName}</strong> (
                    {evt.actorRole})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

