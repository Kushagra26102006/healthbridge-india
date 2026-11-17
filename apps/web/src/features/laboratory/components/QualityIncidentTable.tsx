'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Eye, ShieldAlert } from 'lucide-react';
import type { QualityIncidentDto } from '@healthbridge/shared-types';

interface QualityIncidentTableProps {
  incidents: QualityIncidentDto[];
  loading?: boolean;
  onSelectIncident?: (incident: QualityIncidentDto) => void;
  onInitiateCAPA?: (incident: QualityIncidentDto) => void;
  onView?: (incident: QualityIncidentDto) => void;
  onResolve?: (incident: QualityIncidentDto) => void;
}

export function QualityIncidentTable({
  incidents,
  loading,
  onSelectIncident,
  onInitiateCAPA,
  onView,
  onResolve,
}: QualityIncidentTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-amber-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading quality incidents...</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No Quality Incidents found matching current filters.
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            CRITICAL
          </span>
        );
      case 'MAJOR':
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
            MAJOR
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            MINOR
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            OPEN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Incident Reference</th>
            <th className="py-3 px-4">Title & Description</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Severity</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Reported By</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-normal">
          {incidents.map((inc) => {
            const dateStr = new Date(inc.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 font-mono">{inc.incidentReference}</div>
                  <div className="text-xs text-slate-500">{dateStr}</div>
                </td>
                <td className="py-3 px-4 max-w-xs">
                  <div className="font-semibold text-slate-900 truncate">{inc.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{inc.description}</div>
                </td>
                <td className="py-3 px-4 text-xs font-semibold text-slate-700">{inc.category}</td>
                <td className="py-3 px-4">{getSeverityBadge(inc.severity)}</td>
                <td className="py-3 px-4">{getStatusBadge(inc.status)}</td>
                <td className="py-3 px-4 text-xs text-slate-600">{inc.reportedByName}</td>
                <td className="py-3 px-4 text-right space-x-1.5">
                  {onInitiateCAPA && !inc.capaId && (
                    <button
                      onClick={() => onInitiateCAPA(inc)}
                      className="text-xs font-semibold px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors inline-flex items-center gap-1"
                      title="Initiate CAPA"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      CAPA
                    </button>
                  )}
                  {onView && (
                    <button
                      onClick={() => onView(inc)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Incident"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onSelectIncident && (
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Select Incident"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {inc.status === 'OPEN' && onResolve && (
                    <button
                      onClick={() => onResolve(inc)}
                      className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
