import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  PatientDashboardSummaryDto,
  IPatientProfile,
  UserPublicDto,
} from '@healthbridge/shared-types';

export const patientApi = {
  /**
   * Fetch aggregated summary for the authenticated patient's dashboard
   */
  async getDashboardSummary(): Promise<PatientDashboardSummaryDto> {
    const response = await apiClient.get<ApiResponse<PatientDashboardSummaryDto>>(
      API_ENDPOINTS.PATIENTS.DASHBOARD_SUMMARY
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch patient dashboard summary');
    }
    return response.data.data;
  },

  /**
   * Fetch detailed profile for the authenticated patient
   */
  async getProfile(): Promise<{ user: UserPublicDto; profile: IPatientProfile | null }> {
    const response = await apiClient.get<
      ApiResponse<{ user: UserPublicDto; profile: IPatientProfile | null }>
    >(API_ENDPOINTS.PATIENTS.PROFILE);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch patient profile');
    }
    return response.data.data;
  },
};

export default patientApi;
