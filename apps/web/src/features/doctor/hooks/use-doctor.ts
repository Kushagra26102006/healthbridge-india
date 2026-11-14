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
  DoctorPrescriptionSummaryDto,
  PrescriptionListItemDto,
  PrescriptionDetailDto,
  CreateDoctorPrescriptionDto,
  UpdateDoctorPrescriptionDto,
  IssuePrescriptionDto,
  DiscontinuePrescriptionDto,
  PrescriptionFilterQueryDto,
  MedicationCatalogItemDto,
  MedicationCatalogFilterQueryDto,
  DoctorPatientFilterQueryDto,
  DoctorPatientProfileOverviewDto,
  DoctorPatientTimelineItemDto,
  PatientTimelineQueryDto,
  PatientRecordItemDto,
  PatientRecordFilterQueryDto,
  PatientEncounterHistoryItemDto,
  PatientPrescriptionHistoryItemDto,
  PatientLabReportHistoryItemDto,
  CreateDoctorConsentRequestDto,
  ScheduleOverviewDto,
  BlockedDateDto,
  ScheduleOverrideDto,
  CalendarViewItemDto,
  BlockDateRequestDto,
  BlockDateResultDto,
  TimeSlotDto,
  DoctorPracticeSettingsDto,
  UpdateDoctorPracticeSettingsDto,
  DoctorNotificationPreferencesDto,
  UpdateDoctorNotificationPreferencesDto,
  DoctorCredentialDocumentDto,
  UploadDoctorDocumentDto,
  UserSessionItemDto,
  ChangePasswordDto,
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
  patientDirectory: (query?: DoctorPatientFilterQueryDto) =>
    [...DOCTOR_KEYS.all, 'patients', 'directory', query || {}] as const,
  patientProfile: (patientId: string) =>
    [...DOCTOR_KEYS.all, 'patients', 'profile', patientId] as const,
  patientTimeline: (patientId: string, query?: PatientTimelineQueryDto) =>
    [...DOCTOR_KEYS.all, 'patients', 'timeline', patientId, query || {}] as const,
  patientRecords: (patientId: string, query?: PatientRecordFilterQueryDto) =>
    [...DOCTOR_KEYS.all, 'patients', 'records', patientId, query || {}] as const,
  patientEncounters: (patientId: string, page?: number, limit?: number) =>
    [...DOCTOR_KEYS.all, 'patients', 'encounters', patientId, page || 1, limit || 10] as const,
  patientPrescriptions: (patientId: string, page?: number, limit?: number) =>
    [...DOCTOR_KEYS.all, 'patients', 'prescriptions', patientId, page || 1, limit || 10] as const,
  patientLabReports: (patientId: string, page?: number, limit?: number) =>
    [...DOCTOR_KEYS.all, 'patients', 'lab-reports', patientId, page || 1, limit || 10] as const,
  schedule: () => [...DOCTOR_KEYS.all, 'schedule'] as const,
  scheduleOverview: () => [...DOCTOR_KEYS.all, 'schedule', 'overview'] as const,
  scheduleAvailability: (params: { date: string; consultationType?: string; facilityId?: string }) =>
    [...DOCTOR_KEYS.all, 'schedule', 'availability', params] as const,
  scheduleCalendar: (params: { view?: string; date?: string; facilityId?: string }) =>
    [...DOCTOR_KEYS.all, 'schedule', 'calendar', params] as const,
  blockedDates: () => [...DOCTOR_KEYS.all, 'schedule', 'blocked-dates'] as const,
  scheduleOverrides: () => [...DOCTOR_KEYS.all, 'schedule', 'overrides'] as const,
  scheduleFacilities: () => [...DOCTOR_KEYS.all, 'schedule', 'facilities'] as const,
  encounterSummary: () => [...DOCTOR_KEYS.all, 'encounters', 'summary'] as const,
  encounters: (filters?: EncounterFilterQueryDto) =>
    [...DOCTOR_KEYS.all, 'encounters', 'list', filters || {}] as const,
  encounterDetail: (id: string) => [...DOCTOR_KEYS.all, 'encounters', 'detail', id] as const,
  patientClinicalHistory: (patientId: string) =>
    [...DOCTOR_KEYS.all, 'patients', 'clinical-history', patientId] as const,
  prescriptionSummary: () => [...DOCTOR_KEYS.all, 'prescriptions', 'summary'] as const,
  prescriptions: (filters?: PrescriptionFilterQueryDto) =>
    [...DOCTOR_KEYS.all, 'prescriptions', 'list', filters || {}] as const,
  prescriptionDetail: (id: string) => [...DOCTOR_KEYS.all, 'prescriptions', 'detail', id] as const,
  prescriptionDocument: (id: string) => [...DOCTOR_KEYS.all, 'prescriptions', 'document', id] as const,
  medicationCatalog: (filters?: MedicationCatalogFilterQueryDto) =>
    ['medication-catalog', 'list', filters || {}] as const,
  medicationCatalogDetail: (id: string) => ['medication-catalog', 'detail', id] as const,
  practiceSettings: () => [...DOCTOR_KEYS.all, 'practice-settings'] as const,
  notificationPreferences: () => [...DOCTOR_KEYS.all, 'notification-preferences'] as const,
  documents: () => [...DOCTOR_KEYS.all, 'documents'] as const,
  sessions: () => [...DOCTOR_KEYS.all, 'sessions'] as const,
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
 * Hook for doctor schedule overview summary
 */
