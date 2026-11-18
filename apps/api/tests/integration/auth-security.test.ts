import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { authRoutes } from '../../src/modules/auth/routes/auth.routes';
import { errorHandler } from '../../src/middleware/error-handler';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { authService } from '../../src/modules/auth/services/auth.service';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { VerificationTokenModel } from '../../src/modules/auth/models/verification-token.model';
import { ErrorCode } from '../../src/shared/errors/error-codes';
import { AppError } from '../../src/shared/errors/app-error';

describe('Authentication & Security Audit Integration Tests', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. REGISTRATION WORKFLOW & SECURITY BOUNDARIES
  describe('Registration Security Controls', () => {
    it('should reject public ADMIN registration attempt without administrative key (422)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Intruder Admin',
        email: 'admin.intruder@healthbridge.test',
        phone: '9876543210',
        password: 'StrongPassword#2026',
        confirmPassword: 'StrongPassword#2026',
        role: 'ADMIN',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(JSON.stringify(res.body).toLowerCase()).toContain('administrative key');
    });

    it('should reject registration when password and confirmPassword mismatch (422)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Patient Test',
        email: 'patient.mismatch@healthbridge.test',
        phone: '9876543210',
        password: 'StrongPassword#2026',
        confirmPassword: 'DifferentPassword#2026',
        role: 'PATIENT',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(JSON.stringify(res.body)).toContain('Passwords do not match');
    });

    it('should reject registration with invalid 10-digit Indian mobile number (422)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Invalid Phone User',
        email: 'user.invalidphone@healthbridge.test',
        phone: '1234567890', // Invalid starting digit
        password: 'StrongPassword#2026',
        confirmPassword: 'StrongPassword#2026',
        role: 'PATIENT',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(JSON.stringify(res.body)).toContain('valid 10-digit Indian mobile number');
    });

    it('should reject registration with weak password (missing special char / uppercase) (422)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Weak Password User',
        email: 'weakpass@healthbridge.test',
        phone: '9876543210',
        password: 'weakpassword123',
        confirmPassword: 'weakpassword123',
        role: 'PATIENT',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should reject duplicate email registration with 409 CONFLICT', async () => {
      vi.spyOn(authService, 'register').mockRejectedValueOnce(
        AppError.conflict('An account with this email address already exists')
      );

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Duplicate Patient',
        email: 'existing@healthbridge.test',
        phone: '9876543210',
        password: 'StrongPassword#2026',
        confirmPassword: 'StrongPassword#2026',
        role: 'PATIENT',
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ErrorCode.CONFLICT);
      expect(res.body.message).toContain('already exists');
    });
  });

  // 2. LOGIN SECURITY & RESILIENCE
  describe('Login Security Controls', () => {
    it('should reject login with missing fields (422)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should reject invalid credentials with generic 401 UNAUTHORIZED message', async () => {
      vi.spyOn(authService, 'login').mockRejectedValueOnce(
        AppError.unauthorized('Invalid email or password')
      );

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'doctor@healthbridge.test',
        password: 'WrongPassword#2026',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
      // Ensure specific database fields or stack traces are not leaked
      expect(res.body.message).toBe('Invalid email or password');
      expect(res.body).not.toHaveProperty('stack');
    });

    it('should reject login for suspended account with 403 FORBIDDEN', async () => {
      vi.spyOn(authService, 'login').mockRejectedValueOnce(
        AppError.forbidden('Your account is currently suspended. Please contact support.')
      );

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'suspended@healthbridge.test',
        password: 'StrongPassword#2026',
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
      expect(res.body.message).toContain('suspended');
    });
  });

  // 3. SESSION COOKIE & TOKEN SECURITY
  describe('Session Cookie Attributes & Token Lifecycle', () => {
    it('should return Set-Cookie with HttpOnly and SameSite attributes on successful login', async () => {
      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: {
          id: 'user-123',
          name: 'Test Doctor',
          email: 'doctor@healthbridge.test',
          phone: '9876543210',
          role: 'DOCTOR',
          accountStatus: 'ACTIVE',
          emailVerified: true,
          phoneVerified: true,
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock-access-token-jwt',
          refreshToken: 'mock-refresh-token-uuid',
          expiresIn: 900,
          tokenType: 'Bearer',
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'doctor@healthbridge.test',
        password: 'StrongPassword#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBe('mock-access-token-jwt');

      // Verify Set-Cookie headers contain HttpOnly, SameSite, and custom cookie names
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('hb_refresh_token');
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr.toLowerCase()).toContain('samesite=lax');
      expect(cookieStr).toContain('Path=/');
    });

    it('should clear refresh cookie upon logout', async () => {
      vi.spyOn(authService, 'logout').mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', ['hb_refresh_token=mock-active-refresh-token']);

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('hb_refresh_token=;');
      expect(cookieStr).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });

    it('should reject expired access token with 401 UNAUTHORIZED', async () => {
      // Create a mock token
      const expiredToken = tokenService.generateAccessToken({
        _id: 'mock-patient-id',
        role: 'PATIENT',
        email: 'patient@healthbridge.test',
      } as any);

      // Verify token verification rejects expired tokens
      vi.spyOn(tokenService, 'verifyAccessToken').mockImplementation(() => {
        throw AppError.unauthorized('Access token has expired', ErrorCode.UNAUTHORIZED);
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(res.body.message).toContain('expired');
    });
  });

  // 4. PASSWORD RECOVERY & EMAIL VERIFICATION SECURITY
  describe('Password Recovery & Verification Workflows', () => {
    it('should accept forgot-password request with valid email and return generic confirmation', async () => {
      vi.spyOn(authService, 'forgotPassword').mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'user@healthbridge.test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('password reset instructions');
    });

    it('should reject reset-password when passwords mismatch (422)', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: 'valid-reset-token',
        password: 'NewPassword#2026',
        confirmPassword: 'MismatchPassword#2026',
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should reject reset-password with invalid or expired token (400)', async () => {
      vi.spyOn(authService, 'resetPassword').mockRejectedValueOnce(
        AppError.badRequest('Invalid or expired password reset token')
      );

      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: 'expired-or-tampered-token',
        password: 'NewPassword#2026',
        confirmPassword: 'NewPassword#2026',
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.BAD_REQUEST);
      expect(res.body.message).toContain('Invalid or expired');
    });

    it('should reject verify-email with invalid token (400)', async () => {
      vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
        AppError.badRequest('Invalid or expired verification token')
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'bogus-token' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.BAD_REQUEST);
    });

    it('should correctly evaluate token expiration in VerificationTokenModel', () => {
      const expiredModel = new VerificationTokenModel({
        userId: '507f1f77bcf86cd799439011',
        tokenHash: 'sample-hash-1',
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      });

      expect(expiredModel.isExpired()).toBe(true);
      expect(expiredModel.isValid()).toBe(false);

      const activeModel = new VerificationTokenModel({
        userId: '507f1f77bcf86cd799439011',
        tokenHash: 'sample-hash-2',
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour in future
      });

      expect(activeModel.isExpired()).toBe(false);
      expect(activeModel.isValid()).toBe(true);
    });
  });
});
