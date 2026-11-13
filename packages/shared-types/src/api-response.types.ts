/**
 * Standard API Response Contracts for HealthBridge India
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ApiErrorDetail[];
  timestamp: string;
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

