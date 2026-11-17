/**
 * HealthBridge India — ABDM Integration Admin API Client (Day 7 Task 01)
 * Never receives or exposes credentials or secret keys.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AbdmIntegrationStatusDashboardDto,
} from '@healthbridge/shared-types';

export const abdmApi = {
  async getIntegrationStatus(): Promise<AbdmIntegrationStatusDashboardDto> {
    const res = await apiClient.get<ApiResponse<AbdmIntegrationStatusDashboardDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.STATUS
    );
    return res.data.data!;
  },
};
