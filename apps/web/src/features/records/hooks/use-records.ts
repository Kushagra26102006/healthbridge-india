'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordsApi } from '../api/records-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  MedicalRecordFilterQueryDto,
  CreateMedicalRecordDto,
} from '@healthbridge/shared-types';

export const RECORDS_QUERY_KEY = ['records'] as const;
export const RECORDS_SUMMARY_QUERY_KEY = ['records', 'summary'] as const;

export const useRecords = (filters: MedicalRecordFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...RECORDS_QUERY_KEY, filters],
    queryFn: () => recordsApi.getRecords(filters),
    enabled: isPatient,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    records: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useRecordSummary = () => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: RECORDS_SUMMARY_QUERY_KEY,
    queryFn: () => recordsApi.getRecordSummary(),
    enabled: isPatient,
    staleTime: 60 * 1000,
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useRecordDetails = (recordId: string) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: ['records', recordId],
    queryFn: () => recordsApi.getRecordById(recordId),
    enabled: isPatient && Boolean(recordId),
    staleTime: 60 * 1000,
  });

  return {
    record: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useUploadRecord = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMedicalRecordDto) => recordsApi.uploadRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: RECORDS_SUMMARY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['patient', 'dashboard-summary'] });
      options?.onSuccess?.();
    },
  });
};

export const useDownloadRecord = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const download = async (recordId: string, fileName?: string) => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await recordsApi.downloadRecord(recordId, fileName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download record';
      setDownloadError(msg);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    download,
    isDownloading,
    downloadError,
  };
};
