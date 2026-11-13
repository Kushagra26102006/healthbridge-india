import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { handleAxiosError } from './error-handler';
import { ApiClientError } from './types';
import type { ApiResponse } from '@healthbridge/shared-types';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Secure HttpOnly cookie propagation
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Outgoing Request Interceptor: Injects cryptographic X-Request-Id tracing
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Generate correlation ID if not present
    if (config.headers && !config.headers['X-Request-Id']) {
      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `req-client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      config.headers['X-Request-Id'] = generatedId;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(handleAxiosError(error as AxiosError<ApiResponse>));
  }
);

// Token Refresh Concurrency Queue & Loop Guard
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: ApiClientError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor: Centralized error normalization & token refresh rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

    // Do not attempt refresh on auth endpoints (login, register, refresh itself)
    const isAuthRoute =
      originalRequest?.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      originalRequest?.url?.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      originalRequest?.url?.includes(API_ENDPOINTS.AUTH.REFRESH);

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue concurrent requests while refresh is in-flight to prevent refresh storm
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token endpoint rotates refresh token and updates HTTP-only access cookie
        await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        const normalizedRefreshErr = handleAxiosError(refreshErr as AxiosError<ApiResponse>);
        processQueue(normalizedRefreshErr);
        return Promise.reject(normalizedRefreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(handleAxiosError(error));
  }
);

export default apiClient;
