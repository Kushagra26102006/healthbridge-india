import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { handleAxiosError } from './error-handler';
import { tokenManager } from './token-manager';
import type { ApiResponse, AuthResponseData } from '@healthbridge/shared-types';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Secure cross-origin HttpOnly cookie propagation
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Outgoing Request Interceptor: Injects cryptographic X-Request-Id & Bearer Authorization Header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Generate correlation ID if not present
    if (config.headers && !config.headers['X-Request-Id']) {
      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `req-client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      config.headers['X-Request-Id'] = generatedId;
    }

    // 2. Attach in-memory JWT Access Token if held and not already explicitly set
    const token = tokenManager.getAccessToken();
    if (token && config.headers && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(handleAxiosError(error as AxiosError<ApiResponse>));
  }
);

// Single-flight refresh mutex to prevent concurrent token refresh storms
let refreshPromise: Promise<string | null> | null = null;

async function executeTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // POST to /auth/refresh with withCredentials to send HTTP-only refresh cookie
      const response = await axios.post<ApiResponse<AuthResponseData>>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const refreshedAccessToken = response.data?.data?.tokens?.accessToken || null;
      if (refreshedAccessToken) {
        tokenManager.setAccessToken(refreshedAccessToken);
      }
      return refreshedAccessToken;
    } catch (error) {
      tokenManager.clearAccessToken();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Response Interceptor: Centralized error normalization & token refresh single-flight rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

    // Do not attempt refresh on authentication endpoints (prevents recursion loops)
    const requestUrl = originalRequest?.url || '';
    const isAuthRoute =
      requestUrl.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH);

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await executeTokenRefresh();
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        tokenManager.clearAccessToken();
        const normalizedRefreshErr = handleAxiosError(refreshErr as AxiosError<ApiResponse>);
        return Promise.reject(normalizedRefreshErr);
      }
    }

    return Promise.reject(handleAxiosError(error));
  }
);

export default apiClient;
