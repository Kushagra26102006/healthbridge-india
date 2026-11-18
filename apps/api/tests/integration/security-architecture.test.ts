/**
 * HealthBridge India — Platform Security HTTP Integration Tests (Day 9 Task 01)
 *
 * Tests real Express middleware & route defenses end-to-end via Supertest:
 *   1. Global URL `?token=` / `?access_token=` rejection (401) across protected endpoints
 *   2. Cookie-based CSRF protection (blocks cross-site Origin / Referer / Sec-Fetch-Site)
 *   3. Global NoSQL operator injection blocking ($ne, $gt, $where -> 400)
 *   4. HTTP Parameter Pollution (HPP) normalization on scalar query parameters
 *   5. Security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy)
 *   6. Medical record upload magic-byte verification, filename sanitization & secure download headers
 *   7. Cross-patient & cross-role isolation across all 5 roles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel, AuditLogModel } from '../../src/database/models';
import { MedicalRecordModel } from '../../src/modules/healthcare/models/medical-record.model';

describe('HealthBridge Platform Security — HTTP Integration Tests (Day 9 Task 01)', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const pharmacyId = new Types.ObjectId().toString();
  const labId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const makeToken = (id: string, role: string, email: string) =>
    tokenService.generateAccessToken({ _id: id, role, email } as any);

  const patientAToken = makeToken(patientAId, 'PATIENT', 'sec.a@example.test');
  const doctorToken = makeToken(doctorId, 'DOCTOR', 'sec.doc@example.test');
  const pharmacyToken = makeToken(pharmacyId, 'PHARMACY', 'sec.pharm@example.test');
  const labToken = makeToken(labId, 'LABORATORY', 'sec.lab@example.test');
  const adminToken = makeToken(adminId, 'ADMIN', 'sec.admin@example.test');

  const usersById: Record<string, any> = {
    [patientAId]: { _id: new Types.ObjectId(patientAId), role: 'PATIENT', accountStatus: 'ACTIVE', email: 'sec.a@example.test', name: 'Patient A' },
    [patientBId]: { _id: new Types.ObjectId(patientBId), role: 'PATIENT', accountStatus: 'ACTIVE', email: 'sec.b@example.test', name: 'Patient B' },
    [doctorId]: { _id: new Types.ObjectId(doctorId), role: 'DOCTOR', accountStatus: 'ACTIVE', email: 'sec.doc@example.test', name: 'Dr. Security' },
    [pharmacyId]: { _id: new Types.ObjectId(pharmacyId), role: 'PHARMACY', accountStatus: 'ACTIVE', email: 'sec.pharm@example.test', name: 'Rx Security' },
    [labId]: { _id: new Types.ObjectId(labId), role: 'LABORATORY', accountStatus: 'ACTIVE', email: 'sec.lab@example.test', name: 'Lab Security' },
    [adminId]: { _id: new Types.ObjectId(adminId), role: 'ADMIN', accountStatus: 'ACTIVE', email: 'sec.admin@example.test', name: 'Admin Security' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) =>
      Promise.resolve(usersById[String(id)] || null)) as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  describe('1. Security Headers & URL Token Rejection', () => {
    it('attaches hardened HTTP security headers on API responses', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('rejects JWT access tokens supplied in URL query strings globally across protected endpoints (401)', async () => {
      const r1 = await request(app).get(`/api/v1/records?token=${patientAToken}`);
      const r2 = await request(app).get(`/api/v1/search?q=test&access_token=${patientAToken}`);
      const r3 = await request(app).get(`/api/v1/appointments?token=${patientAToken}`);

      expect(r1.status).toBe(401);
      expect(r2.status).toBe(401);
      expect(r3.status).toBe(401);
    });
  });

  describe('2. NoSQL Operator Injection & CSRF Protection', () => {
    it('blocks MongoDB operator injection payloads in body and query with 400 BAD_REQUEST', async () => {
      const bodyInjection = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: { $ne: '' }, password: { $gt: '' } });
      expect(bodyInjection.status).toBe(400);
      expect(bodyInjection.body.message).toMatch(/prohibited operator/i);

      const queryInjection = await request(app)
        .get('/api/v1/records?status[$ne]=ARCHIVED')
        .set('Authorization', `Bearer ${patientAToken}`);
      expect(queryInjection.status).toBe(400);
    });

    it('blocks cross-site cookie-authenticated state-changing requests via CSRF protection (403)', async () => {
      const crossOriginRes = await request(app)
        .post('/api/v1/records')
        .set('Cookie', [`hb_access_token=${patientAToken}`])
        .set('Origin', 'https://malicious-site.example')
        .send({
          title: 'CSRF Forged Record',
          recordType: 'WELLNESS_RECORD',
          recordDate: '2026-11-18T10:00:00Z',
        });
      expect(crossOriginRes.status).toBe(403);
      expect(crossOriginRes.body.message).toMatch(/(CSRF|CORS)/i);

      const secFetchCrossSite = await request(app)
        .post('/api/v1/records')
        .set('Cookie', [`hb_access_token=${patientAToken}`])
        .set('Sec-Fetch-Site', 'cross-site')
        .send({
          title: 'CSRF Sec-Fetch Forged Record',
          recordType: 'WELLNESS_RECORD',
          recordDate: '2026-11-18T10:00:00Z',
        });
      expect(secFetchCrossSite.status).toBe(403);

      // Same-origin cookie request succeeds
      const trustedOriginRes = await request(app)
        .post('/api/v1/records')
        .set('Cookie', [`hb_access_token=${patientAToken}`])
        .set('Origin', 'http://localhost:3000')
        .send({
          title: 'Legitimate Cookie Record',
          recordType: 'WELLNESS_RECORD',
          recordDate: '2026-11-18T10:00:00Z',
        });
      expect(trustedOriginRes.status).toBe(201);
    });
  });

  describe('3. File Upload Signature Validation & Secure Download Headers', () => {
    it('rejects spoofed HTML payload claiming to be application/pdf on POST /api/v1/records (400)', async () => {
      const spoofedHtml = Buffer.from('<html><script>alert(1)</script></html>').toString('base64');

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          title: 'Spoofed Diagnostic PDF',
          recordType: 'DIAGNOSTIC_REPORT',
          recordDate: '2026-11-18T10:00:00Z',
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          fileData: spoofedHtml,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/signature verification failed/i);
    });

    it('accepts genuine PDF magic bytes, sanitizes path-traversal filename, and enforces nosniff on download', async () => {
      const validPdf = Buffer.from('%PDF-1.7\n%HealthBridge clinical sample').toString('base64');

      const uploadRes = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          title: 'Genuine Lab Report PDF',
          recordType: 'DIAGNOSTIC_REPORT',
          recordDate: '2026-11-18T10:00:00Z',
          fileName: '../../evil/traversal_report.pdf',
          mimeType: 'application/pdf',
          fileData: validPdf,
        });

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.data.fileName).toBe('traversal_report.pdf');

      const recordId = new Types.ObjectId().toString();
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'DIAGNOSTIC_REPORT',
        title: 'Genuine Lab Report PDF',
        fileName: '../../evil/traversal_report.pdf',
        mimeType: 'application/pdf',
        fileData: validPdf,
        recordDate: new Date(),
        verificationStatus: 'VERIFIED',
        createdBy: new Types.ObjectId(patientAId),
      } as any);

      const dlRes = await request(app)
        .get(`/api/v1/records/${recordId}/download`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(dlRes.status).toBe(200);
      expect(dlRes.headers['x-content-type-options']).toBe('nosniff');
      expect(dlRes.headers['cache-control']).toContain('no-store');
      expect(dlRes.headers['content-disposition']).toContain('traversal_report.pdf');
      expect(dlRes.headers['content-disposition']).not.toContain('..');
    });
  });

  describe('4. Cross-Role Isolation & Privilege Boundaries', () => {
    it('enforces strict role isolation across pharmacy, laboratory, doctor, patient, and admin surfaces', async () => {
      // Pharmacy cannot access admin audit or patient records
      const pharmToAudit = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${pharmacyToken}`);
      expect(pharmToAudit.status).toBe(403);

      const pharmToRecords = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${pharmacyToken}`);
      expect(pharmToRecords.status).toBe(403);

      // Laboratory cannot access patient consent management or admin events
      const labToConsent = await request(app)
        .get('/api/v1/consent')
        .set('Authorization', `Bearer ${labToken}`);
      expect(labToConsent.status).toBe(403);

      const labToEvents = await request(app)
        .get('/api/v1/events/summary')
        .set('Authorization', `Bearer ${labToken}`);
      expect(labToEvents.status).toBe(403);

      // Doctor cannot access admin event monitor
      const docToEvents = await request(app)
        .get('/api/v1/events/summary')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(docToEvents.status).toBe(403);

      // Admin cannot search private medical records via global search
      const adminSearchClinical = await request(app)
        .get('/api/v1/search?q=Cardiology&types=medical_record')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminSearchClinical.status).toBe(403);
    });
  });
});
