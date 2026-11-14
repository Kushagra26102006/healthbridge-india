import bcryptjs from 'bcryptjs';
import mongoose, { Types } from 'mongoose';
import { UserModel } from '../../users/models/user.model';
import { PatientProfileModel } from '../../users/models/patient-profile.model';
import { RefreshTokenModel } from '../../security/models/refresh-token.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@healthbridge/config';
import type {
  PatientProfileDto,
  UpdatePatientProfileDto,
  ChangePasswordDto,
  UserSessionItemDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  BloodGroup,
} from '@healthbridge/shared-types';

export class PatientProfileService {
  /**
   * Safe audit logging helper to prevent buffering issues when disconnected
   */
  private async recordAudit(params: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    requestId?: string;
    outcome?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          actorId: params.actorId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          timestamp: new Date(),
          requestId: params.requestId || `req-profile-${Date.now()}`,
          outcome: params.outcome || 'SUCCESS',
          metadata: params.metadata,
        });
      }
    } catch {
      // Non-blocking for audit logging
    }
  }

  /**
   * Helper to parse user-agent string into friendly browser and OS labels
   */
  private parseUserAgent(ua?: string): { browser: string; os: string; deviceName: string } {
    if (!ua) {
      return { browser: 'Web Browser', os: 'Desktop', deviceName: 'Unknown Device' };
    }

    let browser = 'Web Browser';
    let os = 'Desktop';

    if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Safari')) browser = 'Apple Safari';
    else if (ua.includes('Edge')) browser = 'Microsoft Edge';

    if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Linux')) os = 'Linux';

    const isMobile = os === 'iOS' || os === 'Android';
    const deviceName = `${browser} on ${os}${isMobile ? ' Mobile' : ''}`;

    return { browser, os, deviceName };
  }

  /**
   * Calculate profile completion percentage based on actual fields
   */
  private calculateCompletion(
    user: { name?: string; emailVerified?: boolean; phoneVerified?: boolean },
    profile: {
      dateOfBirth?: Date;
      gender?: string;
      address?: { city?: string; state?: string; postalCode?: string };
      emergencyContact?: { name?: string; phone?: string };
      abhaLinkageStatus?: string;
      bloodGroup?: string;
    }
  ): number {
    let score = 0;
    if (user.name) score += 15;
    if (profile.dateOfBirth) score += 15;
    if (profile.gender && profile.gender !== 'OTHER') score += 10;
    else if (profile.gender) score += 5;
    if (profile.address?.city && profile.address?.state && profile.address?.postalCode) score += 20;
    if (profile.emergencyContact?.name && profile.emergencyContact?.phone) score += 15;
    if (user.emailVerified) score += 10;
    if (user.phoneVerified) score += 5;
    if (profile.abhaLinkageStatus === 'LINKED') score += 10;

    return Math.min(100, Math.max(10, score));
  }

  /**
   * Format masked ABHA Number (e.g. 14-XXXX-XXXX-1234)
   */
  private maskAbhaNumber(abhaNumber?: string): string | undefined {
    if (!abhaNumber) return undefined;
    const clean = abhaNumber.replace(/[^0-9]/g, '');
    if (clean.length < 4) return abhaNumber;
    const last4 = clean.slice(-4);
    return `14-XXXX-XXXX-${last4}`;
  }

  /**
   * Retrieve complete patient profile
   */
  async getProfile(userId: string): Promise<PatientProfileDto> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('Patient user account not found');
    }

    let profile = await PatientProfileModel.findOne({ userId });

    // Auto-initialize profile if user exists but profile document hasn't been created yet
    if (!profile) {
      profile = await PatientProfileModel.create({
        userId: new Types.ObjectId(userId),
        dateOfBirth: new Date('1995-01-01'),
        gender: 'OTHER',
        address: {
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
        },
        emergencyContact: {
          name: 'Primary Contact',
          relationship: 'Family',
          phone: user.phone || '9876543210',
        },
        abhaLinkageStatus: 'NOT_LINKED',
        notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      });
    }

    const completionPercentage = this.calculateCompletion(user, profile);

    return {
      id: profile.id || profile._id.toString(),
      userId: user.id || user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.accountStatus,
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
      dateOfBirth: (profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '1995-01-01') as string,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup as BloodGroup,
      profileImage: profile.profileImage,
      address: profile.address,
      emergencyContact: profile.emergencyContact,
      abhaLinkageStatus: profile.abhaLinkageStatus,
      abhaAddress: profile.abhaAddress,
      abhaNumber: this.maskAbhaNumber(profile.abhaNumber),
      completionPercentage,
      notificationPreferences: {
        appointmentUpdates: profile.notificationPreferences?.appointmentUpdates || DEFAULT_NOTIFICATION_PREFERENCES.appointmentUpdates,
        prescriptionUpdates: profile.notificationPreferences?.prescriptionUpdates || DEFAULT_NOTIFICATION_PREFERENCES.prescriptionUpdates,
        labReportAlerts: profile.notificationPreferences?.labReportAlerts || DEFAULT_NOTIFICATION_PREFERENCES.labReportAlerts,
        consentRequests: profile.notificationPreferences?.consentRequests || DEFAULT_NOTIFICATION_PREFERENCES.consentRequests,
        securityAlerts: profile.notificationPreferences?.securityAlerts || DEFAULT_NOTIFICATION_PREFERENCES.securityAlerts,
        channelAvailability: {
          emailConfigured: true,
          smsConfigured: false,
        },
      },
      createdAt: profile.createdAt ? profile.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Update permitted personal information for authenticated patient
   */
  async updateProfile(
    userId: string,
    input: UpdatePatientProfileDto,
    requestId?: string
  ): Promise<PatientProfileDto> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('Patient user account not found');
    }

    // 1. Update user legal name if provided
    if (input.name && input.name.trim()) {
      user.name = input.name.trim();
      await user.save();
    }

    // 2. Update patient profile document
    let profile = await PatientProfileModel.findOne({ userId });
    if (!profile) {
      profile = new PatientProfileModel({
        userId: new Types.ObjectId(userId),
        dateOfBirth: new Date('1995-01-01'),
        gender: 'OTHER',
        address: {
          city: 'New Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
        },
        emergencyContact: {
          name: 'Primary Contact',
          relationship: 'Family',
          phone: user.phone || '9876543210',
        },
      });
    }

    if (input.dateOfBirth) {
      profile.dateOfBirth = new Date(input.dateOfBirth);
    }
    if (input.gender) {
      profile.gender = input.gender;
    }
    if (input.bloodGroup) {
      profile.bloodGroup = input.bloodGroup;
    }
    if (input.profileImage !== undefined) {
      profile.profileImage = input.profileImage;
    }

    if (input.address) {
      profile.address = {
        line1: input.address.line1 !== undefined ? input.address.line1 : profile.address.line1,
        city: input.address.city || profile.address.city,
        district: input.address.district || profile.address.district,
        state: input.address.state || profile.address.state,
        postalCode: input.address.postalCode || profile.address.postalCode,
      };
    }

    if (input.emergencyContact) {
      profile.emergencyContact = {
        name: input.emergencyContact.name || profile.emergencyContact.name,
        relationship: input.emergencyContact.relationship || profile.emergencyContact.relationship,
        phone: input.emergencyContact.phone || profile.emergencyContact.phone,
      };
    }

    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PATIENT_PROFILE_UPDATED',
      resourceType: 'PATIENT_PROFILE',
      resourceId: profile.id || profile._id.toString(),
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Change user password securely with verification
   */
  async changePassword(
    userId: string,
    input: ChangePasswordDto,
    requestId?: string
  ): Promise<{ message: string }> {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) {
      throw AppError.notFound('User account not found');
    }

    // Verify current password
    const isCurrentValid = await bcryptjs.compare(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      await this.recordAudit({
        actorId: userId,
        action: 'PASSWORD_CHANGE_FAILED',
        resourceType: 'USER',
        resourceId: userId,
        requestId,
        outcome: 'FAILURE',
        metadata: { reason: 'INVALID_CURRENT_PASSWORD' },
      });
      throw AppError.badRequest('Current password is incorrect');
    }

    // Check that new password is not identical to current password
    const isSamePassword = await bcryptjs.compare(input.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw AppError.badRequest('New password cannot be identical to your current password');
    }

    // Hash and store new password
    const newHash = await bcryptjs.hash(input.newPassword, 10);
    user.passwordHash = newHash;
    await user.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PASSWORD_CHANGED',
      resourceType: 'USER',
      resourceId: userId,
      requestId,
      outcome: 'SUCCESS',
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * List active sessions for user (sanitized, zero secret leakage)
   */
  async getSessions(userId: string, currentTokenHash?: string): Promise<UserSessionItemDto[]> {
    const sessions = await RefreshTokenModel.find({
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return sessions.map((session, index) => {
      const uaInfo = this.parseUserAgent(session.deviceInfo?.userAgent);
      const isCurrent = currentTokenHash
        ? session.tokenHash === currentTokenHash
        : index === 0;

      return {
        id: session._id.toString(),
        deviceName: session.deviceInfo?.deviceName || uaInfo.deviceName,
        ipAddress: session.deviceInfo?.ipAddress || '127.0.0.1',
        userAgent: session.deviceInfo?.userAgent,
        browser: uaInfo.browser,
        os: uaInfo.os,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString(),
        lastActive: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
        isCurrent,
        expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  /**
   * Revoke individual session by ID
   */
  async revokeSession(userId: string, sessionId: string, requestId?: string): Promise<{ message: string }> {
    const session = await RefreshTokenModel.findOne({
      _id: sessionId,
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
    });

    if (!session) {
      throw AppError.notFound('Session not found or already terminated');
    }

    session.revokedAt = new Date();
    await session.save();

    await this.recordAudit({
      actorId: userId,
      action: 'SESSION_REVOKED',
      resourceType: 'SESSION',
      resourceId: sessionId,
      requestId,
      outcome: 'SUCCESS',
    });

    return { message: 'Session successfully revoked' };
  }

  /**
   * Revoke all other active sessions for user except current
   */
  async revokeOtherSessions(
    userId: string,
    currentTokenHash?: string,
    requestId?: string
  ): Promise<{ message: string; count: number }> {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      revokedAt: { $exists: false },
    };

    if (currentTokenHash) {
      query.tokenHash = { $ne: currentTokenHash };
    }

    const result = await RefreshTokenModel.updateMany(query, {
      $set: { revokedAt: new Date() },
    });

    await this.recordAudit({
      actorId: userId,
      action: 'SESSIONS_REVOKED_OTHERS',
      resourceType: 'SESSION',
      resourceId: userId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { revokedCount: result.modifiedCount },
    });

    return {
      message: 'All other sessions have been logged out successfully',
      count: result.modifiedCount,
    };
  }

  /**
   * Retrieve notification preferences for patient
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const profile = await PatientProfileModel.findOne({ userId });

    const prefs = profile?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

    return {
      appointmentUpdates: prefs.appointmentUpdates || DEFAULT_NOTIFICATION_PREFERENCES.appointmentUpdates,
      prescriptionUpdates: prefs.prescriptionUpdates || DEFAULT_NOTIFICATION_PREFERENCES.prescriptionUpdates,
      labReportAlerts: prefs.labReportAlerts || DEFAULT_NOTIFICATION_PREFERENCES.labReportAlerts,
      consentRequests: prefs.consentRequests || DEFAULT_NOTIFICATION_PREFERENCES.consentRequests,
      securityAlerts: {
        inApp: true,
        email: true,
        sms: Boolean(prefs.securityAlerts?.sms),
      },
      channelAvailability: {
        emailConfigured: true,
        smsConfigured: false,
      },
    };
  }

  /**
   * Update notification preferences for patient
   */
  async updateNotificationPreferences(
    userId: string,
    input: UpdateNotificationPreferencesDto,
    requestId?: string
  ): Promise<NotificationPreferencesDto> {
    let profile = await PatientProfileModel.findOne({ userId });
    if (!profile) {
      await this.getProfile(userId);
      profile = await PatientProfileModel.findOne({ userId });
    }

    if (!profile) {
      throw AppError.notFound('Patient profile not found');
    }

    const current = profile.notificationPreferences || { ...DEFAULT_NOTIFICATION_PREFERENCES };

    const merged = {
      appointmentUpdates: {
        ...current.appointmentUpdates,
        ...input.appointmentUpdates,
      },
      prescriptionUpdates: {
        ...current.prescriptionUpdates,
        ...input.prescriptionUpdates,
      },
      labReportAlerts: {
        ...current.labReportAlerts,
        ...input.labReportAlerts,
      },
      consentRequests: {
        ...current.consentRequests,
        ...input.consentRequests,
      },
      // Security alerts: email and inApp cannot be turned off (mandatory security alert requirement)
      securityAlerts: {
        inApp: true,
        email: true,
        sms: input.securityAlerts?.sms !== undefined
          ? input.securityAlerts.sms
          : current.securityAlerts.sms,
      },
    };

    profile.notificationPreferences = merged as any;
    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'NOTIFICATION_PREFERENCES_UPDATED',
      resourceType: 'PATIENT_PROFILE',
      resourceId: profile.id || profile._id.toString(),
      requestId,
      outcome: 'SUCCESS',
    });

    return this.getNotificationPreferences(userId);
  }
}

export const patientProfileService = new PatientProfileService();
export default patientProfileService;