export const useDoctorScheduleOverview = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<ScheduleOverviewDto, Error>({
    queryKey: DOCTOR_KEYS.scheduleOverview(),
    queryFn: () => doctorApi.getScheduleOverview(),
    enabled: isDoctor,
    staleTime: 60 * 1000,
  });

  return {
    overview: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for doctor schedule slot availability for date
 */
export const useDoctorScheduleAvailability = (params: {
  date: string;
  consultationType?: string;
  facilityId?: string;
}) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<{ date: string; doctorId: string; slots: TimeSlotDto[] }, Error>({
    queryKey: DOCTOR_KEYS.scheduleAvailability(params),
    queryFn: () => doctorApi.getScheduleAvailability(params),
    enabled: isDoctor && Boolean(params.date),
  });

  return {
    availability: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for doctor schedule calendar view (day, week, month)
 */
export const useDoctorScheduleCalendar = (params: {
  view?: 'day' | 'week' | 'month';
  date?: string;
  facilityId?: string;
}) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<{ view: 'day' | 'week' | 'month'; startDate: string; endDate: string; items: CalendarViewItemDto[] }, Error>({
    queryKey: DOCTOR_KEYS.scheduleCalendar(params),
    queryFn: () => doctorApi.getScheduleCalendar(params),
    enabled: isDoctor,
  });

  return {
    calendar: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for managing doctor blocked dates and leaves
 */
export const useDoctorBlockedDates = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<BlockedDateDto[], Error>({
    queryKey: DOCTOR_KEYS.blockedDates(),
    queryFn: () => doctorApi.getBlockedDates(),
    enabled: isDoctor,
  });

  const createMutation = useMutation<BlockDateResultDto, Error, BlockDateRequestDto>({
    mutationFn: (data: BlockDateRequestDto) => doctorApi.createBlockedDate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.blockedDates() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.scheduleOverview() });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (blockId: string) => doctorApi.deleteBlockedDate(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.blockedDates() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.scheduleOverview() });
    },
  });

  return {
    blockedDates: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createBlockedDate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    deleteBlockedDate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
};

/**
 * Hook for managing doctor special schedule overrides
 */
