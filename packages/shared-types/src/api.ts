/**
 * Standard API Contracts for HealthBridge India
 */
export * from './api-response.types';

export interface ApiPaginationQuery {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ApiStatusCheck {
  isOperational: boolean;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}
