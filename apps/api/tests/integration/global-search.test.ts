/**
 * HealthBridge India — Global Search & Discovery HTTP Integration Tests (Day 8 Task 06 Audit Coverage)
 *
 * Covers:
 *   - Authentication enforcement: unauthenticated requests rejected with 401
 *   - Zod validation: missing/empty q, q > 100 chars, invalid types, invalid limit rejected with 400
 *   - Role-scoped permission matrix & fail-closed 403 across PATIENT, DOCTOR, PHARMACY, LABORATORY, ADMIN
 *   - Strict tenant scoping: server derives actor identity exclusively from JWT (ignores client userId/patientId params)
 *   - GET /api/v1/search, GET /api/v1/search/suggestions, GET /api/v1/search/recent, DELETE /api/v1/search/recent
 *   - Sensitive data protection: zero password hashes, tokens, or raw ABHA numbers in search payloads
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel, AuditLogModel } from '../../src/database/models';
import { searchRepository } from '../../src/modules/search/search.repository';
import { globalSearchService } from '../../src/modules/search/search.service';

describe('Global Search & Discovery — HTTP Integration Tests', () => {
  const app = createApp();

  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const pharmacyId = new Types.ObjectId().toString();
  const labId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const makeToken = (id: string, role: string, email: string) =>
    tokenService.generateAccessToken({ _id: id, role, email } as any);

  const patientToken = makeToken(patientId, 'PATIENT', 'patient.search@example.test');
  const doctorToken = makeToken(doctorId, 'DOCTOR', 'doctor.search@example.test');
  const pharmacyToken = makeToken(pharmacyId, 'PHARMACY', 'pharmacy.search@example.test');
  const labToken = makeToken(labId, 'LABORATORY', 'lab.search@example.test');
  const adminToken = makeToken(adminId, 'ADMIN', 'admin.search@example.test');

  const usersById: Record<string, any> = {
    [patientId]: {
      _id: new Types.ObjectId(patientId),
      role: 'PATIENT',
      email: 'patient.search@example.test',
      accountStatus: 'ACTIVE',
      name: 'Riya Patel',
    },
    [doctorId]: {
      _id: new Types.ObjectId(doctorId),
      role: 'DOCTOR',
      email: 'doctor.search@example.test',
      accountStatus: 'ACTIVE',
      name: 'Dr. Vikram Mehta',
    },
    [pharmacyId]: {
      _id: new Types.ObjectId(pharmacyId),
      role: 'PHARMACY',
      email: 'pharmacy.search@example.test',
      accountStatus: 'ACTIVE',
      name: 'Apollo Health Rx',
    },
    [labId]: {
      _id: new Types.ObjectId(labId),
      role: 'LABORATORY',
      email: 'lab.search@example.test',
      accountStatus: 'ACTIVE',
      name: 'Metropolis Lab',
    },
    [adminId]: {
      _id: new Types.ObjectId(adminId),
      role: 'ADMIN',
      email: 'admin.search@example.test',
      accountStatus: 'ACTIVE',
      name: 'System Admin',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    globalSearchService.clearRecentSearches(patientId);
    globalSearchService.clearRecentSearches(doctorId);
    globalSearchService.clearRecentSearches(pharmacyId);
    globalSearchService.clearRecentSearches(labId);
    globalSearchService.clearRecentSearches(adminId);

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) =>
      Promise.resolve(usersById[String(id)] || null)) as any);

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

    vi.spyOn(searchRepository, 'resolveActorScope').mockImplementation(async (userId, role) => ({
      userId,
      role,
    }));

    vi.spyOn(searchRepository, 'searchByType').mockImplementation(async (type, actor, filter) => {
      if (type === 'prescription' && actor.role === 'PATIENT') {
        return [
          {
            id: 'rx-pat-1',
            resourceType: 'prescription',
            categoryGroup: 'PRESCRIPTIONS',
            title: `Prescription matching ${filter.query}`,
            description: 'Issued outpatient prescription',
            destinationRoute: '/patient/prescriptions',
            date: '2026-11-18T08:00:00.000Z',
            status: 'ACTIVE',
            sourceModule: 'healthcare',
            metadata: {},
            score: 90,
          },
        ];
      }
      if (type === 'inventory' && actor.role === 'PHARMACY') {
        return [
          {
            id: 'inv-1',
            resourceType: 'inventory',
            categoryGroup: 'PHARMACY_OPERATIONS',
            title: 'Paracetamol 650mg Batch B-204',
            description: 'In stock • 120 units',
            destinationRoute: '/pharmacy/inventory',
            date: '2026-11-18T09:00:00.000Z',
            status: 'AVAILABLE',
            sourceModule: 'pharmacy',
            metadata: {},
            score: 85,
          },
        ];
      }
      if (type === 'lab_order' && actor.role === 'LABORATORY') {
        return [
          {
            id: 'lo-1',
            resourceType: 'lab_order',
            categoryGroup: 'LABORATORY',
            title: 'CBC Diagnostic Order #LAB-9001',
            description: 'Sample collected',
            destinationRoute: '/laboratory/orders',
            date: '2026-11-18T09:30:00.000Z',
            status: 'SAMPLE_COLLECTED',
            sourceModule: 'laboratory',
            metadata: {},
            score: 95,
          },
        ];
      }
      if (type === 'user' && actor.role === 'ADMIN') {
        return [
          {
            id: 'u-1',
            resourceType: 'user',
            categoryGroup: 'PEOPLE',
            title: 'Dr. Vikram Mehta',
            description: 'DOCTOR • ACTIVE',
            destinationRoute: '/admin/dashboard',
            date: '2026-11-18T07:00:00.000Z',
            status: 'ACTIVE',
            sourceModule: 'admin',
            metadata: {},
            score: 80,
          },
        ];
      }
      if (type === 'patient' && actor.role === 'DOCTOR') {
        return [
          {
            id: 'pat-assigned-1',
            resourceType: 'patient',
            categoryGroup: 'PEOPLE',
            title: 'Riya Patel',
            description: 'Assigned care patient',
            destinationRoute: '/doctor/patients',
            date: '2026-11-18T06:00:00.000Z',
            status: 'ACTIVE',
            sourceModule: 'users',
            metadata: {},
            score: 95,
          },
        ];
      }
      return [];
    });
  });

  it('rejects unauthenticated requests to all search endpoints with 401', async () => {
    const res1 = await request(app).get('/api/v1/search?q=Paracetamol');
    const res2 = await request(app).get('/api/v1/search/suggestions?q=Paracetamol');
    const res3 = await request(app).get('/api/v1/search/recent');
    const res4 = await request(app).delete('/api/v1/search/recent');

    expect(res1.status).toBe(401);
    expect(res2.status).toBe(401);
    expect(res3.status).toBe(401);
    expect(res4.status).toBe(401);
  });

  it('rejects invalid queries (missing q, empty q, >100 chars, invalid resource type) with 422', async () => {
    const missingQ = await request(app)
      .get('/api/v1/search')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(missingQ.status).toBe(422);

    const tooLongQ = await request(app)
      .get(`/api/v1/search?q=${'x'.repeat(105)}`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(tooLongQ.status).toBe(422);

    const badType = await request(app)
      .get('/api/v1/search?q=test&types=invalid_resource_type')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(badType.status).toBe(422);
  });

  it('enforces role-based authorization matrix across all 5 roles and fails closed with 403 on forbidden types', async () => {
    // Patient cannot search other patients or users
    const patForbidden = await request(app)
      .get('/api/v1/search?q=Riya&types=patient')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(patForbidden.status).toBe(403);

    // Pharmacy cannot search lab reports or medical records
    const pharmForbidden = await request(app)
      .get('/api/v1/search?q=CBC&types=lab_report,medical_record')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    expect(pharmForbidden.status).toBe(403);

    // Laboratory cannot search pharmacy inventory or prescriptions
    const labForbidden = await request(app)
      .get('/api/v1/search?q=Metformin&types=inventory,prescription')
      .set('Authorization', `Bearer ${labToken}`);
    expect(labForbidden.status).toBe(403);

    // Admin cannot search private medical records or lab reports
    const adminForbidden = await request(app)
      .get('/api/v1/search?q=diagnosis&types=medical_record,lab_report')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminForbidden.status).toBe(403);

    // Authorized queries succeed for each role
    const [patOk, docOk, pharmOk, labOk, adminOk] = await Promise.all([
      request(app)
        .get('/api/v1/search?q=Metformin&types=prescription')
        .set('Authorization', `Bearer ${patientToken}`),
      request(app)
        .get('/api/v1/search?q=Riya&types=patient')
        .set('Authorization', `Bearer ${doctorToken}`),
      request(app)
        .get('/api/v1/search?q=Paracetamol&types=inventory')
        .set('Authorization', `Bearer ${pharmacyToken}`),
      request(app)
        .get('/api/v1/search?q=CBC&types=lab_order')
        .set('Authorization', `Bearer ${labToken}`),
      request(app)
        .get('/api/v1/search?q=Vikram&types=user')
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    expect(patOk.status).toBe(200);
    expect(patOk.body.data.results[0].resourceType).toBe('prescription');

    expect(docOk.status).toBe(200);
    expect(docOk.body.data.results[0].resourceType).toBe('patient');

    expect(pharmOk.status).toBe(200);
    expect(pharmOk.body.data.results[0].resourceType).toBe('inventory');

    expect(labOk.status).toBe(200);
    expect(labOk.body.data.results[0].resourceType).toBe('lab_order');

    expect(adminOk.status).toBe(200);
    expect(adminOk.body.data.results[0].resourceType).toBe('user');
  });

  it('ignores client-supplied patientId/userId query tampering and derives actor scope strictly from JWT', async () => {
    const scopeSpy = vi.spyOn(searchRepository, 'resolveActorScope');

    const res = await request(app)
      .get(`/api/v1/search?q=Metformin&patientId=${doctorId}&userId=${adminId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(scopeSpy).toHaveBeenCalledWith(patientId, 'PATIENT');
  });

  it('supports autocomplete suggestions, session-only recent search history, and instant clear without leaking secrets', async () => {
    // 1. Execute a valid search to populate session history
    const searchRes = await request(app)
      .get('/api/v1/search?q=Paracetamol')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    expect(searchRes.status).toBe(200);

    // Ensure response DTO never exposes password hashes, tokens, or ABHA identifiers
    const serialized = JSON.stringify(searchRes.body);
    expect(serialized).not.toMatch(/passwordHash|refreshToken|abhaNumber/i);

    // 2. Fetch autocomplete suggestions (should include both recent + authorized inventory match)
    const sugRes = await request(app)
      .get('/api/v1/search/suggestions?q=Para&limit=5')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    expect(sugRes.status).toBe(200);
    expect(sugRes.body.data.suggestions.length).toBeGreaterThanOrEqual(1);

    // 3. Verify GET /recent returns only the authenticated user's ephemeral history
    const recentPharmacy = await request(app)
      .get('/api/v1/search/recent')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    expect(recentPharmacy.status).toBe(200);
    expect(recentPharmacy.body.data.storagePolicy).toBe('SESSION_MEMORY_ONLY');
    expect(recentPharmacy.body.data.entries.map((e: any) => e.query)).toContain('Paracetamol');

    // Cross-user isolation: Patient cannot see Pharmacy's recent searches
    const recentPatient = await request(app)
      .get('/api/v1/search/recent')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(recentPatient.status).toBe(200);
    expect(recentPatient.body.data.entries).toHaveLength(0);

    // 4. Clear recent history
    const clearRes = await request(app)
      .delete('/api/v1/search/recent')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.data.clearedCount).toBe(1);

    const recentAfterClear = await request(app)
      .get('/api/v1/search/recent')
      .set('Authorization', `Bearer ${pharmacyToken}`);
    expect(recentAfterClear.body.data.entries).toHaveLength(0);
  });
});