export const useDoctorScheduleOverrides = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<ScheduleOverrideDto[], Error>({
    queryKey: DOCTOR_KEYS.scheduleOverrides(),
    queryFn: () => doctorApi.getScheduleOverrides(),
    enabled: isDoctor,
  });

  const createMutation = useMutation<ScheduleOverrideDto, Error, any>({
    mutationFn: (data: any) => doctorApi.createScheduleOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.scheduleOverrides() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.scheduleOverview() });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (overrideId: string) => doctorApi.deleteScheduleOverride(overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.scheduleOverrides() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.schedule() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.scheduleOverview() });
    },
  });

  return {
    overrides: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createOverride: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteOverride: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook for doctor facilities
 */
export const useDoctorScheduleFacilities = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<Array<{ id: string; name: string; type: string; address: string; isPrimary: boolean }>, Error>({
    queryKey: DOCTOR_KEYS.scheduleFacilities(),
    queryFn: () => doctorApi.getScheduleFacilities(),
    enabled: isDoctor,
  });

  return {
    facilities: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
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

/* ==========================================================================
   E-PRESCRIPTION HOOKS
   ========================================================================== */

/**
 * Hook for doctor prescription summary metrics
 */
export const useDoctorPrescriptionSummary = () => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorPrescriptionSummaryDto, Error>({
    queryKey: DOCTOR_KEYS.prescriptionSummary(),
    queryFn: () => doctorApi.getPrescriptionSummaryCounts(),
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
 * Hook for paginated doctor prescriptions
 */
export const useDoctorPrescriptions = (filters?: PrescriptionFilterQueryDto) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<{ items: PrescriptionListItemDto[]; meta: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.prescriptions(filters),
    queryFn: () => doctorApi.getPrescriptions(filters),
    enabled: isDoctor,
    staleTime: 30 * 1000,
  });

  return {
    prescriptions: query.data?.items || [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for detailed prescription document
 */
export const useDoctorPrescriptionDetail = (prescriptionId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<PrescriptionDetailDto, Error>({
    queryKey: DOCTOR_KEYS.prescriptionDetail(prescriptionId || ''),
    queryFn: () => doctorApi.getPrescriptionById(prescriptionId!),
    enabled: isDoctor && !!prescriptionId,
    staleTime: 30 * 1000,
  });

  return {
    prescription: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for printable digital prescription document representation
 */
export const useDoctorPrescriptionDocument = (prescriptionId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<{
    prescription: PrescriptionDetailDto;
    facility?: any;
    doctorRegistration?: string;
    generatedAt: string;
    watermarkText?: string;
  }, Error>({
    queryKey: DOCTOR_KEYS.prescriptionDocument(prescriptionId || ''),
    queryFn: () => doctorApi.getPrescriptionDocument(prescriptionId!),
    enabled: isDoctor && !!prescriptionId,
    staleTime: 60 * 1000,
  });

  return {
    document: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Mutation hooks for prescription actions (create, update draft, issue, discontinue)
 */
export const useDoctorPrescriptionActions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation<PrescriptionDetailDto, Error, CreateDoctorPrescriptionDto>({
    mutationFn: (data) => doctorApi.createPrescription(data),
    onSuccess: (newPrescription) => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.prescriptionSummary() });
      queryClient.invalidateQueries({ queryKey: [...DOCTOR_KEYS.all, 'prescriptions'] });
      queryClient.invalidateQueries({ queryKey: [...DOCTOR_KEYS.all, 'encounters'] });
      queryClient.setQueryData(DOCTOR_KEYS.prescriptionDetail(newPrescription.id), newPrescription);
    },
  });

  const updateMutation = useMutation<
    PrescriptionDetailDto,
    Error,
    { prescriptionId: string; data: UpdateDoctorPrescriptionDto }
  >({
    mutationFn: ({ prescriptionId, data }) => doctorApi.updatePrescription(prescriptionId, data),
    onSuccess: (updatedPrescription) => {
      queryClient.setQueryData(
        DOCTOR_KEYS.prescriptionDetail(updatedPrescription.id),
        updatedPrescription
      );
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.prescriptionSummary() });
      queryClient.invalidateQueries({ queryKey: [...DOCTOR_KEYS.all, 'prescriptions'] });
    },
  });

  const issueMutation = useMutation<
    PrescriptionDetailDto,
    Error,
    { prescriptionId: string; data: IssuePrescriptionDto }
  >({
    mutationFn: ({ prescriptionId, data }) => doctorApi.issuePrescription(prescriptionId, data),
    onSuccess: (issuedPrescription) => {
      queryClient.setQueryData(
        DOCTOR_KEYS.prescriptionDetail(issuedPrescription.id),
        issuedPrescription
      );
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.all });
    },
  });

  const discontinueMutation = useMutation<
    PrescriptionDetailDto,
    Error,
    { prescriptionId: string; data: DiscontinuePrescriptionDto }
  >({
    mutationFn: ({ prescriptionId, data }) =>
      doctorApi.discontinuePrescription(prescriptionId, data),
    onSuccess: (discontinuedPrescription) => {
      queryClient.setQueryData(
        DOCTOR_KEYS.prescriptionDetail(discontinuedPrescription.id),
        discontinuedPrescription
      );
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.prescriptionSummary() });
      queryClient.invalidateQueries({ queryKey: [...DOCTOR_KEYS.all, 'prescriptions'] });
    },
  });

  return {
    createPrescription: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updatePrescription: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    issuePrescription: issueMutation.mutateAsync,
    isIssuing: issueMutation.isPending,
    issueError: issueMutation.error,

    discontinuePrescription: discontinueMutation.mutateAsync,
    isDiscontinuing: discontinueMutation.isPending,
    discontinueError: discontinueMutation.error,
  };
};

