import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  PatientDashboardSummaryDto,
  PatientProfileDto,
  UpdatePatientProfileDto,
  ChangePasswordDto,
  UserSessionItemDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
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
   * Fetch complete profile for the authenticated patient
   */
  async getProfile(): Promise<PatientProfileDto> {
    const response = await apiClient.get<ApiResponse<PatientProfileDto>>(
      API_ENDPOINTS.PATIENTS.PROFILE
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch patient profile');
    }
    return response.data.data;
  },

  /**
   * Update permitted personal information
   */
  async updateProfile(data: UpdatePatientProfileDto): Promise<PatientProfileDto> {
    const response = await apiClient.patch<ApiResponse<PatientProfileDto>>(
      API_ENDPOINTS.PATIENTS.PROFILE,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to update patient profile');
    }
    return response.data.data;
  },

  /**
   * Change account password
   */
  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.PATIENTS.CHANGE_PASSWORD,
      data
    );
    return { message: response.data.message || 'Password changed successfully' };
  },

  /**
   * Fetch active sessions for user
   */
  async getSessions(): Promise<UserSessionItemDto[]> {
    const response = await apiClient.get<ApiResponse<UserSessionItemDto[]>>(
      API_ENDPOINTS.PATIENTS.SESSIONS
    );
    if (!response.data.data) {
      return [];
    }
    return response.data.data;
  },

  /**
   * Revoke individual session by ID
   */
  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `${API_ENDPOINTS.PATIENTS.SESSIONS}/${sessionId}`
    );
    return { message: response.data.message || 'Session revoked successfully' };
  },

  /**
   * Revoke all other active sessions except current
   */
  async revokeOtherSessions(): Promise<{ message: string; count: number }> {
    const response = await apiClient.post<ApiResponse<{ message: string; count: number }>>(
      API_ENDPOINTS.PATIENTS.REVOKE_OTHERS
    );
    return response.data.data || { message: 'Other sessions revoked', count: 0 };
  },

  /**
   * Fetch notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferencesDto> {
    const response = await apiClient.get<ApiResponse<NotificationPreferencesDto>>(
      API_ENDPOINTS.PATIENTS.NOTIFICATION_PREFERENCES
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch notification preferences');
    }
    return response.data.data;
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    data: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferencesDto> {
    const response = await apiClient.patch<ApiResponse<NotificationPreferencesDto>>(
      API_ENDPOINTS.PATIENTS.NOTIFICATION_PREFERENCES,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to update notification preferences');
    }
    return response.data.data;
  },
};

export default patientApi;
