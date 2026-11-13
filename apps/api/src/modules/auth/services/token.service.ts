import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { AUTH_CONFIG } from '@healthbridge/config';
import { AppError } from '../../../shared/errors/app-error';
import { RefreshTokenModel } from '../../security/models/refresh-token.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { hashToken, generateRandomToken } from '../utils/crypto.util';
import { logger } from '../../../utils/logger';
import type { IUserDocument } from '../../users/models/user.model';
import type { JwtAccessPayload, DeviceInfo } from '@healthbridge/shared-types';

export class TokenService {
  /**
   * Generates a cryptographically signed short-lived JWT Access Token
   */
  generateAccessToken(user: IUserDocument): string {
    const payload: Omit<JwtAccessPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      jti: crypto.randomUUID(),
    };

    const signOptions: SignOptions = {
      expiresIn: (env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
      issuer: AUTH_CONFIG.tokenIssuer,
      audience: AUTH_CONFIG.tokenIssuer,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, signOptions);
  }

  /**
   * Verifies and decodes a JWT Access Token
   */
  verifyAccessToken(token: string): JwtAccessPayload {
    try {
      const verifyOptions: VerifyOptions = {
        issuer: AUTH_CONFIG.tokenIssuer,
        audience: AUTH_CONFIG.tokenIssuer,
      };

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, verifyOptions) as JwtAccessPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized('Invalid access token signature or format');
      }
      throw AppError.unauthorized('Authentication failed');
    }
  }

  /**
   * Generates a high-entropy Refresh Token and persists its SHA-256 hash in MongoDB
   */
  async createRefreshToken(userId: string, deviceInfo?: DeviceInfo): Promise<string> {
    const rawRefreshToken = generateRandomToken(40);
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshTokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo,
    });

    return rawRefreshToken;
  }

  /**
   * Rotates a Refresh Token with automatic REUSE DETECTION
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
    deviceInfo?: DeviceInfo,
    requestId?: string
  ): Promise<{ newRefreshToken: string; userId: string }> {
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshTokenModel.findOne({ tokenHash });

    if (!storedToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // --- REUSE DETECTION LOGIC ---
    if (storedToken.revokedAt) {
      logger.warn('SECURITY ALERT: Attempted reuse of previously revoked refresh token!', {
        userId: storedToken.userId.toString(),
        tokenHash: tokenHash.slice(0, 10) + '...',
      });

      // Revoke ALL tokens belonging to this user family to contain breach
      await RefreshTokenModel.updateMany(
        { userId: storedToken.userId, revokedAt: { $exists: false } },
        { revokedAt: new Date() }
      );

      // Log high-priority security audit event
      await AuditLogModel.create({
        actorId: storedToken.userId,
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        resourceType: 'AUTH',
        resourceId: storedToken._id.toString(),
        timestamp: new Date(),
        requestId: requestId || `sec-${Date.now()}`,
        outcome: 'BLOCKED',
        metadata: {
          alert: 'Breach containment: All active sessions revoked due to token replay attempt',
          clientIp: deviceInfo?.ipAddress,
        },
      });

      throw AppError.unauthorized(
        'Security alert: Compromised session detected. All sessions have been revoked.'
      );
    }

    // Check expiration
    if (storedToken.isExpired()) {
      throw AppError.unauthorized('Refresh token has expired. Please log in again.');
    }

    // Invalidate current refresh token
    storedToken.revokedAt = new Date();
    await storedToken.save();

    // Issue newly minted refresh token
    const newRefreshToken = await this.createRefreshToken(
      storedToken.userId.toString(),
      deviceInfo
    );

    return {
      newRefreshToken,
      userId: storedToken.userId.toString(),
    };
  }

  /**
   * Revokes a specific active refresh token (Logout single device)
   */
  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshTokenModel.updateOne({ tokenHash }, { revokedAt: new Date() });
  }

  /**
   * Revokes all active refresh tokens for a user (Logout all devices)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() }
    );
  }
}

export const tokenService = new TokenService();