/* ==========================================================================
   MEDICATION CATALOG HOOKS
   ========================================================================== */

/**
 * Hook for searching medication catalog
 */
export const useMedicationCatalog = (filters?: MedicationCatalogFilterQueryDto) => {
  const query = useQuery<{ items: MedicationCatalogItemDto[]; meta: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.medicationCatalog(filters),
    queryFn: () => doctorApi.searchMedicationCatalog(filters),
    staleTime: 5 * 60 * 1000,
  });

  return {
    catalog: query.data?.items || [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for single medication catalog item
 */
export const useMedicationCatalogDetail = (medicationId?: string) => {
  const query = useQuery<MedicationCatalogItemDto, Error>({
    queryKey: DOCTOR_KEYS.medicationCatalogDetail(medicationId || ''),
    queryFn: () => doctorApi.getMedicationCatalogById(medicationId!),
    enabled: !!medicationId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    medication: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

/* ==========================================================================
   DOCTOR PATIENT MANAGEMENT & CLINICAL HISTORY HOOKS
   ========================================================================== */

/**
 * Hook for authorized patient directory with server-side filters & pagination
 */
export const useDoctorPatientDirectory = (query?: DoctorPatientFilterQueryDto) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<{ items: DoctorPatientItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.patientDirectory(query),
    queryFn: () => doctorApi.getPatientDirectory(query),
    enabled: isDoctor,
    staleTime: 30 * 1000,
  });

  return {
    patients: res.data?.items || [],
    pagination: res.data?.pagination,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for patient clinical profile overview & access status
 */
export const useDoctorPatientProfile = (patientId?: string) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<DoctorPatientProfileOverviewDto, Error>({
    queryKey: DOCTOR_KEYS.patientProfile(patientId || ''),
    queryFn: () => doctorApi.getPatientProfile(patientId!),
    enabled: isDoctor && !!patientId,
    staleTime: 30 * 1000,
  });

  return {
    profile: res.data,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for chronological unified medical timeline
 */
export const useDoctorPatientTimeline = (patientId?: string, query?: PatientTimelineQueryDto) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<{ items: DoctorPatientTimelineItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.patientTimeline(patientId || '', query),
    queryFn: () => doctorApi.getPatientHistoryTimeline(patientId!, query),
    enabled: isDoctor && !!patientId,
    staleTime: 30 * 1000,
  });

  return {
    events: res.data?.items || [],
    pagination: res.data?.pagination,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for authorized patient medical records
 */
export const useDoctorPatientRecords = (patientId?: string, query?: PatientRecordFilterQueryDto) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<{ items: PatientRecordItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.patientRecords(patientId || '', query),
    queryFn: () => doctorApi.getPatientMedicalRecords(patientId!, query),
    enabled: isDoctor && !!patientId,
    staleTime: 30 * 1000,
  });

  return {
    records: res.data?.items || [],
    pagination: res.data?.pagination,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for previous clinical consultation encounters
 */
export const useDoctorPatientEncounters = (patientId?: string, page = 1, limit = 10) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<{ items: PatientEncounterHistoryItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.patientEncounters(patientId || '', page, limit),
    queryFn: () => doctorApi.getPatientEncounters(patientId!, page, limit),
    enabled: isDoctor && !!patientId,
    staleTime: 30 * 1000,
  });

  return {
    encounters: res.data?.items || [],
    pagination: res.data?.pagination,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for patient prescription history
 */
export const useDoctorPatientPrescriptions = (patientId?: string, page = 1, limit = 10) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<{ items: PatientPrescriptionHistoryItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.patientPrescriptions(patientId || '', page, limit),
    queryFn: () => doctorApi.getPatientPrescriptions(patientId!, page, limit),
    enabled: isDoctor && !!patientId,
    staleTime: 30 * 1000,
  });

  return {
    prescriptions: res.data?.items || [],
    pagination: res.data?.pagination,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for patient laboratory reports
 */
export const useDoctorPatientLabReports = (patientId?: string, page = 1, limit = 10) => {
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const res = useQuery<{ items: PatientLabReportHistoryItemDto[]; pagination: PaginationMeta }, Error>({
    queryKey: DOCTOR_KEYS.patientLabReports(patientId || '', page, limit),
    queryFn: () => doctorApi.getPatientLabReports(patientId!, page, limit),
    enabled: isDoctor && !!patientId,
    staleTime: 30 * 1000,
  });

  return {
    labReports: res.data?.items || [],
    pagination: res.data?.pagination,
    isLoading: res.isLoading,
    isError: res.isError,
    error: res.error,
    refetch: res.refetch,
  };
};

/**
 * Hook for ABDM electronic consent actions
 */
export const useDoctorConsentActions = (patientId: string) => {
  const queryClient = useQueryClient();

  const requestConsentMutation = useMutation<any, Error, CreateDoctorConsentRequestDto>({
    mutationFn: (data: CreateDoctorConsentRequestDto) =>
      doctorApi.createPatientConsentRequest(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.patientProfile(patientId) });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.all });
    },
  });

  return {
    requestConsent: requestConsentMutation.mutateAsync,
    isRequesting: requestConsentMutation.isPending,
    requestError: requestConsentMutation.error,
  };
};

/**
 * Hook for doctor practice settings
 */
export const useDoctorPracticeSettings = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorPracticeSettingsDto, Error>({
    queryKey: DOCTOR_KEYS.practiceSettings(),
    queryFn: () => doctorApi.getPracticeSettings(),
    enabled: isDoctor,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation<DoctorPracticeSettingsDto, Error, UpdateDoctorPracticeSettingsDto>({
    mutationFn: (data) => doctorApi.updatePracticeSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(DOCTOR_KEYS.practiceSettings(), updated);
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.profile() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.schedule() });
    },
  });

  return {
    practiceSettings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updatePracticeSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
};

/**
 * Hook for doctor notification preferences
 */
export const useDoctorNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorNotificationPreferencesDto, Error>({
    queryKey: DOCTOR_KEYS.notificationPreferences(),
    queryFn: () => doctorApi.getNotificationPreferences(),
    enabled: isDoctor,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation<DoctorNotificationPreferencesDto, Error, UpdateDoctorNotificationPreferencesDto>({
    mutationFn: (data) => doctorApi.updateNotificationPreferences(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(DOCTOR_KEYS.notificationPreferences(), updated);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
};

/**
 * Hook for doctor credential documents
 */
export const useDoctorDocuments = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<DoctorCredentialDocumentDto[], Error>({
    queryKey: DOCTOR_KEYS.documents(),
    queryFn: () => doctorApi.getDocuments(),
    enabled: isDoctor,
    staleTime: 60 * 1000,
  });

  const uploadMutation = useMutation<DoctorCredentialDocumentDto, Error, UploadDoctorDocumentDto>({
    mutationFn: (data) => doctorApi.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.documents() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.profile() });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (docId) => doctorApi.deleteDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.documents() });
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.profile() });
    },
  });

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook for active doctor sessions
 */
export const useDoctorSessions = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const isDoctor = isAuthenticated && user?.role === 'DOCTOR';

  const query = useQuery<UserSessionItemDto[], Error>({
    queryKey: DOCTOR_KEYS.sessions(),
    queryFn: () => doctorApi.getSessions(),
    enabled: isDoctor,
    staleTime: 30 * 1000,
  });

  const revokeMutation = useMutation<void, Error, string>({
    mutationFn: (sessionId) => doctorApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.sessions() });
    },
  });

  const revokeOthersMutation = useMutation<{ revokedCount: number }, Error, void>({
    mutationFn: () => doctorApi.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCTOR_KEYS.sessions() });
    },
  });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    revokeSession: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
    revokeOtherSessions: revokeOthersMutation.mutateAsync,
    isRevokingOthers: revokeOthersMutation.isPending,
  };
};

/**
 * Hook for changing password
 */
export const useDoctorChangePassword = () => {
  const mutation = useMutation<{ message: string }, Error, ChangePasswordDto>({
    mutationFn: (data) => doctorApi.changePassword(data),
  });

  return {
    changePassword: mutation.mutateAsync,
    isChanging: mutation.isPending,
    error: mutation.error,
  };
};


