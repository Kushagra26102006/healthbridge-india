import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { UserModel } from '../../src/modules/users/models/user.model';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import { MedicalRecordModel } from '../../src/modules/healthcare/models/medical-record.model';
import {
  createSyntheticActorRoster,
  createSyntheticAuditLogDocument,
  createSyntheticMedicalRecordPayload,
  SYNTHETIC_FILES,
} from '../fixtures/synthetic-healthcare-fixtures';

describe('Phase 19 Integration Tests — Medical Document Management & Immutable Audit Log APIs', () => {
  const app = createApp();
  const roster = createSyntheticActorRoster();

  const mockUsersById = new Map<string, any>([
    [roster.patientA.id, { _id: roster.patientA.objectId, role: 'PATIENT', accountStatus: 'ACTIVE', email: roster.patientA.email }],
    [roster.patientB.id, { _id: roster.patientB.objectId, role: 'PATIENT', accountStatus: 'ACTIVE', email: roster.patientB.email }],
    [roster.doctorA.id, { _id: roster.doctorA.objectId, role: 'DOCTOR', accountStatus: 'ACTIVE', email: roster.doctorA.email }],
    [roster.pharmacyA.id, { _id: roster.pharmacyA.objectId, role: 'PHARMACY', accountStatus: 'ACTIVE', email: roster.pharmacyA.email }],
    [roster.adminA.id, { _id: roster.adminA.objectId, role: 'ADMIN', accountStatus: 'ACTIVE', email: roster.adminA.email }],
  ]);

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const user = mockUsersById.get(id?.toString() || String(id)) ?? null;
      return Promise.resolve(user);
    }) as any);
  });

  describe('Phase 18 Centralized Immutable Audit Log API (/api/v1/audit)', () => {
    it('blocks unauthenticated (401) and non-admin (403) callers from reading or exporting audit logs', async () => {
      const unauth = await request(app).get('/api/v1/audit/logs');
      expect(unauth.status).toBe(401);

      const patientForbidden = await request(app)
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${roster.patientA.token}`);
      expect(patientForbidden.status).toBe(403);

      const doctorExportForbidden = await request(app)
        .get('/api/v1/audit/export')
        .set('Authorization', `Bearer ${roster.doctorA.token}`);
      expect(doctorExportForbidden.status).toBe(403);
    });

    it('enforces append-only immutability by exposing zero PUT/PATCH/DELETE audit endpoints', async () => {
      const fakeId = new Types.ObjectId().toString();
      const delRes = await request(app)
        .delete(`/api/v1/audit/logs/${fakeId}`)
        .set('Authorization', `Bearer ${roster.adminA.token}`);
      expect(delRes.status).toBe(404);

      const putRes = await request(app)
        .put(`/api/v1/audit/logs/${fakeId}`)
        .set('Authorization', `Bearer ${roster.adminA.token}`)
        .send({ outcome: 'FAILURE' });
      expect(putRes.status).toBe(404);
    });

    it('allows ADMIN to query redacted audit logs and export formula-safe CSV', async () => {
      const syntheticAudit = createSyntheticAuditLogDocument({
        action: 'RECORD_ACCESSED',
        actorRole: 'PATIENT',
        resourceType: '=CMD("evil")',
        metadata: { password: 'should-never-leak-raw', safeFlag: true },
      });

      const chain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([syntheticAudit]),
      };
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1 as any);
      vi.spyOn(AuditLogModel, 'find').mockReturnValue(chain as any);
      vi.spyOn(AuditLogModel, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      const listRes = await request(app)
        .get('/api/v1/audit/logs?actorRole=PATIENT&outcome=SUCCESS&limit=10')
        .set('Authorization', `Bearer ${roster.adminA.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.items).toHaveLength(1);
      expect(listRes.body.data.items[0].metadata.password).toBe('[REDACTED]');
      expect(listRes.body.data.items[0].metadata.safeFlag).toBe(true);

      const csvRes = await request(app)
        .get('/api/v1/audit/export?outcome=SUCCESS')
        .set('Authorization', `Bearer ${roster.adminA.token}`);

      expect(csvRes.status).toBe(200);
      expect(csvRes.headers['content-type']).toContain('text/csv');
      expect(csvRes.text).toContain(`"'=CMD(""evil"")"`);
      expect(csvRes.text).not.toContain('should-never-leak-raw');
    });
  });

  describe('Phase 16 Secure Medical Document API (/api/v1/records)', () => {
    it('rejects spoofed executable uploaded with PDF MIME metadata', async () => {
      const payload = createSyntheticMedicalRecordPayload({
        fileName: 'spoofed.pdf',
        mimeType: 'application/pdf',
        fileData: `data:application/pdf;base64,${SYNTHETIC_FILES.spoofedExecutableBase64}`,
      });

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${roster.patientA.token}`)
        .send(payload);

      expect([400, 415, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('rejects cross-patient IDOR access token issuance and rejects tampered preview tokens', async () => {
      const recordId = new Types.ObjectId().toString();
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordId),
        patientId: roster.patientA.objectId,
        title: 'Patient A Private Lab Report',
        mimeType: 'application/pdf',
        fileName: 'private.pdf',
        fileData: `data:application/pdf;base64,${SYNTHETIC_FILES.validPdfBase64}`,
        isArchived: false,
      } as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      // Patient B attempting to request a signed access token for Patient A's record -> 403
      const idorTokenRes = await request(app)
        .get(`/api/v1/records/${recordId}/access-token`)
        .set('Authorization', `Bearer ${roster.patientB.token}`);
      expect(idorTokenRes.status).toBe(403);

      // Tampered signed preview token -> 401
      const badPreviewRes = await request(app).get(
        `/api/v1/records/${recordId}/preview?token=tampered.invalid.sig`
      );
      expect([401, 403]).toContain(badPreviewRes.status);
    });

    it('prevents non-patient roles (PHARMACY, DOCTOR) from archiving patient medical documents', async () => {
      const recordId = new Types.ObjectId().toString();

      const doctorDel = await request(app)
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${roster.doctorA.token}`);
      expect(doctorDel.status).toBe(403);

      const pharmacyDel = await request(app)
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${roster.pharmacyA.token}`);
      expect(pharmacyDel.status).toBe(403);
    });
  });
});
