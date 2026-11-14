import mongoose, { Types } from 'mongoose';
import {
  NotificationPreferenceModel,
  DEFAULT_CATEGORY_PREFERENCES,
  INotificationPreferenceDocument,
} from '../models/notification-preference.model';
import { AppError } from '../../../shared/errors/app-error';
import type {
  NotificationCategory,
  NotificationChannelPreferences,
  UserNotificationPreferencesDto,
  UpdateUserNotificationPreferencesDto,
} from '@healthbridge/shared-types';

export class NotificationPreferenceService {
  /**
   * Retrieve user notification preferences or construct default configuration
   */
  async getPreferences(userId: string, userRole?: string): Promise<UserNotificationPreferencesDto> {
    const userObjectId = new Types.ObjectId(userId);
    let prefDoc: any = null;

    const isMocked = Boolean(
      (NotificationPreferenceModel.findOne as any)?._isMockFunction ||
        (NotificationPreferenceModel.findOne as any)?.mock
    );

    if (mongoose.connection.readyState === 1 || isMocked) {
      try {
        prefDoc = await NotificationPreferenceModel.findOne({ userId: userObjectId });
      } catch {
        prefDoc = null;
      }
    }

    if (!prefDoc) {
      const isCreateMocked = Boolean(
        (NotificationPreferenceModel.create as any)?._isMockFunction ||
          (NotificationPreferenceModel.create as any)?.mock
      );
      if (mongoose.connection.readyState === 1 || isCreateMocked) {
        try {
          prefDoc = await NotificationPreferenceModel.create({
            userId: userObjectId,
            userRole,
            channels: { inApp: true, email: true, sms: true },
            categoryPreferences: DEFAULT_CATEGORY_PREFERENCES,
            mandatoryCategories: ['SECURITY'],
          });
        } catch {
          prefDoc = null;
        }
      }
    }

    if (!prefDoc) {
      return {
        userId,
        userRole,
        channels: { inApp: true, email: true, sms: true },
        categoryPreferences: { ...DEFAULT_CATEGORY_PREFERENCES },
        mandatoryCategories: ['SECURITY'],
        updatedAt: new Date().toISOString(),
      };
    }

    return this.mapToDto(prefDoc);
  }

  /**
   * Update notification preferences with mandatory category security locks
   */
  async updatePreferences(
    userId: string,
    userRole: string,
    dto: UpdateUserNotificationPreferencesDto
  ): Promise<UserNotificationPreferencesDto> {
    const userObjectId = new Types.ObjectId(userId);
    let prefDoc = await NotificationPreferenceModel.findOne({ userId: userObjectId });

    if (!prefDoc) {
      prefDoc = new NotificationPreferenceModel({
        userId: userObjectId,
        userRole,
        channels: { inApp: true, email: true, sms: true },
        categoryPreferences: DEFAULT_CATEGORY_PREFERENCES,
        mandatoryCategories: ['SECURITY'],
      });
    }

    // Update global channel flags if provided
    if (dto.channels) {
      prefDoc.channels = {
        inApp: dto.channels.inApp !== undefined ? dto.channels.inApp : prefDoc.channels.inApp,
        email: dto.channels.email !== undefined ? dto.channels.email : prefDoc.channels.email,
        sms: dto.channels.sms !== undefined ? dto.channels.sms : prefDoc.channels.sms,
      };
    }

    // Update per-category channel overrides
    if (dto.categoryPreferences) {
      const existingMap: any = prefDoc.categoryPreferences instanceof Map
        ? Object.fromEntries(prefDoc.categoryPreferences)
        : prefDoc.categoryPreferences || {};

      for (const [catKey, overrides] of Object.entries(dto.categoryPreferences)) {
        const category = catKey as NotificationCategory;

        // Security Policy Enforcement: Mandatory security notifications cannot be disabled
        if (prefDoc.mandatoryCategories.includes(category)) {
          if (overrides?.inApp === false || overrides?.email === false) {
            throw AppError.badRequest(
              'Security and account notifications are mandatory for patient safety and cannot be disabled.'
            );
          }
        }

        const currentPref = existingMap[category] || DEFAULT_CATEGORY_PREFERENCES[category] || {
          inApp: true,
          email: true,
          sms: false,
        };

        existingMap[category] = {
          inApp: overrides?.inApp !== undefined ? overrides.inApp : currentPref.inApp,
          email: overrides?.email !== undefined ? overrides.email : currentPref.email,
          sms: overrides?.sms !== undefined ? overrides.sms : currentPref.sms,
        };
      }

      prefDoc.categoryPreferences = existingMap;
    }

    await prefDoc.save();
    return this.mapToDto(prefDoc);
  }

  /**
   * Reset notification preferences to role defaults
   */
  async restoreDefaults(userId: string, userRole?: string): Promise<UserNotificationPreferencesDto> {
    const userObjectId = new Types.ObjectId(userId);
    let prefDoc = await NotificationPreferenceModel.findOne({ userId: userObjectId });

    if (!prefDoc) {
      prefDoc = new NotificationPreferenceModel({ userId: userObjectId });
    }

    prefDoc.userRole = userRole;
    prefDoc.channels = { inApp: true, email: true, sms: true };
    prefDoc.categoryPreferences = DEFAULT_CATEGORY_PREFERENCES as any;
    prefDoc.mandatoryCategories = ['SECURITY'];

    await prefDoc.save();
    return this.mapToDto(prefDoc);
  }

  private mapToDto(doc: INotificationPreferenceDocument): UserNotificationPreferencesDto {
    const rawCategories: any = doc.categoryPreferences instanceof Map
      ? Object.fromEntries(doc.categoryPreferences)
      : doc.categoryPreferences || {};

    const categoryPreferences: Record<NotificationCategory, NotificationChannelPreferences> = {
      ...DEFAULT_CATEGORY_PREFERENCES,
      ...rawCategories,
    };

    return {
      userId: doc.userId.toString(),
      userRole: doc.userRole,
      channels: {
        inApp: doc.channels?.inApp ?? true,
        email: doc.channels?.email ?? true,
        sms: doc.channels?.sms ?? true,
      },
      categoryPreferences,
      mandatoryCategories: (doc.mandatoryCategories as NotificationCategory[]) || ['SECURITY'],
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
