import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  DoctorDashboardSummaryDto,
  DoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorAppointmentItemDto,
  DoctorPatientItemDto,
  DoctorScheduleDto,
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
};
