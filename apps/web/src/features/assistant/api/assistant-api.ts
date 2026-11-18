import { apiClient } from '@/lib/api-client';

export interface AssistantActionLinkDto {
  label: string;
  href: string;
}

export interface AssistantReplyDto {
  reply: string;
  category: string;
  isEmergency: boolean;
  actions: AssistantActionLinkDto[];
  suggestions: string[];
  disclaimer: string;
  timestamp: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const assistantApi = {
  async sendMessage(message: string, pathname?: string): Promise<AssistantReplyDto> {
    const response = await apiClient.post<ApiEnvelope<AssistantReplyDto>>('/assistant/chat', {
      message,
      pathname,
    });
    return response.data.data;
  },
};
