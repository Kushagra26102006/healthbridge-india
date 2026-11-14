'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consentApi } from '../api/consent-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  ConsentFilterQueryDto,
  ApproveConsentInputDto,
  RejectConsentInputDto,
  RevokeConsentInputDto,
} from '@healthbridge/shared-types';

export const CONSENT_QUERY_KEY = ['consent'] as const;
export const CONSENT_SUMMARY_QUERY_KEY = ['consent', 'summary'] as const;
export const CONSENT_REQUESTS_QUERY_KEY = ['consent', 'requests'] as const;
export const CONSENT_ACTIVE_QUERY_KEY = ['consent', 'active'] as const;
export const CONSENT_HISTORY_QUERY_KEY = ['consent', 'history'] as const;
export const CONSENT_DETAIL_QUERY_KEY = ['consent', 'detail'] as const;

/**
 * Hook to fetch paginated list of all consents with filters
 */
export const useConsents = (filters: ConsentFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...CONSENT_QUERY_KEY, filters],
    queryFn: () => consentApi.getConsents(filters),
    enabled: isPatient,
    staleTime: 30 * 1000,
  });

  return {
    consents: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch summary metric cards for consent permissions
 */
export const useConsentSummary = () => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: CONSENT_SUMMARY_QUERY_KEY,
    queryFn: () => consentApi.getSummary(),
    enabled: isPatient,
    staleTime: 30 * 1000,
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
 * Hook to fetch incoming pending access requests
 */
export const useConsentRequests = (filters: ConsentFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...CONSENT_REQUESTS_QUERY_KEY, filters],
    queryFn: () => consentApi.getRequests(filters),
    enabled: isPatient,
    staleTime: 30 * 1000,
  });

  return {
    requests: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch active approved permissions
 */
export const useActiveConsents = (filters: ConsentFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...CONSENT_ACTIVE_QUERY_KEY, filters],
    queryFn: () => consentApi.getActive(filters),
    enabled: isPatient,
    staleTime: 30 * 1000,
  });

  return {
    activeConsents: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch consent history audit events
 */
export const useConsentHistory = () => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: CONSENT_HISTORY_QUERY_KEY,
    queryFn: () => consentApi.getHistory(),
    enabled: isPatient,
    staleTime: 60 * 1000,
  });

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch detailed information on a single consent request
 */
export const useConsentDetails = (consentId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...CONSENT_DETAIL_QUERY_KEY, consentId],
    queryFn: () => consentApi.getConsentById(consentId!),
    enabled: isPatient && Boolean(consentId),
    staleTime: 30 * 1000,
  });

  return {
    consent: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Mutation hook to approve a consent request
 */
export const useApproveConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consentId,
      input,
    }: {
      consentId: string;
      input?: ApproveConsentInputDto;
    }) => consentApi.approveConsent(consentId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONSENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_SUMMARY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_ACTIVE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_HISTORY_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CONSENT_DETAIL_QUERY_KEY, variables.consentId],
      });
    },
  });
};

/**
 * Mutation hook to reject a consent request
 */
export const useRejectConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consentId,
      input,
    }: {
      consentId: string;
      input?: RejectConsentInputDto;
    }) => consentApi.rejectConsent(consentId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONSENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_SUMMARY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_ACTIVE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_HISTORY_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CONSENT_DETAIL_QUERY_KEY, variables.consentId],
      });
    },
  });
};

/**
 * Mutation hook to revoke an active consent permission
 */
export const useRevokeConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consentId,
      input,
    }: {
      consentId: string;
      input?: RevokeConsentInputDto;
    }) => consentApi.revokeConsent(consentId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONSENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_SUMMARY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_ACTIVE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONSENT_HISTORY_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CONSENT_DETAIL_QUERY_KEY, variables.consentId],
      });
    },
  });
};
