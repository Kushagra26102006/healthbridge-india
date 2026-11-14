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

  /**
   * Fetch clinical encounter summary counts
   */
  async getEncounterSummaryCounts(): Promise<EncounterSummaryCountsDto> {
    const response = await apiClient.get<ApiResponse<EncounterSummaryCountsDto>>(
      API_ENDPOINTS.DOCTORS.ENCOUNTERS_SUMMARY
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch encounter summary counts');
    }
    return response.data.data;
  },

  /**
   * Fetch clinical encounters list with filters, search, and pagination
   */
  async getEncounters(
    filters?: EncounterFilterQueryDto
  ): Promise<{ items: EncounterItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.filterTab) params.append('filterTab', filters.filterTab);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.facilityId) params.append('facilityId', filters.facilityId);
    if (filters?.encounterType) params.append('encounterType', filters.encounterType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.DOCTORS.ENCOUNTERS}?${query}`
      : API_ENDPOINTS.DOCTORS.ENCOUNTERS;

    const response = await apiClient.get<ApiResponse<EncounterItemDto[]>>(endpoint);
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
   * Fetch detailed clinical encounter workspace by ID
   */
  async getEncounterById(encounterId: string): Promise<EncounterDetailDto> {
    const response = await apiClient.get<ApiResponse<EncounterDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.ENCOUNTERS}/${encounterId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch encounter details');
    }
    return response.data.data;
  },

  /**
   * Start a new clinical encounter
   */
  async createEncounter(data: CreateEncounterDto): Promise<EncounterDetailDto> {
    const response = await apiClient.post<ApiResponse<EncounterDetailDto>>(
      API_ENDPOINTS.DOCTORS.ENCOUNTERS,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to start clinical encounter');
    }
    return response.data.data;
  },

  /**
   * Save draft documentation of an encounter
   */
  async saveEncounterDraft(
    encounterId: string,
    data: UpdateEncounterDto
  ): Promise<EncounterDetailDto> {
    const response = await apiClient.patch<ApiResponse<EncounterDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.ENCOUNTERS}/${encounterId}`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to save encounter draft');
    }
    return response.data.data;
  },

  /**
   * Finalize and complete clinical encounter
   */
  async completeEncounter(
    encounterId: string,
    data?: UpdateEncounterDto
  ): Promise<EncounterDetailDto> {
    const response = await apiClient.post<ApiResponse<EncounterDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.ENCOUNTERS}/${encounterId}/complete`,
      data || {}
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to finalize clinical encounter');
    }
    return response.data.data;
  },

  /**
   * Fetch patient longitudinal clinical history
   */
  async getPatientClinicalHistory(patientId: string): Promise<PatientClinicalHistoryDto> {
    const response = await apiClient.get<ApiResponse<PatientClinicalHistoryDto>>(
      API_ENDPOINTS.DOCTORS.PATIENT_CLINICAL_HISTORY(patientId)
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch patient clinical history');
    }
    return response.data.data;
  },

  /* ==========================================================================
     E-PRESCRIPTION & MEDICATION CATALOG ENDPOINTS
     ========================================================================== */

  /**
   * Fetch doctor's prescription summary counts
   */
  async getPrescriptionSummaryCounts(): Promise<DoctorPrescriptionSummaryDto> {
    const response = await apiClient.get<ApiResponse<DoctorPrescriptionSummaryDto>>(
      API_ENDPOINTS.DOCTORS.PRESCRIPTIONS_SUMMARY
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch prescription summary');
    }
    return response.data.data;
  },

  /**
   * Fetch paginated list of doctor's prescriptions
   */
  async getPrescriptions(
    params: PrescriptionFilterQueryDto = {}
  ): Promise<{ items: PrescriptionListItemDto[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.patientId) query.append('patientId', params.patientId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const queryString = query.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.DOCTORS.PRESCRIPTIONS}?${queryString}`
      : API_ENDPOINTS.DOCTORS.PRESCRIPTIONS;

    const response = await apiClient.get<ApiResponse<PrescriptionListItemDto[]>>(endpoint);
    return {
      items: response.data.data || [],
      meta: (response.data.meta as unknown as PaginationMeta) || {
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetch prescription details by ID
   */
  async getPrescriptionById(prescriptionId: string): Promise<PrescriptionDetailDto> {
    const response = await apiClient.get<ApiResponse<PrescriptionDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.PRESCRIPTIONS}/${prescriptionId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch prescription details');
    }
    return response.data.data;
  },

  /**
   * Create a new prescription (Draft or direct issuance)
   */
  async createPrescription(data: CreateDoctorPrescriptionDto): Promise<PrescriptionDetailDto> {
    const response = await apiClient.post<ApiResponse<PrescriptionDetailDto>>(
      API_ENDPOINTS.DOCTORS.PRESCRIPTIONS,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to create prescription');
    }
    return response.data.data;
  },

  /**
   * Update draft prescription
   */
  async updatePrescription(
    prescriptionId: string,
    data: UpdateDoctorPrescriptionDto
  ): Promise<PrescriptionDetailDto> {
    const response = await apiClient.patch<ApiResponse<PrescriptionDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.PRESCRIPTIONS}/${prescriptionId}`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to update prescription draft');
    }
    return response.data.data;
  },

  /**
   * Finalize and issue prescription
   */
  async issuePrescription(
    prescriptionId: string,
    data: IssuePrescriptionDto
  ): Promise<PrescriptionDetailDto> {
    const response = await apiClient.post<ApiResponse<PrescriptionDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.PRESCRIPTIONS}/${prescriptionId}/issue`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to issue prescription');
    }
    return response.data.data;
  },

  /**
   * Discontinue an active issued prescription
   */
  async discontinuePrescription(
    prescriptionId: string,
    data: DiscontinuePrescriptionDto
  ): Promise<PrescriptionDetailDto> {
    const response = await apiClient.post<ApiResponse<PrescriptionDetailDto>>(
      `${API_ENDPOINTS.DOCTORS.PRESCRIPTIONS}/${prescriptionId}/discontinue`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to discontinue prescription');
    }
    return response.data.data;
  },

  /**
   * Fetch digital prescription document representation
   */
  async getPrescriptionDocument(prescriptionId: string): Promise<{
    prescription: PrescriptionDetailDto;
    facility?: any;
    doctorRegistration?: string;
    generatedAt: string;
    watermarkText?: string;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${API_ENDPOINTS.DOCTORS.PRESCRIPTIONS}/${prescriptionId}/document`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch prescription document');
    }
    return response.data.data;
  },

  /**
   * Search medication catalog
   */
  async searchMedicationCatalog(
    params: MedicationCatalogFilterQueryDto = {}
  ): Promise<{ items: MedicationCatalogItemDto[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.dosageForm && params.dosageForm !== 'ALL') query.append('dosageForm', params.dosageForm);
    if (params.therapeuticClass && params.therapeuticClass !== 'ALL') query.append('therapeuticClass', params.therapeuticClass);

    const queryString = query.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.MEDICATION_CATALOG}?${queryString}`
      : API_ENDPOINTS.MEDICATION_CATALOG;

    const response = await apiClient.get<ApiResponse<MedicationCatalogItemDto[]>>(endpoint);
    return {
      items: response.data.data || [],
      meta: (response.data.meta as unknown as PaginationMeta) || {
        total: 0,
        page: params.page || 1,
        limit: params.limit || 20,
        totalPages: 1,
      },
    };
  },

  /**
   * Get single medication catalog item
   */
  async getMedicationCatalogById(medicationId: string): Promise<MedicationCatalogItemDto> {
    const response = await apiClient.get<ApiResponse<MedicationCatalogItemDto>>(
      `${API_ENDPOINTS.MEDICATION_CATALOG}/${medicationId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch medication from catalog');
    }
    return response.data.data;
  },
};
