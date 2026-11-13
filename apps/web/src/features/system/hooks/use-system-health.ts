'use client';

import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { setBackendHealth, setDisconnected } from '@/store/slices/system-slice';
import type { ApiResponse, HealthCheckData } from '@healthbridge/shared-types';

export function useSystemHealth() {
  const dispatch = useDispatch();

  const query = useQuery<HealthCheckData>({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<HealthCheckData>>(API_ENDPOINTS.HEALTH);
      if (!response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch backend health status');
      }
      return response.data.data;
    },
    refetchInterval: 30000, // Background poll every 30 seconds
    retry: 2,
    staleTime: 10000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setBackendHealth(query.data));
    } else if (query.isError) {
      dispatch(setDisconnected());
    }
  }, [query.data, query.isError, dispatch]);

  return {
    health: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
