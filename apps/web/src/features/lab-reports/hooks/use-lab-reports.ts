'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { labReportsApi } from '../api/lab-reports-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  LabReportFilterQueryDto,
  LabOrderFilterQueryDto,
} from '@healthbridge/shared-types';

export const LAB_REPORTS_QUERY_KEY = ['lab-reports'] as const;
export const LAB_REPORTS_SUMMARY_QUERY_KEY = ['lab-reports', 'summary'] as const;
export const LAB_REPORT_DETAIL_QUERY_KEY = ['lab-reports', 'detail'] as const;
export const LAB_ORDERS_QUERY_KEY = ['lab-orders'] as const;
export const LAB_ORDER_DETAIL_QUERY_KEY = ['lab-orders', 'detail'] as const;

/**
 * Hook to fetch paginated laboratory reports with filters
 */
export const useLabReports = (filters: LabReportFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...LAB_REPORTS_QUERY_KEY, filters],
    queryFn: () => labReportsApi.getReports(filters),
    enabled: isPatient,
    staleTime: 30 * 1000,
  });

  return {
    reports: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch summary count metrics across patient lab reports
 */
export const useLabReportSummary = () => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: LAB_REPORTS_SUMMARY_QUERY_KEY,
    queryFn: () => labReportsApi.getSummary(),
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

/**
 * Hook to fetch single report details and observations
 */
export const useLabReportDetails = (reportId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...LAB_REPORT_DETAIL_QUERY_KEY, reportId],
    queryFn: () => labReportsApi.getReportById(reportId!),
    enabled: isPatient && Boolean(reportId),
    staleTime: 60 * 1000,
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch diagnostic test orders
 */
export const useLabOrders = (filters: LabOrderFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...LAB_ORDERS_QUERY_KEY, filters],
    queryFn: () => labReportsApi.getOrders(filters),
    enabled: isPatient,
    staleTime: 30 * 1000,
  });

  return {
    orders: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch single lab order details
 */
export const useLabOrderDetails = (orderId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...LAB_ORDER_DETAIL_QUERY_KEY, orderId],
    queryFn: () => labReportsApi.getOrderById(orderId!),
    enabled: isPatient && Boolean(orderId),
    staleTime: 60 * 1000,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Mutation hook to download report document
 */
export const useDownloadLabReport = () => {
  return useMutation({
    mutationFn: ({ reportId, fileName }: { reportId: string; fileName?: string }) =>
      labReportsApi.downloadReportDocument(reportId, fileName),
  });
};

