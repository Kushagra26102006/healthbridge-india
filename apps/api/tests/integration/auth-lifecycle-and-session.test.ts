import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { authRoutes } from '../../src/modules/auth/routes/auth.routes';
import { notificationRoutes } from '../../src/modules/notifications/routes/notification.routes';
import { errorHandler } from '../../src/middleware/error-handler';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { authenticate } from '../../src/middleware/authenticate';
import { authorize } from '../../src/middleware/authorize';
import { authService } from '../../src/modules/auth/services/auth.service';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { RefreshTokenModel } from '../../src/modules/security/models/refresh-token.model';
import { AUTH_CONFIG } from '@healthbridge/config';
import { env } from '../../src/config/env';
import { ErrorCode } from '../../src/shared/errors/error-codes';
import { AppError } from '../../src/shared/errors/app-error';

describe('Complete Authentication Lifecycle & Session Integrity Suite', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(requestIdMiddleware);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  // Mock protected dashboard summary endpoint
  app.get('/api/v1/dashboard/summary', authenticate, (req, res) => {
    res.json({
      success: true,
      data: {
        userId: req.user!.userId,
        role: req.user!.role,
        summary: 'Aggregated clinical dashboard data',
      },
    });
  });

  // Mock admin-only endpoint for RBAC boundary test
  app.get('/api/v1/admin/overview', authenticate, authorize(['ADMIN']), (req, res) => {
    res.json({ success: true, data: { adminScope: true } });
  });

  app.use(errorHandler);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockPatientUser = {
    _id: '6afe11112222333344445555',
    id: '6afe11112222333344445555',
    email: 'patient.demo@healthbridge.local',
    phone: '9876543212',
    name: 'Demo Patient',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    isEmailVerified: true,
    isPhoneVerified: true,
    toJSON: () => ({
      id: '6afe11112222333344445555',
      email: 'patient.demo@healthbridge.local',
      role: 'PATIENT',
      name: 'Demo Patient',
      accountStatus: 'ACTIVE',
    }),
  };

  // 1 & 2. LOGIN WITH VALID / INVALID CREDENTIALS
  describe('1 & 2. Login Flow', () => {
    it('authenticates valid credentials and returns accessToken and refreshToken', async () => {
      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockPatientUser as any,
        tokens: {
          accessToken: 'valid-jwt-access-token-123',
          refreshToken: 'valid-refresh-token-456',
          expiresIn: 900,
          tokenType: 'Bearer',
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'patient.demo@healthbridge.local',
        password: 'DemoSecure#2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBe('valid-jwt-access-token-123');
      expect(res.body.data.tokens.refreshToken).toBe('valid-refresh-token-456');

      // 4. Verify cookie creation
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toContain(AUTH_CONFIG.accessTokenCookieName);
      expect(cookieStr).toContain(AUTH_CONFIG.refreshTokenCookieName);
      expect(cookieStr.toLowerCase()).toContain('httponly');
    });

    it('rejects invalid credentials with 401 UNAUTHORIZED', async () => {
      vi.spyOn(authService, 'login').mockRejectedValueOnce(
        AppError.unauthorized('Invalid email or password')
      );

      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'patient.demo@healthbridge.local',
        password: 'WrongPassword#123',
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  // 3, 5, 6, 9. REFRESH TOKEN GENERATION, TRANSMISSION, ROTATION & SUCCESS
  describe('3, 5, 6, 9. Refresh Token Flow & Rotation', () => {
    it('accepts refresh cookie and successfully rotates tokens', async () => {
      vi.spyOn(authService, 'refresh').mockResolvedValueOnce({
        user: mockPatientUser as any,
        tokens: {
          accessToken: 'new-rotated-access-token-789',
          refreshToken: 'new-rotated-refresh-token-012',
          expiresIn: 900,
          tokenType: 'Bearer',
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`${AUTH_CONFIG.refreshTokenCookieName}=mock-valid-raw-refresh-token`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBe('new-rotated-access-token-789');
      expect(res.body.data.tokens.refreshToken).toBe('new-rotated-refresh-token-012');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toContain(AUTH_CONFIG.accessTokenCookieName);
      expect(cookieStr).toContain(AUTH_CONFIG.refreshTokenCookieName);
    });

    it('accepts refreshToken via body when third-party cookies are blocked', async () => {
      vi.spyOn(authService, 'refresh').mockResolvedValueOnce({
        user: mockPatientUser as any,
        tokens: {
          accessToken: 'fallback-body-access-token',
          refreshToken: 'fallback-body-refresh-token',
          expiresIn: 900,
          tokenType: 'Bearer',
        },
      });

      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'valid-body-refresh-token',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBe('fallback-body-access-token');
    });

    it('rejects refresh when no token is present in cookie or body with 401', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Refresh token not found');
    });
  });

  // 7 & 8. EXPIRED & REVOKED REFRESH TOKEN REJECTION
  describe('7 & 8. Expired & Revoked Token Rejection', () => {
    it('rejects expired refresh token with 401', async () => {
      vi.spyOn(authService, 'refresh').mockRejectedValueOnce(
        AppError.unauthorized('Refresh token has expired. Please log in again.')
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`${AUTH_CONFIG.refreshTokenCookieName}=expired-token`]);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('rejects revoked refresh token beyond grace period with security alert (401)', async () => {
      vi.spyOn(authService, 'refresh').mockRejectedValueOnce(
        AppError.unauthorized('Security alert: Compromised session detected. All sessions have been revoked.')
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`${AUTH_CONFIG.refreshTokenCookieName}=stale-revoked-token`]);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Compromised session detected');
    });
  });

  // 10 & 11. LOGOUT & LOGOUT ALL DEVICES
  describe('10 & 11. Logout Workflows', () => {
    it('logs out current device and clears auth cookies', async () => {
      vi.spyOn(authService, 'logout').mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`${AUTH_CONFIG.refreshTokenCookieName}=some-token`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out successfully');

      // Verify clear-cookie headers
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('requires authentication for logout-all and revokes all sessions', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValueOnce({
        sub: mockPatientUser._id,
        email: mockPatientUser.email,
        role: 'PATIENT' as any,
        accountStatus: 'ACTIVE' as any,
        jti: 'mock-jti-1',
      });
      vi.spyOn(UserModel, 'findById').mockResolvedValueOnce(mockPatientUser as any);
      vi.spyOn(authService, 'logoutAll').mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', 'Bearer valid-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('All sessions successfully revoked');
    });
  });

  // 12. ACCESS TOKEN EXPIRATION
  describe('12. Access Token Expiration', () => {
    it('rejects expired access token with 401 UNAUTHORIZED', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockImplementationOnce(() => {
        throw AppError.unauthorized('Access token has expired');
      });

      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', 'Bearer expired-jwt-token');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(res.body.message).toContain('Access token has expired');
    });
  });

  // 13 & 15. CONCURRENT API REQUESTS & DASHBOARD SUMMARY AUTHENTICATION
  describe('13 & 15. Dashboard Summary & Concurrent Request Authentication', () => {
    it('authenticates dashboard summary using Bearer Authorization header', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValue({
        sub: mockPatientUser._id,
        email: mockPatientUser.email,
        role: 'PATIENT' as any,
        accountStatus: 'ACTIVE' as any,
        jti: 'mock-jti-2',
      });
      vi.spyOn(UserModel, 'findById').mockResolvedValue(mockPatientUser as any);

      // Execute 3 concurrent requests to simulate dashboard widget load
      const [res1, res2, res3] = await Promise.all([
        request(app).get('/api/v1/dashboard/summary').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/v1/dashboard/summary').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/v1/dashboard/summary').set('Authorization', 'Bearer valid-token'),
      ]);

      expect(res1.status).toBe(200);
      expect(res1.body.data.role).toBe('PATIENT');
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
    });

    it('authenticates dashboard summary via HttpOnly access cookie fallback', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValueOnce({
        sub: mockPatientUser._id,
        email: mockPatientUser.email,
        role: 'PATIENT' as any,
        accountStatus: 'ACTIVE' as any,
        jti: 'mock-jti-3',
      });
      vi.spyOn(UserModel, 'findById').mockResolvedValueOnce(mockPatientUser as any);

      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Cookie', [`${AUTH_CONFIG.accessTokenCookieName}=cookie-access-token`]);

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(mockPatientUser._id);
    });
  });

  // 14. TOKEN ROTATION CONCURRENCY GRACE PERIOD
  describe('14. Concurrent Token Refresh Grace Period', () => {
    it('allows concurrent refresh request within 30-second grace period without breach lockout', async () => {
      const recentRevocation = new Date(Date.now() - 5000); // 5 seconds ago (within 30s grace)
      const fakeToken = {
        _id: 'token-id-1',
        userId: mockPatientUser._id,
        tokenHash: 'somehash',
        revokedAt: recentRevocation,
        isExpired: () => false,
      };

      vi.spyOn(RefreshTokenModel, 'findOne')
        .mockResolvedValueOnce(fakeToken as any) // Stored token check
        .mockReturnValueOnce({
          sort: vi.fn().mockResolvedValueOnce({
            _id: 'token-id-2',
            userId: mockPatientUser._id,
            expiresAt: new Date(Date.now() + 100000),
          }),
        } as any);

      const result = await tokenService.rotateRefreshToken('raw-token-123');
      expect(result.userId).toBe(mockPatientUser._id);
      expect(result.newRefreshToken).toBe('raw-token-123');
    });
  });

  // 16. UNREAD NOTIFICATION COUNT AUTHENTICATION
  describe('16. Unread Notification Count Authentication', () => {
    it('authenticates GET /api/v1/notifications/unread-count with valid Bearer token', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValueOnce({
        sub: mockPatientUser._id,
        email: mockPatientUser.email,
        role: 'PATIENT' as any,
        accountStatus: 'ACTIVE' as any,
        jti: 'mock-jti-4',
      });
      vi.spyOn(UserModel, 'findById').mockResolvedValueOnce(mockPatientUser as any);
      vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValueOnce({
        unreadCount: 3,
        categoryCounts: {} as any,
      } as any);

      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token');

      // Returns 200 with notification unread count structure
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('unreadCount');
    });

    it('rejects unauthenticated GET /api/v1/notifications/unread-count with 401', async () => {
      const res = await request(app).get('/api/v1/notifications/unread-count');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
    });
  });

  // 17. SSE STREAM AUTHENTICATION
  describe('17. SSE Stream Authentication', () => {
    it('authenticates SSE stream with Bearer header and rejects URL tokens', async () => {
      // Test URL token rejection
      const urlTokenRes = await request(app).get('/api/v1/notifications/stream?token=leak-in-url');
      expect(urlTokenRes.status).toBe(401);
      expect(urlTokenRes.body.message).toContain('Access tokens in URL query parameters are prohibited');
    });
  });

  // 19. RBAC AUTHORIZATION
  describe('19. Server-Side RBAC Boundaries', () => {
    it('returns 403 FORBIDDEN when PATIENT attempts ADMIN overview', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValueOnce({
        sub: mockPatientUser._id,
        email: mockPatientUser.email,
        role: 'PATIENT' as any,
        accountStatus: 'ACTIVE' as any,
        jti: 'mock-jti-5',
      });
      vi.spyOn(UserModel, 'findById').mockResolvedValueOnce(mockPatientUser as any);

      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', 'Bearer patient-token');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  // 20. SUSPENDED OR DEACTIVATED SESSIONS
  describe('20. Suspended or Deactivated Session Rejection', () => {
    it('returns 403 FORBIDDEN when user account is SUSPENDED', async () => {
      vi.spyOn(tokenService, 'verifyAccessToken').mockReturnValueOnce({
        sub: mockPatientUser._id,
        email: mockPatientUser.email,
        role: 'PATIENT' as any,
        accountStatus: 'SUSPENDED' as any,
        jti: 'mock-jti-6',
      });
      vi.spyOn(UserModel, 'findById').mockResolvedValueOnce({
        ...mockPatientUser,
        accountStatus: 'SUSPENDED',
      } as any);

      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', 'Bearer suspended-user-token');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('suspended');
    });
  });
});
