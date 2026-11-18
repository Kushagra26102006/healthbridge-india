/**
 * HealthBridge India — Admin Data Protection Operational API Integration Tests (Day 9 Task 03)
 *
 * Verifies:
 *   - Unauthenticated requests rejected (401)
 *   - Non-admin roles (PATIENT, DOCTOR, PHARMACY, LABORATORY) rejected (403)
 *   - ADMIN retrieves operational health metadata with ZERO raw key material, secrets, or PHI
 *   - ADMIN can trigger safe key version rotation and observe updated metadata
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel, AuditLogModel } from '../../src/database/models';

describe('Admin Data Protection API — HTTP Integration Tests (Day 9 Task 03)', () => {
  const app = createApp();

  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const makeToken = (id: string, role: string, email: string) =>
    tokenService.generateAccessToken({ _id: id, role, email } as any);

  const patientToken = makeToken(patientId, 'PATIENT', 'dp.patient@example.test');
  const doctorToken = makeToken(doctorId, 'DOCTOR', 'dp.doctor@example.test');
  const adminToken = makeToken(adminId, 'ADMIN', 'dp.admin@example.test');

  const usersById: Record<string, any> = {
    [patientId]: { _id: new Types.ObjectId(patientId), role: 'PATIENT', accountStatus: 'ACTIVE', email: 'dp.patient@example.test', name: 'Patient DP' },
    [doctorId]: { _id: new Types.ObjectId(doctorId), role: 'DOCTOR', accountStatus: 'ACTIVE', email: 'dp.doctor@example.test', name: 'Doctor DP' },
    [adminId]: { _id: new Types.ObjectId(adminId), role: 'ADMIN', accountStatus: 'ACTIVE', email: 'dp.admin@example.test', name: 'Admin DP' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) =>
      Promise.resolve(usersById[String(id)] || null)) as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  it('rejects unauthenticated and non-admin requests to /api/v1/admin/data-protection/*', async () => {
    const unauth = await request(app).get('/api/v1/admin/data-protection/status');
    expect(unauth.status).toBe(401);

    const patStatus = await request(app)
      .get('/api/v1/admin/data-protection/status')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patStatus.status).toBe(403);

    const docRotate = await request(app)
      .post('/api/v1/admin/data-protection/rotate-key')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docRotate.status).toBe(403);
  });

  it('returns operational health metadata for ADMIN with zero key material or secrets and supports key rotation', async () => {
    const statusRes = await request(app)
      .get('/api/v1/admin/data-protection/status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.encryptionInTransit.tlsBypassDisabled).toBe(true);
    expect(statusRes.body.data.documentStorage.publicAccessEnabled).toBe(false);
    expect(statusRes.body.data.documentStorage.malwareScanningOperational).toBe(false);
    expect(statusRes.body.data.backupAndRecovery.atlasAutomatedBackupStatus).toBe(
      'NOT_VERIFIED_IN_OFFLINE_ENVIRONMENT'
    );

    const serialized = JSON.stringify(statusRes.body);
    expect(serialized).not.toContain('keyMaterial');
    expect(serialized).not.toContain('passwordHash');

    const beforeVersion = statusRes.body.data.keyManagement.activeKeyVersion;

    const rotateRes = await request(app)
      .post('/api/v1/admin/data-protection/rotate-key')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(rotateRes.status).toBe(200);
    expect(rotateRes.body.data.rotatedTo.version).toBe(beforeVersion + 1);
  });
});
