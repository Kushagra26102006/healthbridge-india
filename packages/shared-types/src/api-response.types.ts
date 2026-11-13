/**
 * Standard API Response Contracts for HealthBridge India
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta | Record<string, unknown>;
  code?: string;
  requestId?: string;
  errors?: ApiErrorDetail[];
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  requestId: string;
  errors?: ApiErrorDetail[];
  timestamp?: string;
}

export interface HealthCheckData {
  application: string;
  environment: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'connecting' | 'uninitialized';
      latencyMs?: number;
    };
  };
}

export type HealthCheckResponse = ApiResponse<HealthCheckData>;
