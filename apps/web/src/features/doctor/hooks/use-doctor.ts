'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi } from '../api/doctor-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  DoctorDashboardSummaryDto,
  DoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorAppointmentItemDto,
  DoctorPatientItemDto,
  DoctorScheduleDto,
} from '@healthbridge/shared-types';

export const DOCTOR_KEYS = {
  all: ['doctor'] as const,
  dashboard: () => [...DOCTOR_KEYS.all, 'dashboard'] as const,
  profile: () => [...DOCTOR_KEYS.all, 'profile'] as const,
  todayAppointments: (status?: string) => [...DOCTOR_KEYS.all, 'appointments', 'today', status || 'ALL'] as const,
  upcomingAppointments: (limit?: number) => [...DOCTOR_KEYS.all, 'appointments', 'upcoming', limit] as const,
  patients: (search?: string) => [...DOCTOR_KEYS.all, 'patients', search || ''] as const,
  schedule: () => [...DOCTOR_KEYS.all, 'schedule'] as const,
};

/**
 * Hook for doctor dashboard aggregated summary
 */
export const useDoctorDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorDashboardSummaryDto, Error>({
    queryKey: DOCTOR_KEYS.dashboard(),
    queryFn: () => doctorApi.getDashboardSummary(),
    enabled: isDoctor,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for doctor professional profile
 */
export const useDoctorProfile = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorProfileDto, Error>({
    queryKey: DOCTOR_KEYS.profile(),
    queryFn: () => doctorApi.getProfile(),
    enabled: isDoctor,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation<DoctorProfileDto, Error, UpdateDoctorProfileDto>({
    mutationFn: (data: UpdateDoctorProfileDto) => doctorApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(DOCTOR_KEYS.profile(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.dashboard() });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
};

/**
 * Hook for today's consultations with status filter
 */
export const useDoctorTodayAppointments = (status?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorAppointmentItemDto[], Error>({
    queryKey: DOCTOR_KEYS.todayAppointments(status),
    queryFn: () => doctorApi.getTodayAppointments(status),
    enabled: isDoctor,
    staleTime: 30 * 1000,
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for upcoming consultations
 */
export const useDoctorUpcomingAppointments = (limit = 10) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorAppointmentItemDto[], Error>({
    queryKey: DOCTOR_KEYS.upcomingAppointments(limit),
    queryFn: () => doctorApi.getUpcomingAppointments(limit),
    enabled: isDoctor,
    staleTime: 60 * 1000,
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for doctor's assigned patient roster
 */
export const useDoctorPatients = (search?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorPatientItemDto[], Error>({
    queryKey: DOCTOR_KEYS.patients(search),
    queryFn: () => doctorApi.getAssignedPatients(search),
    enabled: isDoctor,
    staleTime: 60 * 1000,
  });

  return {
    patients: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for doctor's schedule and availability
 */
export const useDoctorSchedule = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorScheduleDto, Error>({
    queryKey: DOCTOR_KEYS.schedule(),
    queryFn: () => doctorApi.getSchedule(),
    enabled: isDoctor,
    staleTime: 5 * 60 * 1000,
  });

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
