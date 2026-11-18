'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

function useStableParams<T>(params?: T): T | undefined {
  const serialized = JSON.stringify(params ?? null);
  return useMemo(() => (serialized === 'null' ? undefined : (JSON.parse(serialized) as T)), [serialized]);
}

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
  const stableParams = useStableParams(params);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listProfiles(stableParams);
      setProfiles(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load QC profiles');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listRuns(stableParams);
      setRuns(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load QC runs');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listIncidents(stableParams);
      setIncidents(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load Quality Incidents');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchCAPAs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listCAPAs(stableParams);
      setCapas(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load CAPAs');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchInstruments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listInstruments(stableParams);
      setInstruments(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load instruments');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchCalibrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listCalibrations(stableParams);
      setCalibrations(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load calibrations');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchMaintenance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listMaintenance(stableParams);
      setMaintenance(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchReagents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listReagents(stableParams);
      setReagents(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reagents');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchLots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listLots(stableParams);
      setLots(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reagent lots');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

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
  const stableParams = useStableParams(params);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.listTransactions(stableParams);
      setTransactions(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load stock transactions');
    } finally {
      setLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, loading, error, refetch: fetchTransactions };
}
