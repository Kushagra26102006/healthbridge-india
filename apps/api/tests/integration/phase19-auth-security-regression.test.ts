import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';
import { UserModel } from '../../src/modules/users/models/user.model';
import { createSyntheticActorRoster } from '../fixtures/synthetic-healthcare-fixtures';

describe('Phase 19 Security Regression & Auth/RBAC Matrix Integration Tests', () => {
  const app = createApp();
  const roster = createSyntheticActorRoster();

  const mockUsersById = new Map<string, any>([
    [roster.patientA.id, { _id: roster.patientA.objectId, role: 'PATIENT', accountStatus: 'ACTIVE', email: roster.patientA.email }],
    [roster.doctorA.id, { _id: roster.doctorA.objectId, role: 'DOCTOR', accountStatus: 'ACTIVE', email: roster.doctorA.email }],
    [roster.pharmacyA.id, { _id: roster.pharmacyA.objectId, role: 'PHARMACY', accountStatus: 'ACTIVE', email: roster.pharmacyA.email }],
    [roster.laboratoryA.id, { _id: roster.laboratoryA.objectId, role: 'LABORATORY', accountStatus: 'ACTIVE', email: roster.laboratoryA.email }],
    [roster.adminA.id, { _id: roster.adminA.objectId, role: 'ADMIN', accountStatus: 'ACTIVE', email: roster.adminA.email }],
  ]);

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const user = mockUsersById.get(id?.toString() || String(id)) ?? null;
      return Promise.resolve(user);
    }) as any);
  });

  describe('Authentication Token & Validation Regression', () => {
    it('rejects expired and forged Bearer tokens on protected /api/v1/auth/me', async () => {
      const expiredToken = jwt.sign(
        { userId: roster.patientA.id, role: 'PATIENT', email: roster.patientA.email },
        process.env.JWT_SECRET || 'healthbridge-india-dev-jwt-secret-key-min-32-chars!',
        { expiresIn: -60 }
      );

      const expiredRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(expiredRes.status).toBe(401);

      const forgedRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${roster.patientA.token.slice(0, -4)}zzzz`);
      expect(forgedRes.status).toBe(401);
    });

    it('rejects malformed login, forgot-password, and weak reset-password payloads with 400/422', async () => {
      const badLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'bad', password: '' });
      expect([400, 422]).toContain(badLogin.status);
      expect(badLogin.body.success).toBe(false);

      const badForgot = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' });
      expect([400, 422]).toContain(badForgot.status);

      const weakReset = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'tok', password: 'weak', confirmPassword: 'weak' });
      expect([400, 422]).toContain(weakReset.status);
    });

    it('fails closed on unauthorized public ADMIN registration attempts', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Rogue Admin',
        email: 'rogue.admin@synthetic.healthbridge.test',
        phone: '9876543299',
        password: 'StrongPassword#2026',
        confirmPassword: 'StrongPassword#2026',
        role: 'ADMIN',
      });

      expect([400, 403, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Server-Side Cross-Role Authorization Matrix', () => {
    it('blocks non-ADMIN roles from Admin security & audit endpoints (server-side RBAC)', async () => {
      const nonAdmins = [roster.patientA, roster.doctorA, roster.pharmacyA, roster.laboratoryA];
      for (const actor of nonAdmins) {
        const res = await request(app)
          .get('/api/v1/admin/security/events')
          .set('Authorization', `Bearer ${actor.token}`);
        expect(res.status).toBe(403);
      }
    });

    it('blocks PATIENT from Doctor, Pharmacy, and Laboratory operational endpoints', async () => {
      const doctorRes = await request(app)
        .get('/api/v1/doctor/dashboard/overview')
        .set('Authorization', `Bearer ${roster.patientA.token}`);
      expect([403, 404]).toContain(doctorRes.status);

      const pharmacyRes = await request(app)
        .get('/api/v1/pharmacy/dashboard/overview')
        .set('Authorization', `Bearer ${roster.patientA.token}`);
      expect([403, 404]).toContain(pharmacyRes.status);

      const labRes = await request(app)
        .get('/api/v1/laboratory/dashboard/overview')
        .set('Authorization', `Bearer ${roster.patientA.token}`);
      expect([403, 404]).toContain(labRes.status);
    });

    it('applies hardened security headers (Helmet / no X-Powered-By / X-Request-Id)', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });
});
