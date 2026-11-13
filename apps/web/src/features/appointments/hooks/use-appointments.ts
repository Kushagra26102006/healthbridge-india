'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointments-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  DoctorFilterQueryDto,
  AppointmentFilterQueryDto,
  BookAppointmentDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
} from '@healthbridge/shared-types';

export const DOCTORS_QUERY_KEY = ['doctors'] as const;
export const DOCTOR_PROFILE_QUERY_KEY = ['doctors', 'profile'] as const;
export const DOCTOR_AVAILABILITY_QUERY_KEY = ['doctors', 'availability'] as const;
export const APPOINTMENTS_QUERY_KEY = ['appointments'] as const;
export const APPOINTMENT_DETAIL_QUERY_KEY = ['appointments', 'detail'] as const;

/**
 * Hook to discover and search doctors
 */
export const useDoctors = (filters: DoctorFilterQueryDto = {}) => {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: [...DOCTORS_QUERY_KEY, filters],
    queryFn: () => appointmentsApi.getDoctors(filters),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    doctors: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch doctor profile by ID
 */
export const useDoctorProfile = (doctorId?: string) => {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: [...DOCTOR_PROFILE_QUERY_KEY, doctorId],
    queryFn: () => appointmentsApi.getDoctorById(doctorId!),
    enabled: isAuthenticated && Boolean(doctorId),
    staleTime: 2 * 60 * 1000,
  });

  return {
    doctor: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to query doctor availability for a given date
 */
export const useDoctorAvailability = (doctorId?: string, date?: string) => {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: [...DOCTOR_AVAILABILITY_QUERY_KEY, doctorId, date],
    queryFn: () => appointmentsApi.getDoctorAvailability(doctorId!, date!),
    enabled: isAuthenticated && Boolean(doctorId) && Boolean(date),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    availability: query.data,
    slots: query.data?.slots || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch patient appointments
 */
export const useAppointments = (filters: AppointmentFilterQueryDto = {}) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...APPOINTMENTS_QUERY_KEY, filters],
    queryFn: () => appointmentsApi.getAppointments(filters),
    enabled: isPatient,
    staleTime: 30 * 1000,
  });

  return {
    appointments: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch single appointment details
 */
export const useAppointmentDetails = (appointmentId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isPatient = isAuthenticated && user?.role === 'PATIENT';

  const query = useQuery({
    queryKey: [...APPOINTMENT_DETAIL_QUERY_KEY, appointmentId],
    queryFn: () => appointmentsApi.getAppointmentById(appointmentId!),
    enabled: isPatient && Boolean(appointmentId),
    staleTime: 60 * 1000,
  });

  return {
    appointment: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Mutation hook to book appointment
 */
export const useBookAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BookAppointmentDto) => appointmentsApi.bookAppointment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DOCTOR_AVAILABILITY_QUERY_KEY });
    },
  });
};

/**
 * Mutation hook to cancel appointment
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      payload,
    }: {
      appointmentId: string;
      payload: CancelAppointmentDto;
    }) => appointmentsApi.cancelAppointment(appointmentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...APPOINTMENT_DETAIL_QUERY_KEY, variables.appointmentId],
      });
      queryClient.invalidateQueries({ queryKey: DOCTOR_AVAILABILITY_QUERY_KEY });
    },
  });
};

/**
 * Mutation hook to reschedule appointment
 */
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      payload,
    }: {
      appointmentId: string;
      payload: RescheduleAppointmentDto;
    }) => appointmentsApi.rescheduleAppointment(appointmentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...APPOINTMENT_DETAIL_QUERY_KEY, variables.appointmentId],
      });
      queryClient.invalidateQueries({ queryKey: DOCTOR_AVAILABILITY_QUERY_KEY });
    },
  });
};

