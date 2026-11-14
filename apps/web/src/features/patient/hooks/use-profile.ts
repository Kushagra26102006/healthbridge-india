'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patient-api';
import type {
  UpdatePatientProfileDto,
  ChangePasswordDto,
  UpdateNotificationPreferencesDto,
} from '@healthbridge/shared-types';

export const PATIENT_PROFILE_QUERY_KEY = ['patient', 'profile'];
export const PATIENT_SESSIONS_QUERY_KEY = ['patient', 'sessions'];
export const PATIENT_NOTIFICATION_PREFS_QUERY_KEY = ['patient', 'notification-preferences'];

/**
 * Hook to retrieve full authenticated patient profile
 */
export function usePatientProfile() {
  const query = useQuery({
    queryKey: PATIENT_PROFILE_QUERY_KEY,
    queryFn: () => patientApi.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to update permitted personal information
 */
export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientProfileDto) => patientApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PATIENT_PROFILE_QUERY_KEY, updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['patient', 'dashboard-summary'] });
    },
  });
}

/**
 * Hook to change account password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => patientApi.changePassword(data),
  });
}

/**
 * Hook to list active sessions
 */
export function useActiveSessions() {
  const query = useQuery({
    queryKey: PATIENT_SESSIONS_QUERY_KEY,
    queryFn: () => patientApi.getSessions(),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to revoke individual session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => patientApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_SESSIONS_QUERY_KEY });
    },
  });
}

/**
 * Hook to revoke all other active sessions
 */
export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => patientApi.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_SESSIONS_QUERY_KEY });
    },
  });
}

/**
 * Hook to get notification preferences
 */
export function useNotificationPreferences() {
  const query = useQuery({
    queryKey: PATIENT_NOTIFICATION_PREFS_QUERY_KEY,
    queryFn: () => patientApi.getNotificationPreferences(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesDto) =>
      patientApi.updateNotificationPreferences(data),
    onSuccess: (updatedPrefs) => {
      queryClient.setQueryData(PATIENT_NOTIFICATION_PREFS_QUERY_KEY, updatedPrefs);
      queryClient.invalidateQueries({ queryKey: PATIENT_PROFILE_QUERY_KEY });
    },
  });
}
