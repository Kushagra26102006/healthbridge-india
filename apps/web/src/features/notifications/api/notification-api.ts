import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  NotificationDto,
  NotificationFilterDto,
  NotificationUnreadCountDto,
  UserNotificationPreferencesDto,
  UpdateUserNotificationPreferencesDto,
  NotificationDeliveryDto,
  NotificationCategory,
} from '@healthbridge/shared-types';

export const notificationApi = {
  /**
   * Fetch paginated user notifications
   */
  async getNotifications(filter?: NotificationFilterDto): Promise<{
    items: NotificationDto[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filter?.page) params.append('page', String(filter.page));
    if (filter?.limit) params.append('limit', String(filter.limit));
    if (filter?.category && filter.category !== 'ALL') params.append('category', filter.category);
    if (filter?.unreadOnly !== undefined) params.append('unreadOnly', String(filter.unreadOnly));
    if (filter?.search) params.append('search', filter.search);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<
      ApiResponse<{
        items: NotificationDto[];
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`${API_ENDPOINTS.NOTIFICATIONS.ROOT}${query}`);
    return res.data.data!;
  },

  /**
   * Get unread notification counts
   */
  async getUnreadCount(): Promise<NotificationUnreadCountDto> {
    const res = await apiClient.get<ApiResponse<NotificationUnreadCountDto>>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
    );
    return res.data.data!;
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string): Promise<NotificationDto> {
    const res = await apiClient.patch<ApiResponse<NotificationDto>>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
    );
    return res.data.data!;
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(category?: NotificationCategory): Promise<{ modifiedCount: number }> {
    const query = category ? `?category=${category}` : '';
    const res = await apiClient.post<ApiResponse<{ modifiedCount: number }>>(
      `${API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}${query}`
    );
    return res.data.data!;
  },

  /**
   * Delete / dismiss notification
   */
  async deleteNotification(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      API_ENDPOINTS.NOTIFICATIONS.DELETE(id)
    );
    return res.data.data!;
  },

  /**
   * Get user communication & notification preferences
   */
  async getPreferences(): Promise<UserNotificationPreferencesDto> {
    const res = await apiClient.get<ApiResponse<UserNotificationPreferencesDto>>(
      API_ENDPOINTS.NOTIFICATIONS.PREFERENCES
    );
    return res.data.data!;
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    dto: UpdateUserNotificationPreferencesDto
  ): Promise<UserNotificationPreferencesDto> {
    const res = await apiClient.put<ApiResponse<UserNotificationPreferencesDto>>(
      API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
      dto
    );
    return res.data.data!;
  },

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<UserNotificationPreferencesDto> {
    const res = await apiClient.post<ApiResponse<UserNotificationPreferencesDto>>(
      API_ENDPOINTS.NOTIFICATIONS.PREFERENCES_RESET
    );
    return res.data.data!;
  },

  /**
   * Fetch delivery history
   */
  async getDeliveryHistory(limit = 50): Promise<NotificationDeliveryDto[]> {
    const res = await apiClient.get<ApiResponse<NotificationDeliveryDto[]>>(
      `${API_ENDPOINTS.NOTIFICATIONS.DELIVERY_HISTORY}?limit=${limit}`
    );
    return res.data.data!;
  },
};
