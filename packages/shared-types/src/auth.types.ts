import { UserRole, AccountStatus, UserPublicDto } from './user';

/**
 * HealthBridge India — Authentication DTO & JWT Payload Contracts
 */

export interface RegisterRequestDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  adminRegistrationKey?: string;
}

export interface LoginRequestDto {
  identifier: string; // Accepts normalized email or 10-digit mobile number
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken?: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequestDto {
  token: string;
}

export interface ResendVerificationRequestDto {
  email: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // in seconds (e.g. 900 for 15m)
  tokenType: 'Bearer';
}

export interface AuthResponseData {
  user: UserPublicDto;
  tokens: AuthTokensDto;
  message?: string;
}

export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  jti: string; // Unique token identifier
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  name: string;
}
