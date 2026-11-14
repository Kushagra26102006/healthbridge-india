import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
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
} from '@healthbridge/shared-types';

export const doctorApi = {
  /**
   * Fetch aggregated summary for the authenticated doctor's dashboard
   */
  async getDashboardSummary(): Promise<DoctorDashboardSummaryDto> {
    const response = await apiClient.get<ApiResponse<DoctorDashboardSummaryDto>>(
      API_ENDPOINTS.DOCTORS.DASHBOARD_SUMMARY
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch doctor dashboard summary');
    }
    return response.data.data;
  },

  /**
   * Fetch appointment summary counts (today, upcoming, pending, completed, cancelled)
   */
  async getAppointmentSummaryCounts(): Promise<DoctorAppointmentSummaryCountsDto> {
    const response = await apiClient.get<ApiResponse<DoctorAppointmentSummaryCountsDto>>(
      API_ENDPOINTS.DOCTORS.APPOINTMENTS_SUMMARY
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch appointment summary counts');
    }
    return response.data.data;
  },

  /**
   * Fetch doctor appointments list with filters, search and pagination
   */
  async getAppointments(
    filters?: DoctorAppointmentFilterQueryDto
  ): Promise<{ items: DoctorAppointmentItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.filterTab) params.append('filterTab', filters.filterTab);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.consultationType) params.append('consultationType', filters.consultationType);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}?${query}`
      : API_ENDPOINTS.DOCTORS.APPOINTMENTS;

    const response = await apiClient.get<ApiResponse<DoctorAppointmentItemDto[]>>(endpoint);
    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total: (response.data.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch appointment details by ID
   */
  async getAppointmentById(appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.get<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Appointment not found');
    }
    return response.data.data;
  },

  /**
   * Confirm pending consultation request
   */
  async confirmAppointment(appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}/confirm`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to confirm appointment');
    }
    return response.data.data;
  },

  /**
   * Reject appointment request with reason
   */
  async rejectAppointment(appointmentId: string, reason?: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}/reject`,
      { reason }
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to reject appointment');
    }
    return response.data.data;
  },

  /**
   * Check in patient upon clinic arrival
   */
  async checkInPatient(appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}/check-in`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to check in patient');
    }
    return response.data.data;
  },

  /**
   * Start consultation session & initialize Encounter
   */
  async startConsultation(appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}/start`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to start consultation');
    }
    return response.data.data;
  },

  /**
   * Complete consultation session
   */
  async completeConsultation(appointmentId: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}/complete`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to complete consultation');
    }
    return response.data.data;
  },

  /**
   * Cancel appointment with reason
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<DoctorAppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<DoctorAppointmentDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.APPOINTMENTS}/${appointmentId}/cancel`,
      { reason }
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to cancel appointment');
    }
    return response.data.data;
  },

  /**
   * Fetch daily patient queue with priority ordering
   */
  async getQueue(filter?: string): Promise<DoctorQueueItemDto[]> {
    const params = new URLSearchParams();
    if (filter && filter !== 'ALL') params.append('filter', filter);
    const query = params.toString();
    const endpoint = query ? `${API_ENDPOINTS.DOCTORS.QUEUE}?${query}` : API_ENDPOINTS.DOCTORS.QUEUE;

    const response = await apiClient.get<ApiResponse<DoctorQueueItemDto[]>>(endpoint);
    return response.data.data || [];
  },

  /**
   * Fetch authenticated doctor's professional profile
   */
  async getProfile(): Promise<DoctorProfileDto> {
    const response = await apiClient.get<ApiResponse<DoctorProfileDto>>(
      API_ENDPOINTS.DOCTORS.PROFILE
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch doctor profile');
    }
    return response.data.data;
  },

  /**
   * Update permitted professional profile fields (bio, languages, fee, working hours, etc.)
   */
  async updateProfile(data: UpdateDoctorProfileDto): Promise<DoctorProfileDto> {
    const response = await apiClient.patch<ApiResponse<DoctorProfileDto>>(
      API_ENDPOINTS.DOCTORS.PROFILE,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to update doctor profile');
    }
    return response.data.data;
  },

  /**
   * Fetch today's scheduled consultations with optional status filter
   */
  async getTodayAppointments(status?: string): Promise<DoctorAppointmentItemDto[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') {
      params.append('status', status);
    }
    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.DOCTORS.TODAY_APPOINTMENTS}?${query}`
      : API_ENDPOINTS.DOCTORS.TODAY_APPOINTMENTS;

    const response = await apiClient.get<ApiResponse<DoctorAppointmentItemDto[]>>(endpoint);
    return response.data.data || [];
  },

  /**
   * Fetch upcoming scheduled consultations
   */
  async getUpcomingAppointments(limit = 10): Promise<DoctorAppointmentItemDto[]> {
    const response = await apiClient.get<ApiResponse<DoctorAppointmentItemDto[]>>(
      `${API_ENDPOINTS.DOCTORS.UPCOMING_APPOINTMENTS}?limit=${limit}`
    );
    return response.data.data || [];
  },

  /**
   * Fetch doctor's assigned / authorized patient roster
   */
  async getAssignedPatients(search?: string, limit = 50): Promise<DoctorPatientItemDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', String(limit));
    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.DOCTORS.PATIENTS}?${query}`
      : API_ENDPOINTS.DOCTORS.PATIENTS;

    const response = await apiClient.get<ApiResponse<DoctorPatientItemDto[]>>(endpoint);
    return response.data.data || [];
  },

  /**
   * Fetch doctor's schedule and availability settings
   */
  async getSchedule(): Promise<DoctorScheduleDto> {
    const response = await apiClient.get<ApiResponse<DoctorScheduleDto>>(
      API_ENDPOINTS.DOCTORS.SCHEDULE
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch doctor schedule');
    }
    return response.data.data;
  },

  /**
   * Update doctor schedule availability & blocked slots
   */
  async updateSchedule(data: UpdateDoctorScheduleDto): Promise<DoctorScheduleDto> {
    const response = await apiClient.put<ApiResponse<DoctorScheduleDto>>(
      API_ENDPOINTS.DOCTORS.SCHEDULE,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to update doctor schedule');
    }
    return response.data.data;
  },
};
