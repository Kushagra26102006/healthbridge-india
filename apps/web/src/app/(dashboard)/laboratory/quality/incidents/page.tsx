'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useQualityIncidents } from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { QualityIncidentTable } from '@/features/laboratory/components/QualityIncidentTable';
import { IncidentModal } from '@/features/laboratory/components/IncidentModal';
import { CAPAModal } from '@/features/laboratory/components/CAPAModal';
import type { QualityIncidentDto } from '@healthbridge/shared-types';

export default function QualityIncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [capaIncident, setCapaIncident] = useState<QualityIncidentDto | null>(null);

  const {
    incidents,
    loading,
    refetch,
  } = useQualityIncidents({
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleCreateIncident = async (dto: any) => {
    await laboratoryQualityApi.createIncident(dto);
    await refetch();
  };

  const handleCreateCAPA = async (dto: any) => {
    await laboratoryQualityApi.createCAPA(dto);
    setCapaIncident(null);
    await refetch();
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inc.title.toLowerCase().includes(term) ||
      inc.incidentReference.toLowerCase().includes(term) ||
      (inc.relatedTestCode && inc.relatedTestCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quality Incidents & Non-Conformities
            </h1>
            <p className="text-xs text-slate-500">
              Track defects, QC deviations, equipment malfunctions, and corrective action workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsIncidentModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="MAJOR">Major</option>
              <option value="MINOR">Minor</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredIncidents.length} incident(s)
        </div>
      </div>

      {/* Incidents Table */}
      <QualityIncidentTable
        incidents={filteredIncidents}
        loading={loading}
        onSelectIncident={(_inc: QualityIncidentDto) => {}}
        onInitiateCAPA={(inc: QualityIncidentDto) => setCapaIncident(inc)}
      />

      {/* Modals */}
      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSubmit={handleCreateIncident}
      />

      <CAPAModal
        isOpen={!!capaIncident}
        onClose={() => setCapaIncident(null)}
        mode="create"
        incidentId={capaIncident?.id}
        incidentReference={capaIncident?.incidentReference}
        onCreate={handleCreateCAPA}
      />
    </div>
  );
}
