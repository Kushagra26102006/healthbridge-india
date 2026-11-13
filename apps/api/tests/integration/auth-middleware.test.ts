import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authenticate } from '../../src/middleware/authenticate';
import { authorize } from '../../src/middleware/authorize';
import { errorHandler } from '../../src/middleware/error-handler';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ErrorCode } from '../../src/shared/errors/error-codes';

describe('Authentication & Authorization Middleware Integration Tests', () => {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);

  // Protected route requiring authentication
  app.get('/protected-user', authenticate, (req: any, res) => {
    res.json({ success: true, user: req.user });
  });

  // Protected route requiring DOCTOR or ADMIN role
  app.get('/protected-clinical', authenticate, authorize(['DOCTOR', 'ADMIN']), (req: any, res) => {
    res.json({ success: true, clinical: true, user: req.user });
  });

  app.use(errorHandler);

  it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/protected-user');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(res.body.message).toContain('Authentication required');
  });

  it('should reject invalid or malformed bearer token with 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .get('/protected-user')
      .set('Authorization', 'Bearer invalid.token.payload');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should reject user with insufficient role with 403 FORBIDDEN', async () => {
    // Generate valid token for a PATIENT
    const validPatientToken = tokenService.generateAccessToken({
      _id: 'mock-patient-id',
      role: 'PATIENT',
      email: 'patient@healthbridge.in',
    } as any);

    // Mock UserModel lookup
    vi.spyOn(UserModel, 'findById').mockResolvedValue({
      _id: 'mock-patient-id',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      email: 'patient@healthbridge.in',
      name: 'Mock Patient',
      phone: '9876543210',
    } as any);

    const res = await request(app)
      .get('/protected-clinical')
      .set('Authorization', `Bearer ${validPatientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCode.FORBIDDEN);
    expect(res.body.message.toLowerCase()).toContain('forbidden');
  });

  it('should allow user with required role to access protected route', async () => {
    // Generate valid token for a DOCTOR
    const validDoctorToken = tokenService.generateAccessToken({
      _id: 'mock-doctor-id',
      role: 'DOCTOR',
      email: 'doctor@healthbridge.in',
    } as any);

    // Mock UserModel lookup
    vi.spyOn(UserModel, 'findById').mockResolvedValue({
      _id: 'mock-doctor-id',
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      email: 'doctor@healthbridge.in',
      name: 'Dr. Sharma',
      phone: '9876543211',
    } as any);

    const res = await request(app)
      .get('/protected-clinical')
      .set('Authorization', `Bearer ${validDoctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.clinical).toBe(true);
    expect(res.body.user.role).toBe('DOCTOR');
  });
});
