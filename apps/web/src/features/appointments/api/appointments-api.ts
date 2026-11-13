import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  DoctorPublicDto,
  DoctorFilterQueryDto,
  TimeSlotDto,
  AppointmentDetailDto,
  AppointmentFilterQueryDto,
  BookAppointmentDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  PaginationMeta,
} from '@healthbridge/shared-types';

export const appointmentsApi = {
  /**
   * Fetch verified healthcare practitioners with specialization and location filters
   */
  async getDoctors(
    filters: DoctorFilterQueryDto = {}
  ): Promise<{ items: DoctorPublicDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.city) params.append('city', filters.city);
    if (filters.facilityId) params.append('facilityId', filters.facilityId);
    if (filters.consultationType) params.append('consultationType', filters.consultationType);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.DOCTORS}?${queryString}`
      : API_ENDPOINTS.DOCTORS;

    const response = await apiClient.get<ApiResponse<DoctorPublicDto[]>>(endpoint);

    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: (response.data.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch complete verified doctor public profile by ID
   */
  async getDoctorById(doctorId: string): Promise<DoctorPublicDto> {
    const response = await apiClient.get<ApiResponse<DoctorPublicDto>>(
      `${API_ENDPOINTS.DOCTORS}/${doctorId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Doctor profile not found');
    }
    return response.data.data;
  },

  /**
   * Query real-time available appointment slots for a specific date
   */
  async getDoctorAvailability(
    doctorId: string,
    date: string
  ): Promise<{ date: string; slots: TimeSlotDto[] }> {
    const response = await apiClient.get<
      ApiResponse<{ date: string; slots: TimeSlotDto[] }>
    >(`${API_ENDPOINTS.DOCTORS}/${doctorId}/availability?date=${encodeURIComponent(date)}`);

    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch doctor availability');
    }
    return response.data.data;
  },

  /**
   * Fetch authenticated patient's appointments (upcoming, confirmed, history, etc.)
   */
  async getAppointments(
    filters: AppointmentFilterQueryDto = {}
  ): Promise<{ items: AppointmentDetailDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.APPOINTMENTS}?${queryString}`
      : API_ENDPOINTS.APPOINTMENTS;

    const response = await apiClient.get<ApiResponse<AppointmentDetailDto[]>>(endpoint);

    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: (response.data.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch detailed appointment record with strict patient ownership
   */
  async getAppointmentById(appointmentId: string): Promise<AppointmentDetailDto> {
    const response = await apiClient.get<ApiResponse<AppointmentDetailDto>>(
      `${API_ENDPOINTS.APPOINTMENTS}/${appointmentId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Appointment not found');
    }
    return response.data.data;
  },

  /**
   * Book a clinical appointment with slot concurrency check
   */
  async bookAppointment(payload: BookAppointmentDto): Promise<AppointmentDetailDto> {
    const response = await apiClient.post<ApiResponse<AppointmentDetailDto>>(
      API_ENDPOINTS.APPOINTMENTS,
      payload
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to book appointment');
    }
    return response.data.data;
  },

  /**
   * Cancel an appointment following healthcare cancellation policy
   */
  async cancelAppointment(
    appointmentId: string,
    payload: CancelAppointmentDto
  ): Promise<AppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<AppointmentDetailDto>>(
      `${API_ENDPOINTS.APPOINTMENTS}/${appointmentId}/cancel`,
      payload
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to cancel appointment');
    }
    return response.data.data;
  },

  /**
   * Reschedule an appointment to a free future time slot
   */
  async rescheduleAppointment(
    appointmentId: string,
    payload: RescheduleAppointmentDto
  ): Promise<AppointmentDetailDto> {
    const response = await apiClient.patch<ApiResponse<AppointmentDetailDto>>(
      `${API_ENDPOINTS.APPOINTMENTS}/${appointmentId}/reschedule`,
      payload
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to reschedule appointment');
    }
    return response.data.data;
  },
};

