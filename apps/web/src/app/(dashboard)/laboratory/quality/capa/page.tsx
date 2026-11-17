'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useCAPAs } from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { CAPATable } from '@/features/laboratory/components/CAPATable';
import { CAPAModal } from '@/features/laboratory/components/CAPAModal';
import type { CAPADto } from '@healthbridge/shared-types';

export default function CAPAPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [reviewingCAPA, setReviewingCAPA] = useState<CAPADto | null>(null);

  const { capas, loading, refetch } = useCAPAs({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const handleReviewEffectiveness = async (capaId: string, dto: any) => {
    await laboratoryQualityApi.reviewCAPA(capaId, dto);
    await refetch();
  };

  const filteredCapas = capas.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.capaReference.toLowerCase().includes(term) ||
      c.problemStatement.toLowerCase().includes(term) ||
      c.incidentReference.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-200/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Corrective & Preventive Actions (CAPA)
            </h1>
            <p className="text-xs text-slate-500">
              Systemic quality remediation, root-cause resolution, action item tracking & effectiveness audits
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
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference or problem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="EFFECTIVE">Effective</option>
              <option value="INEFFECTIVE">Ineffective</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredCapas.length} CAPA plan(s)
        </div>
      </div>

      {/* CAPA Table */}
      <CAPATable
        capas={filteredCapas}
        loading={loading}
        onReviewEffectiveness={(capa: CAPADto) => setReviewingCAPA(capa)}
      />

      {/* Review Effectiveness Modal */}
      <CAPAModal
        isOpen={!!reviewingCAPA}
        onClose={() => setReviewingCAPA(null)}
        mode="review"
        existingCAPA={reviewingCAPA}
        onReview={handleReviewEffectiveness}
      />
    </div>
  );
}
