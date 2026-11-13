import bcryptjs from 'bcryptjs';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/errors/app-error';
import {
  UserModel,
  PatientProfileModel,
  DoctorProfileModel,
  PharmacyProfileModel,
  LaboratoryProfileModel,
  AdminProfileModel,
  AuditLogModel,
  VerificationTokenModel,
} from '../../../database/models';
import { tokenService } from './token.service';
import { notificationService } from './notification.service';
import { hashToken, generateRandomToken } from '../utils/crypto.util';
import type {
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseData,
  DeviceInfo,
  UserPublicDto,
} from '@healthbridge/shared-types';

export class AuthService {
  /**
   * User Registration with Role Profile Initialization
   */
  async register(
    dto: RegisterRequestDto,
    deviceInfo?: DeviceInfo,
    requestId?: string
  ): Promise<AuthResponseData> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.trim();

    // 1. Security Check: Restrict public ADMIN registration
    if (dto.role === 'ADMIN') {
      const isAuthorized =
        dto.adminRegistrationKey && dto.adminRegistrationKey === env.ADMIN_REGISTRATION_KEY;

      if (!isAuthorized) {
        throw AppError.forbidden('Public registration for the ADMIN role is restricted');
      }
    }

    // 2. Prevent duplicate accounts
    const existingUser = await UserModel.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw AppError.conflict('An account with this email address already exists');
      }
      throw AppError.conflict('An account with this mobile number already exists');
    }

    // 3. Hash password using bcrypt (10 rounds)
    const passwordHash = await bcryptjs.hash(dto.password, 10);

    // 4. Assign Account Status based on role verification requirements
    // Patients are ACTIVE immediately; Healthcare providers require credential verification
    const initialStatus = dto.role === 'PATIENT' ? 'ACTIVE' : 'PENDING';

    const user = await UserModel.create({
      name: dto.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: dto.role,
      accountStatus: initialStatus,
      emailVerified: false,
      phoneVerified: false,
    });

    // 5. Initialize Role-Specific Profile Document
    try {
      if (dto.role === 'PATIENT') {
        await PatientProfileModel.create({
          userId: user._id,
          dateOfBirth: new Date('2000-01-01'), // Default placeholder, updated during onboarding
          gender: 'OTHER',
          address: {
            city: 'Not specified',
            district: 'Not specified',
            state: 'Not specified',
            postalCode: '110001',
          },
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Other',
            phone: normalizedPhone,
          },
          abhaLinkageStatus: 'NOT_LINKED',
        });
      } else if (dto.role === 'DOCTOR') {
        await DoctorProfileModel.create({
          userId: user._id,
          registrationNumber: `PENDING-${user._id.toString().slice(-6).toUpperCase()}`,
          specialization: ['General Practice'],
          qualifications: ['MBBS (Pending Verification)'],
          experience: 0,
          verificationStatus: 'PENDING',
        });
      } else if (dto.role === 'PHARMACY') {
        await PharmacyProfileModel.create({
          userId: user._id,
          pharmacyLicenseNumber: `DL-PENDING-${user._id.toString().slice(-6).toUpperCase()}`,
          verificationStatus: 'PENDING',
        });
      } else if (dto.role === 'LABORATORY') {
        await LaboratoryProfileModel.create({
          userId: user._id,
          laboratoryLicenseNumber: `LAB-PENDING-${user._id.toString().slice(-6).toUpperCase()}`,
          verificationStatus: 'PENDING',
        });
      } else if (dto.role === 'ADMIN') {
        await AdminProfileModel.create({
          userId: user._id,
          administrativeLevel: 'HOSPITAL_ADMIN',
          permissions: ['VIEW_METRICS', 'MANAGE_USERS'],
        });
      }
    } catch (profileError) {
      // If profile creation fails, clean up created user to maintain integrity
      await UserModel.deleteOne({ _id: user._id });
      throw profileError;
    }

    // 6. Generate Email Verification Token
    const rawVerificationToken = generateRandomToken(32);
    await VerificationTokenModel.create({
      userId: user._id,
      tokenHash: hashToken(rawVerificationToken),
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    void notificationService.sendVerificationEmail(user.email, rawVerificationToken);

    // 7. Audit log
    await AuditLogModel.create({
      actorId: user._id,
      action: 'USER_REGISTRATION',
      resourceType: 'USER',
      resourceId: user._id.toString(),
      timestamp: new Date(),
      requestId: requestId || `req-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: {
        role: user.role,
        initialStatus: user.accountStatus,
      },
    });

    // 8. Generate Tokens if account is ACTIVE
    let accessToken = '';
    let refreshToken = '';

    if (user.accountStatus === 'ACTIVE') {
      accessToken = tokenService.generateAccessToken(user);
      refreshToken = await tokenService.createRefreshToken(user._id.toString(), deviceInfo);
    }

    return {
      user: user.toJSON() as unknown as UserPublicDto,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        tokenType: 'Bearer',
      },
      message:
        user.accountStatus === 'ACTIVE'
          ? 'Registration successful'
          : 'Registration submitted. Healthcare provider accounts require verification before full activation.',
    };
  }

  /**
   * User Authentication (supports Email or 10-digit Phone)
   */
  async login(
    dto: LoginRequestDto,
    deviceInfo?: DeviceInfo,
    requestId?: string
  ): Promise<AuthResponseData> {
    const rawIdentifier = dto.identifier.trim();
    const isEmail = /^\S+@\S+\.\S+$/.test(rawIdentifier);

    const query = isEmail ? { email: rawIdentifier.toLowerCase() } : { phone: rawIdentifier };

    // Find user with passwordHash included explicitly
    const user = await UserModel.findOne(query).select('+passwordHash');

    // Generic error to prevent user enumeration
    const invalidCredentialsError = AppError.unauthorized('Invalid email/phone or password');

    if (!user) {
      await AuditLogModel.create({
        action: 'USER_LOGIN_ATTEMPT',
        resourceType: 'AUTH',
        resourceId: rawIdentifier,
        timestamp: new Date(),
        requestId: requestId || `req-${Date.now()}`,
        outcome: 'FAILURE',
        metadata: { reason: 'User not found', ip: deviceInfo?.ipAddress },
      });
      throw invalidCredentialsError;
    }

    // Verify password hash
    const isMatch = await bcryptjs.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      await AuditLogModel.create({
        actorId: user._id,
        action: 'USER_LOGIN_ATTEMPT',
        resourceType: 'AUTH',
        resourceId: user._id.toString(),
        timestamp: new Date(),
        requestId: requestId || `req-${Date.now()}`,
        outcome: 'FAILURE',
        metadata: { reason: 'Incorrect password', ip: deviceInfo?.ipAddress },
      });
      throw invalidCredentialsError;
    }

    // Account status checks
    if (user.accountStatus === 'SUSPENDED') {
      await AuditLogModel.create({
        actorId: user._id,
        action: 'USER_LOGIN_BLOCKED',
        resourceType: 'AUTH',
        resourceId: user._id.toString(),
        timestamp: new Date(),
        requestId: requestId || `req-${Date.now()}`,
        outcome: 'BLOCKED',
        metadata: { reason: 'Account suspended' },
      });
      throw AppError.forbidden(
        'Your account has been suspended. Please contact HealthBridge support.'
      );
    }

    if (user.accountStatus === 'DEACTIVATED') {
      throw AppError.forbidden('This account has been deactivated.');
    }

    // Generate JWT access token & refresh token
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.createRefreshToken(user._id.toString(), deviceInfo);

    // Audit log successful login
    await AuditLogModel.create({
      actorId: user._id,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      timestamp: new Date(),
      requestId: requestId || `req-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: { ip: deviceInfo?.ipAddress, role: user.role },
    });

    return {
      user: user.toJSON() as unknown as UserPublicDto,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        tokenType: 'Bearer',
      },
    };
  }

  /**
   * Refresh Token Rotation
   */
  async refresh(
    rawRefreshToken: string,
    deviceInfo?: DeviceInfo,
    requestId?: string
  ): Promise<AuthResponseData> {
    const { newRefreshToken, userId } = await tokenService.rotateRefreshToken(
      rawRefreshToken,
      deviceInfo,
      requestId
    );

    const user = await UserModel.findById(userId);

    if (!user || user.accountStatus !== 'ACTIVE') {
      throw AppError.unauthorized('Account inactive or not found');
    }

    const accessToken = tokenService.generateAccessToken(user);

    return {
      user: user.toJSON() as unknown as UserPublicDto,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
        tokenType: 'Bearer',
      },
    };
  }

  /**
   * Logout from current device
   */
  async logout(rawRefreshToken?: string, userId?: string, requestId?: string): Promise<void> {
    if (rawRefreshToken) {
      await tokenService.revokeRefreshToken(rawRefreshToken);
    }

    if (userId) {
      await AuditLogModel.create({
        actorId: userId,
        action: 'USER_LOGOUT',
        resourceType: 'AUTH',
        resourceId: userId,
        timestamp: new Date(),
        requestId: requestId || `req-${Date.now()}`,
        outcome: 'SUCCESS',
      });
    }
  }

  /**
   * Logout from all devices (revoke all sessions)
   */
  async logoutAll(userId: string, requestId?: string): Promise<void> {
    await tokenService.revokeAllUserSessions(userId);

    await AuditLogModel.create({
      actorId: userId,
      action: 'USER_LOGOUT_ALL_SESSIONS',
      resourceType: 'AUTH',
      resourceId: userId,
      timestamp: new Date(),
      requestId: requestId || `req-${Date.now()}`,
      outcome: 'SUCCESS',
    });
  }

  /**
   * Forgot Password - generates secure one-time token (zero user enumeration)
   */
  async forgotPassword(email: string, requestId?: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (user && user.accountStatus === 'ACTIVE') {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);

      await VerificationTokenModel.create({
        userId: user._id,
        tokenHash,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      void notificationService.sendPasswordResetEmail(user.email, rawToken);

      await AuditLogModel.create({
        actorId: user._id,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'AUTH',
        resourceId: user._id.toString(),
        timestamp: new Date(),
        requestId: requestId || `req-${Date.now()}`,
        outcome: 'SUCCESS',
      });
    }
    // Always returns silently without error even if user not found (prevents enumeration)
  }

  /**
   * Reset Password with token validation and session revocation
   */
  async resetPassword(token: string, newPassword: string, requestId?: string): Promise<void> {
    const tokenHash = hashToken(token);

    const tokenRecord = await VerificationTokenModel.findOne({
      tokenHash,
      type: 'PASSWORD_RESET',
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      throw AppError.badRequest('Invalid or expired password reset token');
    }

    const user = await UserModel.findById(tokenRecord.userId);
    if (!user) {
      throw AppError.badRequest('User associated with this reset token not found');
    }

    // Update password hash
    user.passwordHash = await bcryptjs.hash(newPassword, 10);
    await user.save();

    // Mark token as used
    tokenRecord.usedAt = new Date();
    await tokenRecord.save();

    // Invalidate all active sessions across all devices
    await tokenService.revokeAllUserSessions(user._id.toString());

    await AuditLogModel.create({
      actorId: user._id,
      action: 'PASSWORD_RESET_SUCCESS',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      timestamp: new Date(),
      requestId: requestId || `req-${Date.now()}`,
      outcome: 'SUCCESS',
    });
  }

  /**
   * Verify Email Address
   */
  async verifyEmail(token: string, requestId?: string): Promise<void> {
    const tokenHash = hashToken(token);

    const tokenRecord = await VerificationTokenModel.findOne({
      tokenHash,
      type: 'EMAIL_VERIFICATION',
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      throw AppError.badRequest('Invalid or expired email verification token');
    }

    await UserModel.updateOne({ _id: tokenRecord.userId }, { emailVerified: true });

    tokenRecord.usedAt = new Date();
    await tokenRecord.save();

    await AuditLogModel.create({
      actorId: tokenRecord.userId,
      action: 'EMAIL_VERIFICATION_SUCCESS',
      resourceType: 'USER',
      resourceId: tokenRecord.userId.toString(),
      timestamp: new Date(),
      requestId: requestId || `req-${Date.now()}`,
      outcome: 'SUCCESS',
    });
  }

  /**
   * Resend Email Verification
   */
  async resendVerification(email: string): Promise<void> {
    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (user && !user.emailVerified) {
      const rawToken = generateRandomToken(32);
      await VerificationTokenModel.create({
        userId: user._id,
        tokenHash: hashToken(rawToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      void notificationService.sendVerificationEmail(user.email, rawToken);
    }
  }

  /**
   * Get Current Authenticated User & Attached Profile
   */
  async getMe(userId: string): Promise<{ user: UserPublicDto; profile: unknown }> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    let profile: unknown = null;
    if (user.role === 'PATIENT') {
      profile = await PatientProfileModel.findOne({ userId });
    } else if (user.role === 'DOCTOR') {
      profile = await DoctorProfileModel.findOne({ userId });
    } else if (user.role === 'PHARMACY') {
      profile = await PharmacyProfileModel.findOne({ userId });
    } else if (user.role === 'LABORATORY') {
      profile = await LaboratoryProfileModel.findOne({ userId });
    } else if (user.role === 'ADMIN') {
      profile = await AdminProfileModel.findOne({ userId });
    }

    return {
      user: user.toJSON() as unknown as UserPublicDto,
      profile,
    };
  }
}

export const authService = new AuthService();
