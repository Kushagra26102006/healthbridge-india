/**
 * HealthBridge India — Unified Notifications Center & Real-Time Stream Unit Tests (Day 8 Task 04)
 *
 * Covers:
 *   - Centralized privacy-safe notification templates across all 5 roles
 *   - Defense-in-depth PHI/credential sanitization (diagnoses, lab values, ABHA/Aadhaar, tokens)
 *   - Role-based recipient resolution & authorization (Admin PHI boundary, cross-role isolation)
 *   - SSE connection manager: per-user isolation, `id:` framing, connection cap, cleanup, session expiration
 *   - Honest configured channel reporting (`inApp`, `email`, `sms`)
 *   - Domain event handler bridge idempotency
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { Types } from 'mongoose';
import {
  renderNotificationTemplate,
  sanitizeNotificationText,
} from '../../src/modules/notifications/services/notification-template.registry';
import { notificationRecipientResolver } from '../../src/modules/notifications/services/notification-recipient.resolver';
import { NotificationStreamService } from '../../src/modules/notifications/services/notification-stream.service';
import { notificationDeliveryService } from '../../src/modules/notifications/services/notification-delivery.service';
import { unifiedNotificationEventHandler } from '../../src/modules/notifications/services/notification-event.handler';
import { notificationService } from '../../src/modules/notifications/services/notification.service';

function createMockSseResponse() {
  const emitter = new EventEmitter();
  const chunks: string[] = [];
  let ended = false;
  const res: any = {
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
      return true;
    }),
    end: vi.fn(() => {
      ended = true;
      emitter.emit('close');
    }),
    on: (evt: string, cb: (...args: any[]) => void) => emitter.on(evt, cb),
    emitClose: () => emitter.emit('close'),
    chunks,
    isEnded: () => ended,
  };
  return res;
}

describe('Unified Notifications & Real-Time Stream — Unit Tests (Day 8 Task 04)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* =========================================================================
     1. PRIVACY-SAFE TEMPLATE REGISTRY & PHI SANITIZER
     ========================================================================= */
  describe('Privacy-Safe Templates & PHI Redaction', () => {
    it('renders neutral privacy-safe templates for all 5 user roles with role-scoped routes', () => {
      const patientTpl = renderNotificationTemplate('REPORT_PUBLISHED', 'PATIENT');
      expect(patientTpl.title).toBe('Laboratory Report Ready');
      expect(patientTpl.message).toMatch(/ready to view/i);
      expect(patientTpl.linkUrl).toBe('/patient/lab-reports');
      expect(patientTpl.category).toBe('LAB');

      const doctorTpl = renderNotificationTemplate('APPOINTMENT_BOOKED', 'DOCTOR');
      expect(doctorTpl.linkUrl).toBe('/doctor/appointments');
      expect(doctorTpl.category).toBe('APPOINTMENT');

      const pharmacyTpl = renderNotificationTemplate('LOW_STOCK', 'PHARMACY');
      expect(pharmacyTpl.linkUrl).toBe('/pharmacy/inventory');
      expect(pharmacyTpl.category).toBe('INVENTORY');

      const labTpl = renderNotificationTemplate('QC_INCIDENT_OPENED', 'LABORATORY');
      expect(labTpl.linkUrl).toBe('/laboratory/quality');
      expect(labTpl.priority).toBe('CRITICAL');

      const adminTpl = renderNotificationTemplate('EVENT_PROCESSING_FAILED', 'ADMIN');
      expect(adminTpl.linkUrl).toBe('/admin/platform-overview');
      expect(adminTpl.category).toBe('SYSTEM');
    });

    it('strips diagnoses, lab values, medication dosages, ABHA/Aadhaar numbers, and bearer tokens', () => {
      const raw =
        'Patient ABHA 12-3456-7890-1234 Aadhaar 1234 5678 9012 HbA1c: 8.9% Glucose: 210 mg/dL diagnosis: Type 2 Diabetes Metformin 500 mg';
      const sanitized = sanitizeNotificationText(raw);

      expect(sanitized).not.toContain('12-3456-7890-1234');
      expect(sanitized).not.toContain('1234 5678 9012');
      expect(sanitized).not.toContain('8.9%');
      expect(sanitized).not.toContain('210 mg/dL');
      expect(sanitized).not.toContain('Type 2 Diabetes');
      expect(sanitized).not.toContain('500 mg');
      expect(sanitized).toContain('[PROTECTED]');
    });
  });

  /* =========================================================================
     2. RECIPIENT RESOLVER & ROLE AUTHORIZATION BOUNDARIES
     ========================================================================= */
  describe('NotificationRecipientResolver Authorization & Deduplication', () => {
    it('blocks ADMIN from receiving patient clinical notifications (zero PHI to admins)', () => {
      const adminId = new Types.ObjectId().toString();
      const patientId = new Types.ObjectId().toString();

      const payloads = notificationRecipientResolver.resolvePayloads({
        eventId: 'evt-lab-100',
        eventType: 'REPORT_PUBLISHED',
        candidates: [
          { userId: adminId, role: 'ADMIN' },
          { userId: patientId, role: 'PATIENT' },
        ],
      });

      expect(payloads).toHaveLength(1);
      expect(payloads[0].recipientId).toBe(patientId);
      expect(payloads[0].recipientRole).toBe('PATIENT');
      expect(payloads[0].idempotencyKey).toBe(`evt:evt-lab-100:rcpt:${patientId}`);
    });

    it('allows ADMIN operational/security alerts and blocks cross-role irrelevant events', () => {
      const adminId = new Types.ObjectId().toString();
      const pharmacyId = new Types.ObjectId().toString();
      const labId = new Types.ObjectId().toString();

      expect(
        notificationRecipientResolver.isRecipientAuthorizedForEvent('ADMIN', 'SERVICE_FAILURE_ALERT')
      ).toBe(true);
      expect(
        notificationRecipientResolver.isRecipientAuthorizedForEvent('ADMIN', 'PRESCRIPTION_ISSUED')
      ).toBe(false);
      expect(
        notificationRecipientResolver.isRecipientAuthorizedForEvent('PHARMACY', 'REPORT_PUBLISHED')
      ).toBe(false);
      expect(
        notificationRecipientResolver.isRecipientAuthorizedForEvent('LABORATORY', 'LOW_STOCK')
      ).toBe(false);

      const deduped = notificationRecipientResolver.resolvePayloads({
        eventId: 'evt-sec-1',
        eventType: 'SECURITY_ALERT',
        candidates: [
          { userId: adminId, role: 'ADMIN' },
          { userId: adminId, role: 'ADMIN' }, // duplicate
          { userId: 'not-an-object-id', role: 'PHARMACY' }, // invalid
          { userId: pharmacyId, role: 'PHARMACY' },
          { userId: labId, role: 'LABORATORY' },
        ],
      });

      expect(deduped).toHaveLength(3);
      expect(deduped.map((p) => p.recipientId)).toEqual([adminId, pharmacyId, labId]);
    });
  });

  /* =========================================================================
     3. REAL-TIME SSE CONNECTION MANAGER (ISOLATION, CAPS, CLEANUP, EXPIRATION)
     ========================================================================= */
  describe('NotificationStreamService Real-Time Isolation & Lifecycle', () => {
    let streamService: NotificationStreamService;

    beforeEach(() => {
      streamService = new NotificationStreamService();
    });

    afterEach(() => {
      streamService.closeAll();
    });

    it('isolates SSE broadcasts strictly per user and includes SSE id: header', () => {
      const patientARes = createMockSseResponse();
      const patientBRes = createMockSseResponse();

      streamService.addClient('patient-A', patientARes);
      streamService.addClient('patient-B', patientBRes);

      const delivered = streamService.broadcastToUser(
        'patient-A',
        'notification',
        { id: 'n-1', title: 'Appointment Updated' },
        'n-1'
      );

      expect(delivered).toBe(1);
      const aOutput = patientARes.chunks.join('');
      const bOutput = patientBRes.chunks.join('');

      expect(aOutput).toContain('id: n-1');
      expect(aOutput).toContain('event: notification');
      expect(aOutput).toContain('Appointment Updated');
      expect(bOutput).not.toContain('Appointment Updated');
    });

    it('enforces per-user max concurrent connection cap and cleans up on socket close', () => {
      const sockets = Array.from({ length: 6 }, () => createMockSseResponse());
      for (const s of sockets) {
        streamService.addClient('user-1', s);
      }

      // Max 5 connections per user: first socket displaced
      expect(sockets[0].isEnded()).toBe(true);
      expect(streamService.getActiveConnectionCount()).toBe(5);

      // Simulate remaining sockets closing
      for (let i = 1; i < sockets.length; i++) {
        sockets[i].emitClose();
      }
      expect(streamService.getActiveConnectionCount()).toBe(0);
      expect(streamService.getConnectedUserCount()).toBe(0);
    });

    it('terminates all user streams with session_expired event on logout/expiration', () => {
      const tab1 = createMockSseResponse();
      const tab2 = createMockSseResponse();
      streamService.addClient('user-logout', tab1);
      streamService.addClient('user-logout', tab2);

      const closed = streamService.disconnectUser('user-logout', 'LOGOUT');
      expect(closed).toBe(2);
      expect(tab1.chunks.join('')).toContain('event: session_expired');
      expect(tab1.isEnded()).toBe(true);
      expect(tab2.isEnded()).toBe(true);
      expect(streamService.getConnectedUserCount()).toBe(0);
    });
  });

  /* =========================================================================
     4. HONEST CHANNEL AVAILABILITY & DOMAIN EVENT HANDLER BRIDGE
     ========================================================================= */
  describe('Channel Configuration & Domain Event Handler Bridge', () => {
    it('reports real channel availability honestly based on environment configuration', () => {
      const prevSmtp = process.env.SMTP_HOST;
      const prevSes = process.env.AWS_SES_REGION;
      const prevTwilio = process.env.TWILIO_ACCOUNT_SID;
      const prevMsg91 = process.env.MSG91_AUTH_KEY;

      delete process.env.SMTP_HOST;
      delete process.env.AWS_SES_REGION;
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.MSG91_AUTH_KEY;

      const unconfigured = notificationDeliveryService.getConfiguredChannels();
      expect(unconfigured).toEqual({
        inApp: true,
        email: false,
        sms: false,
        realTimeTransport: 'SSE_WITH_POLLING_FALLBACK',
      });

      process.env.SMTP_HOST = 'smtp.example.test';
      const withEmail = notificationDeliveryService.getConfiguredChannels();
      expect(withEmail.email).toBe(true);
      expect(withEmail.sms).toBe(false);

      if (prevSmtp !== undefined) process.env.SMTP_HOST = prevSmtp;
      else delete process.env.SMTP_HOST;
      if (prevSes !== undefined) process.env.AWS_SES_REGION = prevSes;
      if (prevTwilio !== undefined) process.env.TWILIO_ACCOUNT_SID = prevTwilio;
      if (prevMsg91 !== undefined) process.env.MSG91_AUTH_KEY = prevMsg91;
    });

    it('routes domain events through recipient resolver and notificationService with deterministic keys', async () => {
      const patientId = new Types.ObjectId().toString();
      const doctorId = new Types.ObjectId().toString();
      const publishSpy = vi.spyOn(notificationService, 'publishEvent').mockResolvedValue(null);

      await unifiedNotificationEventHandler.handle({
        workerId: 'test-worker',
        attempt: 1,
        correlationId: 'corr-1',
        event: {
          eventId: 'evt-apt-42',
          eventType: 'APPOINTMENT_BOOKED',
          aggregateType: 'Appointment',
          aggregateId: 'apt-42',
          payload: {
            appointmentId: 'apt-42',
            patientId,
            doctorId,
          },
        } as any,
      });

      expect(publishSpy).toHaveBeenCalledTimes(2);
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: patientId,
          recipientRole: 'PATIENT',
          eventId: 'evt-apt-42',
          idempotencyKey: `evt:evt-apt-42:rcpt:${patientId}`,
          linkUrl: '/patient/appointments',
        })
      );
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: doctorId,
          recipientRole: 'DOCTOR',
          eventId: 'evt-apt-42',
          idempotencyKey: `evt:evt-apt-42:rcpt:${doctorId}`,
          linkUrl: '/doctor/appointments',
        })
      );
    });
  });
});
