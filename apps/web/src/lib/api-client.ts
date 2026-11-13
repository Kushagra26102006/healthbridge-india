import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@healthbridge/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for auth token injection if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If client-side token is in localStorage, inject into Authorization header
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hb_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const customMessage =
      error.response?.data?.message || error.message || 'An unexpected network error occurred';

    return Promise.reject(new Error(customMessage));
  }
);

export default apiClient;

