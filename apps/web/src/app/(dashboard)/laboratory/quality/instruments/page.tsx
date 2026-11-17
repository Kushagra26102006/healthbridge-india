'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useInstruments } from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { InstrumentRegistryTable } from '@/features/laboratory/components/InstrumentRegistryTable';
import { InstrumentModal } from '@/features/laboratory/components/InstrumentModal';
import { CalibrationModal } from '@/features/laboratory/components/CalibrationModal';
import { MaintenanceModal } from '@/features/laboratory/components/MaintenanceModal';
import type { LabInstrumentDto } from '@healthbridge/shared-types';

export default function InstrumentRegistryPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCalibrationInstrument, setSelectedCalibrationInstrument] = useState<LabInstrumentDto | null>(null);
  const [selectedMaintenanceInstrument, setSelectedMaintenanceInstrument] = useState<LabInstrumentDto | null>(null);

  const { instruments, loading, refetch } = useInstruments({
    operatingStatus: statusFilter || undefined,
    category: categoryFilter || undefined,
  });

  const handleRegisterInstrument = async (dto: any) => {
    await laboratoryQualityApi.registerInstrument(dto);
    await refetch();
  };

  const handleRecordCalibration = async (instrumentId: string, dto: any) => {
    await laboratoryQualityApi.recordCalibration(instrumentId, dto);
    await refetch();
  };

  const handleScheduleMaintenance = async (instrumentId: string, dto: any) => {
    await laboratoryQualityApi.scheduleMaintenance(instrumentId, dto);
    await refetch();
  };

  const filteredInstruments = instruments.filter((inst) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inst.instrumentName.toLowerCase().includes(term) ||
      inst.instrumentIdentifier.toLowerCase().includes(term) ||
      inst.model.toLowerCase().includes(term) ||
      inst.manufacturer.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-200/50">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Laboratory Instrument Registry
            </h1>
            <p className="text-xs text-slate-500">
              Hardware lifecycle tracking, calibration lockouts, and maintenance management
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
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Register Instrument
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
              placeholder="Search by name, ID or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white"
            >
              <option value="">All Categories</option>
              <option value="ANALYZER">Analyzers</option>
              <option value="CENTRIFUGE">Centrifuges</option>
              <option value="MICROSCOPE">Microscopes</option>
              <option value="INCUBATOR">Incubators</option>
              <option value="REFRIGERATOR">Refrigerators / Freezers</option>
              <option value="SPECTROPHOTOMETER">Spectrophotometers</option>
              <option value="PCR_MACHINE">PCR Thermal Cyclers</option>
              <option value="OTHER">Other Equipment</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_MAINTENANCE">In Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredInstruments.length} instrument(s)
        </div>
      </div>

      {/* Instruments Table */}
      <InstrumentRegistryTable
        instruments={filteredInstruments}
        loading={loading}
        onRecordCalibration={(inst) => setSelectedCalibrationInstrument(inst)}
        onScheduleMaintenance={(inst) => setSelectedMaintenanceInstrument(inst)}
      />

      {/* Modals */}
      <InstrumentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleRegisterInstrument}
      />

      {selectedCalibrationInstrument && (
        <CalibrationModal
          isOpen={!!selectedCalibrationInstrument}
          onClose={() => setSelectedCalibrationInstrument(null)}
          defaultInstrumentId={selectedCalibrationInstrument.id}
          onSubmit={handleRecordCalibration}
        />
      )}

      {selectedMaintenanceInstrument && (
        <MaintenanceModal
          isOpen={!!selectedMaintenanceInstrument}
          onClose={() => setSelectedMaintenanceInstrument(null)}
          mode="schedule"
          instrumentId={selectedMaintenanceInstrument.id}
          instrumentName={selectedMaintenanceInstrument.instrumentName}
          onSchedule={handleScheduleMaintenance}
        />
      )}
    </div>
  );
}
