import type {
  UserRole,
  AccountStatus,
  UserPublicDto,
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseData,
} from '@healthbridge/shared-types';

export type {
  UserRole,
  AccountStatus,
  UserPublicDto,
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseData,
};

export interface AuthState {
  user: UserPublicDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}
