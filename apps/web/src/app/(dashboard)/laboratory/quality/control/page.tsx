'use client';

import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  History,
  Layers,
} from 'lucide-react';
import {
  useQCProfiles,
  useQCRuns,
} from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { QCRunTable } from '@/features/laboratory/components/QCRunTable';
import { QCProfileModal } from '@/features/laboratory/components/QCProfileModal';
import { QCRunModal } from '@/features/laboratory/components/QCRunModal';
import { QCFailureInvestigationModal } from '@/features/laboratory/components/QCFailureInvestigationModal';
import type { QCRunDto } from '@healthbridge/shared-types';

export default function QualityControlPage() {
  const [activeTab, setActiveTab] = useState<'runs' | 'profiles'>('runs');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [investigatingRun, setInvestigatingRun] = useState<QCRunDto | null>(null);

  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useQCProfiles();
  const {
    runs,
    loading: runsLoading,
    refetch: refetchRuns,
  } = useQCRuns({
    status: statusFilter || undefined,
    testCode: searchTerm ? searchTerm.toUpperCase() : undefined,
  });

  const handleCreateProfile = async (dto: any) => {
    await laboratoryQualityApi.createProfile(dto);
    await refetchProfiles();
  };

  const handleRecordRun = async (dto: any) => {
    await laboratoryQualityApi.recordRun(dto);
    await refetchRuns();
  };

  const handleInvestigateRun = async (dto: any) => {
    if (!investigatingRun) return;
    await laboratoryQualityApi.investigateRun(investigatingRun.id, dto);
    await refetchRuns();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-200/50">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quality Control (QC) Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage multi-level QC profiles, automated rule evaluations, and failure investigations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchRuns();
              refetchProfiles();
            }}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            New QC Profile
          </button>
          <button
            onClick={() => setIsRunModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record QC Run
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('runs')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'runs'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          QC Runs & Executions ({runs.length})
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'profiles'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Configured QC Profiles ({profiles.length})
        </button>
      </div>

      {activeTab === 'runs' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by test code (e.g. GLUC)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg uppercase font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="INVALIDATED">Invalidated</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing {runs.length} recorded run(s)
            </div>
          </div>

          {/* Runs Table */}
          <QCRunTable
            runs={runs}
            loading={runsLoading}
            onInvestigate={(run) => setInvestigatingRun(run)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {profilesLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-teal-600 mb-2"></div>
              <p className="text-sm text-slate-500">Loading QC profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No QC Profiles Defined</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Configure baseline parameters, target means, standard deviations, and Westgard evaluation rules for your laboratory test menu.
              </p>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                Create First Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200/60">
                          {profile.testCode}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{profile.profileName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Control Material: {profile.controlMaterial} ({profile.controlLevel})
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        profile.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {profile.isActive ? 'Active v' + profile.version : 'Inactive'}
                    </span>
                  </div>

                  {/* Target Stats */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Target Value
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {profile.targetValue ?? 'N/A'} {profile.unit || ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Acceptable Range
                      </span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {profile.acceptableMin ?? '—'} - {profile.acceptableMax ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Run Frequency
                      </span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {profile.runFrequency}
                      </span>
                    </div>
                  </div>

                  {/* Rules & Meta */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>
                      Parameter:{' '}
                      <strong className="text-slate-700">
                        {profile.parameterName}
                      </strong>
                    </span>
                    <span>Format: {profile.dataType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <QCProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleCreateProfile}
      />

      <QCRunModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        profiles={profiles}
        onSubmit={handleRecordRun}
      />

      <QCFailureInvestigationModal
        isOpen={!!investigatingRun}
        onClose={() => setInvestigatingRun(null)}
        run={investigatingRun}
        onSubmit={handleInvestigateRun}
      />
    </div>
  );
}
