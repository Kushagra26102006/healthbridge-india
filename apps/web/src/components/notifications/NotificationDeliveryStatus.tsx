'use client';

import React from 'react';
import {
  RotateCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Smartphone,
  Bell,
  Send,
} from 'lucide-react';
import { useNotificationDeliveryHistory } from '@/features/notifications/hooks/use-notifications';
import type { DeliveryStatus, NotificationChannel } from '@healthbridge/shared-types';

export function NotificationDeliveryStatus() {
  const { data: records, isLoading, refetch, isFetching } = useNotificationDeliveryHistory(50);
  const items = records || [];

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'SENT':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
            <Send className="w-3 h-3 text-sky-600" />
            <span>{status}</span>
          </span>
        );
      case 'RETRYING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{status}</span>
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-indigo-600" />;
      case 'IN_APP':
      default:
        return <Bell className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-900">Delivery Audit & Transmission Log</h3>
          <p className="text-[11px] text-slate-500">
            Tracks transactional in-app dispatch, SMTP/SES email handoffs, and SMS gateway attempts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Channel</th>
              <th className="py-2.5 px-4">Provider</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-center">Attempts</th>
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-4">Notes / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading delivery history...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No delivery logs recorded yet.
                </td>
              </tr>
            ) : (
              items.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      {getChannelIcon(rec.channel)}
                      <span>{rec.channel}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {rec.provider}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(rec.status)}</td>
                  <td className="py-3 px-4 text-center text-slate-700">
                    {rec.attemptCount} / {rec.maxAttempts}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {rec.deliveredAt
                      ? new Date(rec.deliveredAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : rec.lastAttemptAt
                      ? new Date(rec.lastAttemptAt).toLocaleTimeString('en-IN')
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                    {rec.failureReason ? (
                      <span className="text-rose-600 font-medium">{rec.failureReason}</span>
                    ) : (
                      <span className="text-slate-400">Confirmed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
