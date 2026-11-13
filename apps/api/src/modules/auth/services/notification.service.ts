import { logger } from '../../../utils/logger';
import { env } from '../../../config/env';

export interface INotificationService {
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPhoneOtp(phone: string, otp: string): Promise<void>;
}

export class NotificationService implements INotificationService {
  async sendPasswordResetEmail(email: string, _token: string): Promise<void> {
    if (env.NODE_ENV !== 'production') {
      logger.info(`[MOCK EMAIL DISPATCH] Password reset email queued for ${email}`);
    }
    // In production, integrate with nodemailer / AWS SES / Postmark
  }

  async sendVerificationEmail(email: string, _token: string): Promise<void> {
    if (env.NODE_ENV !== 'production') {
      logger.info(`[MOCK EMAIL DISPATCH] Account verification email queued for ${email}`);
    }
  }

  async sendPhoneOtp(phone: string, _otp: string): Promise<void> {
    if (env.NODE_ENV !== 'production') {
      logger.info(
        `[MOCK SMS DISPATCH] OTP queued for phone: ${phone.slice(0, 2)}******${phone.slice(-2)}`
      );
    }
  }
}

export const notificationService = new NotificationService();
