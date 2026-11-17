'use client';

import { useState, useEffect, useCallback } from 'react';
import { laboratoryQualityApi } from '../api/laboratory-quality-api';
import type {
  QualityDashboardDto,
  QCProfileDto,
  QCRunDto,
  QualityIncidentDto,
  CAPADto,
  LabInstrumentDto,
  InstrumentCalibrationDto,
  InstrumentMaintenanceDto,
  ReagentDto,
  ReagentLotDto,
  ReagentInventoryTransactionDto,
} from '@healthbridge/shared-types';

export function useQualityDashboard() {
  const [data, setData] = useState<QualityDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load quality dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}

export function useQCProfiles(params?: { testCode?: string; isActive?: boolean; search?: string }) {
  const [profiles, setProfiles] = useState<QCProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listProfiles(params);
      setProfiles(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load QC profiles');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, refetch: fetchProfiles };
}

export function useQCRuns(params?: any) {
  const [runs, setRuns] = useState<QCRunDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listRuns(params);
      setRuns(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load QC runs');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, total, loading, error, refetch: fetchRuns };
}

export function useQualityIncidents(params?: any) {
  const [incidents, setIncidents] = useState<QualityIncidentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listIncidents(params);
      setIncidents(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load Quality Incidents');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return { incidents, total, loading, error, refetch: fetchIncidents };
}

export function useCAPAs(params?: any) {
  const [capas, setCapas] = useState<CAPADto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCAPAs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listCAPAs(params);
      setCapas(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load CAPAs');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchCAPAs();
  }, [fetchCAPAs]);

  return { capas, total, loading, error, refetch: fetchCAPAs };
}

export function useInstruments(params?: any) {
  const [instruments, setInstruments] = useState<LabInstrumentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstruments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listInstruments(params);
      setInstruments(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load instruments');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  return { instruments, total, loading, error, refetch: fetchInstruments };
}

export function useCalibrations(params?: any) {
  const [calibrations, setCalibrations] = useState<InstrumentCalibrationDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalibrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listCalibrations(params);
      setCalibrations(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load calibrations');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchCalibrations();
  }, [fetchCalibrations]);

  return { calibrations, total, loading, error, refetch: fetchCalibrations };
}

export function useMaintenance(params?: any) {
  const [maintenance, setMaintenance] = useState<InstrumentMaintenanceDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listMaintenance(params);
      setMaintenance(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

  return { maintenance, total, loading, error, refetch: fetchMaintenance };
}

export function useReagents(params?: any) {
  const [reagents, setReagents] = useState<ReagentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReagents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listReagents(params);
      setReagents(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reagents');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchReagents();
  }, [fetchReagents]);

  return { reagents, total, loading, error, refetch: fetchReagents };
}

export function useReagentLots(params?: any) {
  const [lots, setLots] = useState<ReagentLotDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listLots(params);
      setLots(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reagent lots');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  return { lots, total, loading, error, refetch: fetchLots };
}

export function useReagentTransactions(params?: any) {
  const [transactions, setTransactions] = useState<ReagentInventoryTransactionDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listTransactions(params);
      setTransactions(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load stock transactions');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, loading, error, refetch: fetchTransactions };
}
