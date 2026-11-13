import { apiClient } from '@/lib/api-client';
import type {
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseData,
  UserPublicDto,
  ApiResponse,
  ResetPasswordRequestDto,
} from '@healthbridge/shared-types';

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequestDto): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  },

  /**
   * Authenticate user with Email or Phone
   */
  async login(data: LoginRequestDto): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  /**
   * Refresh active session (uses HTTP-only cookie automatically)
   */
  async refresh(): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/refresh');
    if (!response.data.data) {
      throw new Error('Failed to refresh token');
    }
    return response.data.data;
  },

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    await apiClient.post('/auth/logout-all');
  },

  /**
   * Fetch current authenticated user context
   */
  async getMe(): Promise<{ user: UserPublicDto; profile: unknown }> {
    const response = await apiClient.get<ApiResponse<{ user: UserPublicDto; profile: unknown }>>(
      '/auth/me'
    );
    if (!response.data.data) {
      throw new Error('No user session active');
    }
    return response.data.data;
  },

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return response.data.message || 'Reset link requested';
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequestDto): Promise<string> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', data);
    return response.data.message || 'Password reset successful';
  },
};

