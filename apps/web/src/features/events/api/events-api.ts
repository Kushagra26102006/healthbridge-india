/**
 * HealthBridge India — Admin Event Observability & Controlled Recovery API Client (Day 8 Task 03)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  DomainEventOutboxDto,
  DomainEventSourceModule,
  DomainEventStatus,
  DomainEventType,
  EventAdminListResponseDto,
  EventHealthMetricsDto,
  EventReplayResponseDto,
} from '@healthbridge/shared-types';

export interface AdminEventListParams {
  search?: string;
  status?: DomainEventStatus;
  eventType?: DomainEventType;
  sourceModule?: DomainEventSourceModule;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  deadLetterOnly?: boolean;
}

export const eventsApi = {
  async getHealth(): Promise<EventHealthMetricsDto> {
    const res = await apiClient.get<ApiResponse<EventHealthMetricsDto>>(
      API_ENDPOINTS.EVENTS.HEALTH
    );
    return res.data.data!;
  },

  async listEvents(params: AdminEventListParams = {}): Promise<EventAdminListResponseDto> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && !params.deadLetterOnly) query.set('status', params.status);
    if (params.eventType) query.set('eventType', params.eventType);
    if (params.sourceModule) query.set('sourceModule', params.sourceModule);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const endpoint = params.deadLetterOnly
      ? API_ENDPOINTS.EVENTS.DEAD_LETTER
      : API_ENDPOINTS.EVENTS.ROOT;
    const qs = query.toString() ? `?${query.toString()}` : '';

    const res = await apiClient.get<ApiResponse<EventAdminListResponseDto>>(
      `${endpoint}${qs}`
    );
    return res.data.data!;
  },

  async getEventDetail(eventId: string): Promise<DomainEventOutboxDto> {
    const res = await apiClient.get<ApiResponse<DomainEventOutboxDto>>(
      API_ENDPOINTS.EVENTS.DETAIL(eventId)
    );
    return res.data.data!;
  },

  async retryEvent(eventId: string, reason: string): Promise<EventReplayResponseDto> {
    const res = await apiClient.post<ApiResponse<EventReplayResponseDto>>(
      API_ENDPOINTS.EVENTS.RETRY(eventId),
      { reason }
    );
    return res.data.data!;
  },
};
