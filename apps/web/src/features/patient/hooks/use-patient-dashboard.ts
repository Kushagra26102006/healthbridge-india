'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patient-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { PatientDashboardSummaryDto } from '@healthbridge/shared-types';

export const PATIENT_DASHBOARD_QUERY_KEY = ['patient', 'dashboard-summary'] as const;

export const usePatientDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery<PatientDashboardSummaryDto, Error>({
    queryKey: PATIENT_DASHBOARD_QUERY_KEY,
    queryFn: () => patientApi.getDashboardSummary(),
    enabled: isPatient,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  const invalidateSummary = () => {
    return queryClient.invalidateQueries({ queryKey: PATIENT_DASHBOARD_QUERY_KEY });
  };

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidateSummary,
  };
};

export default usePatientDashboard;
