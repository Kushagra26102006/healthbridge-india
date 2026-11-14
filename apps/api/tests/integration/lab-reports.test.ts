import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { LaboratoryReportModel } from '../../src/modules/healthcare/models/lab-report.model';
import { LaboratoryOrderModel } from '../../src/modules/healthcare/models/lab-order.model';
import { Types } from 'mongoose';

describe('Laboratory Reports & Orders API & Security Isolation Integration Tests', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();

  const patientAToken = tokenService.generateAccessToken({
    _id: patientAId,
    role: 'PATIENT',
    email: 'patient.a@healthbridge.in',
  } as any);

  const patientBToken = tokenService.generateAccessToken({
    _id: patientBId,
    role: 'PATIENT',
    email: 'patient.b@healthbridge.in',
  } as any);

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === patientAId) {
        return Promise.resolve({
          _id: new Types.ObjectId(patientAId),
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          email: 'patient.a@healthbridge.in',
        } as any);
      }
      if (idStr === patientBId) {
        return Promise.resolve({
          _id: new Types.ObjectId(patientBId),
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          email: 'patient.b@healthbridge.in',
        } as any);
      }
      return Promise.resolve(null);
    }) as any);
  });

  describe('Authentication & Access Control', () => {
    it('should reject unauthenticated request to /api/v1/lab-reports with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/lab-reports');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should allow authenticated patient to query lab reports list', async () => {
      const res = await request(app)
        .get('/api/v1/lab-reports')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should allow authenticated patient to query lab report summary metrics', async () => {
      const res = await request(app)
        .get('/api/v1/lab-reports/summary')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBeDefined();
      expect(res.body.data.completed).toBeDefined();
    });

    it('should filter laboratory reports by category (e.g. HEMATOLOGY)', async () => {
      const res = await request(app)
        .get('/api/v1/lab-reports?category=HEMATOLOGY')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(
        res.body.data.every((r: any) => r.category === 'HEMATOLOGY')
      ).toBe(true);
    });
  });

  describe('Patient Privacy & Cross-Patient Isolation', () => {
    it("should strictly forbid Patient A from accessing Patient B's lab report (403 FORBIDDEN)", async () => {
      const reportBId = new Types.ObjectId().toString();

      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(reportBId),
            reportNumber: 'LBR-2026-9999',
            patientId: new Types.ObjectId(patientBId), // Belongs to Patient B!
            testName: 'Confidential Biopsy Panel',
            category: 'BIOCHEMISTRY',
            observations: [
              {
                testName: 'Marker X',
                value: '4.2',
                unit: 'ng/mL',
                referenceRange: '< 2.5',
                interpretation: 'ABOVE_RANGE',
              },
            ],
            publishedAt: new Date(),
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportBId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it("should strictly forbid Patient A from downloading Patient B's lab report document (403 FORBIDDEN)", async () => {
      const reportBId = new Types.ObjectId().toString();

      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(reportBId),
            reportNumber: 'LBR-2026-9999',
            patientId: new Types.ObjectId(patientBId), // Belongs to Patient B!
            testName: 'Confidential Biopsy Panel',
            publishedAt: new Date(),
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportBId}/download`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should reject invalid MongoDB ObjectId in reportId route parameter with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/v1/lab-reports/invalid-not-an-id')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Report Details & Document Download', () => {
    it('should allow Patient A to view their own report with observation values and reference ranges', async () => {
      const ownReportId = new Types.ObjectId().toString();

      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(ownReportId),
            reportNumber: 'LBR-2026-1001',
            patientId: new Types.ObjectId(patientAId), // Belongs to Patient A
            testName: 'Complete Blood Count (CBC)',
            category: 'HEMATOLOGY',
            testDate: new Date(),
            publishedAt: new Date(),
            status: 'COMPLETED',
            observations: [
              {
                testName: 'Hemoglobin (Hb)',
                value: '14.2',
                unit: 'g/dL',
                referenceRange: '13.0 - 17.0',
                interpretation: 'NORMAL',
              },
            ],
            reportUrl: `/api/v1/lab-reports/${ownReportId}/download`,
            documentMimeType: 'application/pdf',
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${ownReportId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testName).toBe('Complete Blood Count (CBC)');
      expect(res.body.data.observations.length).toBe(1);
      expect(res.body.data.observations[0].interpretation).toBe('NORMAL');
    });

    it('should allow Patient A to download authorized diagnostic report document stream', async () => {
      const ownReportId = new Types.ObjectId().toString();

      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(ownReportId),
            reportNumber: 'LBR-2026-1001',
            patientId: new Types.ObjectId(patientAId),
            testName: 'Complete Blood Count (CBC)',
            publishedAt: new Date(),
            status: 'COMPLETED',
            documentMimeType: 'application/pdf',
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${ownReportId}/download`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/pdf');
      expect(res.header['content-disposition']).toContain('attachment');
      const body = res.text || (res.body ? res.body.toString('utf-8') : '');
      expect(body).toContain('%PDF');
    });
  });

  describe('Laboratory Orders', () => {
    it('should allow authenticated patient to query lab orders', async () => {
      const res = await request(app)
        .get('/api/v1/lab-orders')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it("should strictly forbid Patient A from viewing Patient B's lab order (403 FORBIDDEN)", async () => {
      const orderBId = new Types.ObjectId().toString();

      vi.spyOn(LaboratoryOrderModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(orderBId),
            orderNumber: 'LBO-2026-9999',
            patientId: new Types.ObjectId(patientBId), // Belongs to Patient B!
            orderedAt: new Date(),
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/lab-orders/${orderBId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow Patient A to view their own lab order details', async () => {
      const ownOrderId = new Types.ObjectId().toString();

      vi.spyOn(LaboratoryOrderModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(ownOrderId),
            orderNumber: 'LBO-2026-1001',
            patientId: new Types.ObjectId(patientAId), // Belongs to Patient A!
            tests: [
              {
                testCode: 'CBC01',
                testName: 'Complete Blood Count (CBC)',
                category: 'HEMATOLOGY',
              },
            ],
            status: 'ORDERED',
            collectionStatus: 'PENDING',
            orderedAt: new Date(),
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/lab-orders/${ownOrderId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBe('LBO-2026-1001');
      expect(res.body.data.tests.length).toBe(1);
    });
  });
});

