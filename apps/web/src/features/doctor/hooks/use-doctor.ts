'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi } from '../api/doctor-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  DoctorDashboardSummaryDto,
  DoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorAppointmentItemDto,
  DoctorAppointmentSummaryCountsDto,
  DoctorQueueItemDto,
  DoctorAppointmentDetailDto,
  DoctorPatientItemDto,
  DoctorScheduleDto,
  UpdateDoctorScheduleDto,
  DoctorAppointmentFilterQueryDto,
  PaginationMeta,
  EncounterItemDto,
  EncounterDetailDto,
  EncounterSummaryCountsDto,
  PatientClinicalHistoryDto,
  CreateEncounterDto,
  UpdateEncounterDto,
  EncounterFilterQueryDto,
} from '@healthbridge/shared-types';

export const DOCTOR_KEYS = {
  all: ['doctor'] as const,
  dashboard: () => [...DOCTOR_KEYS.all, 'dashboard'] as const,
  profile: () => [...DOCTOR_KEYS.all, 'profile'] as const,
  appointmentSummary: () => [...DOCTOR_KEYS.all, 'appointments', 'summary'] as const,
  appointments: (filters?: DoctorAppointmentFilterQueryDto) =>
    [...DOCTOR_KEYS.all, 'appointments', 'list', filters || {}] as const,
  appointmentDetail: (id: string) => [...DOCTOR_KEYS.all, 'appointments', 'detail', id] as const,
  todayAppointments: (status?: string) =>
    [...DOCTOR_KEYS.all, 'appointments', 'today', status || 'ALL'] as const,
  upcomingAppointments: (limit?: number) =>
    [...DOCTOR_KEYS.all, 'appointments', 'upcoming', limit] as const,
  queue: (filter?: string) => [...DOCTOR_KEYS.all, 'queue', filter || 'ALL'] as const,
  patients: (search?: string) => [...DOCTOR_KEYS.all, 'patients', search || ''] as const,
  schedule: () => [...DOCTOR_KEYS.all, 'schedule'] as const,
  encounterSummary: () => [...DOCTOR_KEYS.all, 'encounters', 'summary'] as const,
  encounters: (filters?: EncounterFilterQueryDto) =>
    [...DOCTOR_KEYS.all, 'encounters', 'list', filters || {}] as const,
  encounterDetail: (id: string) => [...DOCTOR_KEYS.all, 'encounters', 'detail', id] as const,
  patientClinicalHistory: (patientId: string) =>
    [...DOCTOR_KEYS.all, 'patients', 'clinical-history', patientId] as const,
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
 * Hook for doctor appointment summary counts
 */
export const useDoctorAppointmentSummary = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorAppointmentSummaryCountsDto, Error>({
    queryKey: DOCTOR_KEYS.appointmentSummary(),
    queryFn: () => doctorApi.getAppointmentSummaryCounts(),
    enabled: isDoctor,
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
 * Hook for doctor appointments listing with filters and pagination
 */
export const useDoctorAppointments = (filters?: DoctorAppointmentFilterQueryDto) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<{ items: DoctorAppointmentItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.appointments(filters),
    queryFn: () => doctorApi.getAppointments(filters),
    enabled: isDoctor,
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
 * Hook for single appointment details
 */
export const useDoctorAppointmentDetail = (appointmentId: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorAppointmentDetailDto, Error>({
    queryKey: DOCTOR_KEYS.appointmentDetail(appointmentId),
    queryFn: () => doctorApi.getAppointmentById(appointmentId),
    enabled: isDoctor && Boolean(appointmentId),
    staleTime: 30 * 1000,
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
 * Hook for daily patient queue
 */
export const useDoctorQueue = (filter?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorQueueItemDto[], Error>({
    queryKey: DOCTOR_KEYS.queue(filter),
    queryFn: () => doctorApi.getQueue(filter),
    enabled: isDoctor,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30s for queue arrivals
  });

  return {
    queue: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for appointment actions (confirm, reject, check-in, start, complete, cancel)
 */
export const useDoctorAppointmentActions = () => {
  const queryClient = useQueryClient();

  const invalidateAppointments = () => {
    queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.all });
  };

  const confirmMutation = useMutation<DoctorAppointmentDetailDto, Error, string>({
    mutationFn: (id: string) => doctorApi.confirmAppointment(id),
    onSuccess: invalidateAppointments,
  });

  const rejectMutation = useMutation<
    DoctorAppointmentDetailDto,
    Error,
    { id: string; reason?: string }
  >({
    mutationFn: ({ id, reason }) => doctorApi.rejectAppointment(id, reason),
    onSuccess: invalidateAppointments,
  });

  const checkInMutation = useMutation<DoctorAppointmentDetailDto, Error, string>({
    mutationFn: (id: string) => doctorApi.checkInPatient(id),
    onSuccess: invalidateAppointments,
  });

  const startMutation = useMutation<DoctorAppointmentDetailDto, Error, string>({
    mutationFn: (id: string) => doctorApi.startConsultation(id),
    onSuccess: invalidateAppointments,
  });

  const completeMutation = useMutation<DoctorAppointmentDetailDto, Error, string>({
    mutationFn: (id: string) => doctorApi.completeConsultation(id),
    onSuccess: invalidateAppointments,
  });

  const cancelMutation = useMutation<
    DoctorAppointmentDetailDto,
    Error,
    { id: string; reason: string }
  >({
    mutationFn: ({ id, reason }) => doctorApi.cancelAppointment(id, reason),
    onSuccess: invalidateAppointments,
  });

  return {
    confirmAppointment: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    rejectAppointment: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    checkInPatient: checkInMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
    startConsultation: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    completeConsultation: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    cancelAppointment: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
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
  const queryClient = useQueryClient();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorScheduleDto, Error>({
    queryKey: DOCTOR_KEYS.schedule(),
    queryFn: () => doctorApi.getSchedule(),
    enabled: isDoctor,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation<DoctorScheduleDto, Error, UpdateDoctorScheduleDto>({
    mutationFn: (data: UpdateDoctorScheduleDto) => doctorApi.updateSchedule(data),
    onSuccess: (updatedSchedule) => {
      queryClient.setQueryData(DOCTOR_KEYS.schedule(), updatedSchedule);
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.all });
    },
  });

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateSchedule: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
};

/**
 * Hook for doctor clinical encounter summary counts
 */
export const useDoctorEncounterSummary = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<EncounterSummaryCountsDto, Error>({
    queryKey: DOCTOR_KEYS.encounterSummary(),
    queryFn: () => doctorApi.getEncounterSummaryCounts(),
    enabled: isDoctor,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
 * Hook for doctor clinical encounters list
 */
export const useDoctorEncounters = (filters?: EncounterFilterQueryDto) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<{ items: EncounterItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.encounters(filters),
    queryFn: () => doctorApi.getEncounters(filters),
    enabled: isDoctor,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    encounters: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for single clinical encounter detail workspace
 */
export const useDoctorEncounterDetail = (encounterId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<EncounterDetailDto, Error>({
    queryKey: DOCTOR_KEYS.encounterDetail(encounterId || ''),
    queryFn: () => doctorApi.getEncounterById(encounterId!),
    enabled: isDoctor && !!encounterId,
    staleTime: 15 * 1000,
  });

  return {
    encounter: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for clinical encounter mutations (Create, Save Draft, Complete)
 */
export const useDoctorEncounterActions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation<EncounterDetailDto, Error, CreateEncounterDto>({
    mutationFn: (data: CreateEncounterDto) => doctorApi.createEncounter(data),
    onSuccess: (newEncounter) => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.encounterSummary() });
      queryClient.invalidateQueries({ queryKey: [...DOCTOR_KEYS.all, 'encounters'] });
      queryClient.setQueryData(DOCTOR_KEYS.encounterDetail(newEncounter.id), newEncounter);
    },
  });

  const saveDraftMutation = useMutation<
    EncounterDetailDto,
    Error,
    { encounterId: string; data: UpdateEncounterDto }
  >({
    mutationFn: ({ encounterId, data }) => doctorApi.saveEncounterDraft(encounterId, data),
    onSuccess: (updatedEncounter) => {
      queryClient.setQueryData(DOCTOR_KEYS.encounterDetail(updatedEncounter.id), updatedEncounter);
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.encounterSummary() });
      queryClient.invalidateQueries({ queryKey: [...DOCTOR_KEYS.all, 'encounters'] });
    },
  });

  const completeMutation = useMutation<
    EncounterDetailDto,
    Error,
    { encounterId: string; data?: UpdateEncounterDto }
  >({
    mutationFn: ({ encounterId, data }) => doctorApi.completeEncounter(encounterId, data),
    onSuccess: (finalizedEncounter) => {
      queryClient.setQueryData(DOCTOR_KEYS.encounterDetail(finalizedEncounter.id), finalizedEncounter);
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.all });
    },
  });

  return {
    createEncounter: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    saveDraft: saveDraftMutation.mutateAsync,
    isSavingDraft: saveDraftMutation.isPending,
    saveDraftError: saveDraftMutation.error,

    completeEncounter: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    completeError: completeMutation.error,
  };
};

/**
 * Hook for patient longitudinal clinical history
 */
export const usePatientClinicalHistory = (patientId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<PatientClinicalHistoryDto, Error>({
    queryKey: DOCTOR_KEYS.patientClinicalHistory(patientId || ''),
    queryFn: () => doctorApi.getPatientClinicalHistory(patientId!),
    enabled: isDoctor && !!patientId,
    staleTime: 60 * 1000,
  });

  return {
    history: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

