import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authenticate } from '../../src/middleware/authenticate';
import { authorize } from '../../src/middleware/authorize';
import { errorHandler } from '../../src/middleware/error-handler';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ErrorCode } from '../../src/shared/errors/error-codes';
import type { UserRole } from '@healthbridge/shared-types';

describe('Role-Based Access Control (RBAC) Matrix Integration Tests', () => {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Define domain-specific mock endpoints representing the platform's multi-role surface
  app.get('/api/v1/patient/records', authenticate, authorize(['PATIENT']), (_req, res) => {
    res.json({ success: true, domain: 'PATIENT_RECORDS' });
  });

  app.get('/api/v1/doctor/clinical-notes', authenticate, authorize(['DOCTOR']), (_req, res) => {
    res.json({ success: true, domain: 'DOCTOR_CLINICAL' });
  });

  app.get('/api/v1/pharmacy/dispense-queue', authenticate, authorize(['PHARMACY']), (_req, res) => {
    res.json({ success: true, domain: 'PHARMACY_QUEUE' });
  });

  app.get(
    '/api/v1/laboratory/test-orders',
    authenticate,
    authorize(['LABORATORY']),
    (_req, res) => {
      res.json({ success: true, domain: 'LAB_ORDERS' });
    }
  );

  app.get('/api/v1/admin/audit-logs', authenticate, authorize(['ADMIN']), (_req, res) => {
    res.json({ success: true, domain: 'ADMIN_AUDIT' });
  });

  app.use(errorHandler);

  const createMockUserToken = (role: UserRole, id: string = `mock-${role.toLowerCase()}-id`) => {
    const token = tokenService.generateAccessToken({
      _id: id,
      role,
      email: `${role.toLowerCase()}@healthbridge.test`,
    } as any);

    return { token, id, role };
  };

  const setupMockUser = (userMeta: { token: string; id: string; role: UserRole }) => {
    vi.spyOn(UserModel, 'findById').mockResolvedValue({
      _id: userMeta.id,
      role: userMeta.role,
      accountStatus: 'ACTIVE',
      email: `${userMeta.role.toLowerCase()}@healthbridge.test`,
      name: `Test ${userMeta.role}`,
      phone: '9876543210',
    } as any);
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Unauthenticated baseline
  it('should reject unauthenticated requests to all domain routes with 401 UNAUTHORIZED', async () => {
    const endpoints = [
      '/api/v1/patient/records',
      '/api/v1/doctor/clinical-notes',
      '/api/v1/pharmacy/dispense-queue',
      '/api/v1/laboratory/test-orders',
      '/api/v1/admin/audit-logs',
    ];

    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
    }
  });

  // 2. PATIENT role isolation
  describe('PATIENT role permissions', () => {
    const patient = createMockUserToken('PATIENT');

    it('should allow PATIENT to access patient routes', async () => {
      setupMockUser(patient);
      const res = await request(app)
        .get('/api/v1/patient/records')
        .set('Authorization', `Bearer ${patient.token}`);
      expect(res.status).toBe(200);
      expect(res.body.domain).toBe('PATIENT_RECORDS');
    });

    it('should forbid PATIENT from accessing DOCTOR clinical routes (403)', async () => {
      setupMockUser(patient);
      const res = await request(app)
        .get('/api/v1/doctor/clinical-notes')
        .set('Authorization', `Bearer ${patient.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should forbid PATIENT from accessing PHARMACY queues (403)', async () => {
      setupMockUser(patient);
      const res = await request(app)
        .get('/api/v1/pharmacy/dispense-queue')
        .set('Authorization', `Bearer ${patient.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should forbid PATIENT from accessing LABORATORY test orders (403)', async () => {
      setupMockUser(patient);
      const res = await request(app)
        .get('/api/v1/laboratory/test-orders')
        .set('Authorization', `Bearer ${patient.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should forbid PATIENT from accessing ADMIN audit logs (403)', async () => {
      setupMockUser(patient);
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${patient.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  // 3. DOCTOR role isolation
  describe('DOCTOR role permissions', () => {
    const doctor = createMockUserToken('DOCTOR');

    it('should allow DOCTOR to access clinical doctor routes', async () => {
      setupMockUser(doctor);
      const res = await request(app)
        .get('/api/v1/doctor/clinical-notes')
        .set('Authorization', `Bearer ${doctor.token}`);
      expect(res.status).toBe(200);
      expect(res.body.domain).toBe('DOCTOR_CLINICAL');
    });

    it('should forbid DOCTOR from accessing ADMIN audit logs (403)', async () => {
      setupMockUser(doctor);
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${doctor.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should forbid DOCTOR from accessing PHARMACY dispensing queue (403)', async () => {
      setupMockUser(doctor);
      const res = await request(app)
        .get('/api/v1/pharmacy/dispense-queue')
        .set('Authorization', `Bearer ${doctor.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  // 4. PHARMACY and LABORATORY isolation
  describe('PHARMACY and LABORATORY cross-isolation', () => {
    const pharmacy = createMockUserToken('PHARMACY');
    const lab = createMockUserToken('LABORATORY');

    it('should allow PHARMACY to access pharmacy queue', async () => {
      setupMockUser(pharmacy);
      const res = await request(app)
        .get('/api/v1/pharmacy/dispense-queue')
        .set('Authorization', `Bearer ${pharmacy.token}`);
      expect(res.status).toBe(200);
      expect(res.body.domain).toBe('PHARMACY_QUEUE');
    });

    it('should forbid PHARMACY from accessing LABORATORY orders (403)', async () => {
      setupMockUser(pharmacy);
      const res = await request(app)
        .get('/api/v1/laboratory/test-orders')
        .set('Authorization', `Bearer ${pharmacy.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should allow LABORATORY to access lab orders', async () => {
      setupMockUser(lab);
      const res = await request(app)
        .get('/api/v1/laboratory/test-orders')
        .set('Authorization', `Bearer ${lab.token}`);
      expect(res.status).toBe(200);
      expect(res.body.domain).toBe('LAB_ORDERS');
    });

    it('should forbid LABORATORY from accessing PHARMACY queue (403)', async () => {
      setupMockUser(lab);
      const res = await request(app)
        .get('/api/v1/pharmacy/dispense-queue')
        .set('Authorization', `Bearer ${lab.token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  // 5. ADMIN role verification
  describe('ADMIN role permissions', () => {
    const admin = createMockUserToken('ADMIN');

    it('should allow ADMIN to access administrative console routes', async () => {
      setupMockUser(admin);
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.domain).toBe('ADMIN_AUDIT');
    });
  });
});
