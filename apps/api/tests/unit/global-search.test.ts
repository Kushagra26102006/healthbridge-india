/**
 * HealthBridge India — Global Search & Discovery Unit Tests (Day 8 Task 06 Audit Coverage)
 *
 * Verifies:
 *   1. Centralized ROLE_SEARCH_PERMISSION_MATRIX for all 5 roles (PATIENT, DOCTOR, PHARMACY, LABORATORY, ADMIN)
 *   2. Fail-closed resolveAuthorizedSearchTypes (403 FORBIDDEN on unauthorized resource requests)
 *   3. Query sanitization, ReDoS regex escaping, prefix/contains regex safety
 *   4. Privacy-first sensitive query blocking for session-only history (ABHA, Aadhaar, credentials, sensitive clinical terms)
 *   5. Deterministic relevance scoring (exact identifier=100, exact title=95, prefix=80, partial=60, secondary=40)
 *   6. GlobalSearchService deduplication, sorting, grouping, pagination, ephemeral recent search TTL & instant clear
 *   7. Operational-only audit logging & slow-query telemetry (NEVER logs raw search query text or PHI)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ROLE_SEARCH_PERMISSION_MATRIX,
  getAllowedSearchTypesForRole,
  resolveAuthorizedSearchTypes,
} from '../../src/modules/search/search.permissions';
import {
  sanitizeSearchQuery,
  escapeRegexSpecialChars,
  buildSafeContainsRegex,
  buildSafePrefixRegex,
  isSensitiveHistoryQuery,
  computeMatchScore,
} from '../../src/modules/search/search.validation';
import { GlobalSearchService } from '../../src/modules/search/search.service';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import { logger } from '../../src/utils/logger';
import type { GlobalSearchResultItemDto } from '@healthbridge/shared-types';

describe('Global Search Permissions, Validation & Orchestration — Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ROLE_SEARCH_PERMISSION_MATRIX & fail-closed authorization', () => {
    it('never permits PATIENT to search other patients, inventory, dispensing, or users', () => {
      const allowed = getAllowedSearchTypesForRole('PATIENT');
      expect(allowed).toContain('appointment');
      expect(allowed).toContain('prescription');
      expect(allowed).toContain('lab_report');
      expect(allowed).toContain('doctor');
      expect(allowed).not.toContain('patient');
      expect(allowed).not.toContain('user');
      expect(allowed).not.toContain('inventory');
      expect(allowed).not.toContain('dispensing');
      expect(allowed).not.toContain('lab_sample');
    });

    it('never permits PHARMACY to search general patients, encounters, lab reports, or medical records', () => {
      const allowed = getAllowedSearchTypesForRole('PHARMACY');
      expect(allowed).toContain('prescription');
      expect(allowed).toContain('inventory');
      expect(allowed).toContain('medicine');
      expect(allowed).toContain('dispensing');
      expect(allowed).not.toContain('patient');
      expect(allowed).not.toContain('encounter');
      expect(allowed).not.toContain('lab_report');
      expect(allowed).not.toContain('medical_record');
      expect(allowed).not.toContain('external_record');
    });

    it('never permits LABORATORY to search prescriptions, pharmacy inventory, or general encounters', () => {
      const allowed = getAllowedSearchTypesForRole('LABORATORY');
      expect(allowed).toEqual(['lab_order', 'lab_sample', 'lab_test', 'lab_report', 'patient']);
      expect(allowed).not.toContain('prescription');
      expect(allowed).not.toContain('inventory');
      expect(allowed).not.toContain('encounter');
      expect(allowed).not.toContain('medical_record');
    });

    it('never permits ADMIN to search clinical notes, encounters, prescriptions, or lab reports', () => {
      const allowed = getAllowedSearchTypesForRole('ADMIN');
      expect(allowed).toContain('user');
      expect(allowed).toContain('doctor');
      expect(allowed).toContain('pharmacy');
      expect(allowed).toContain('laboratory');
      expect(allowed).not.toContain('medical_record');
      expect(allowed).not.toContain('encounter');
      expect(allowed).not.toContain('lab_report');
      expect(allowed).not.toContain('prescription');
      expect(allowed).not.toContain('external_record');
    });

    it('fails closed with 403 FORBIDDEN when caller requests only unauthorized resource types', () => {
      expect(() => resolveAuthorizedSearchTypes('PATIENT', ['patient', 'user'])).toThrow(
        /not authorized/i
      );
      expect(() => resolveAuthorizedSearchTypes('PHARMACY', ['lab_report', 'encounter'])).toThrow(
        /not authorized/i
      );
      expect(() => resolveAuthorizedSearchTypes('ADMIN', ['medical_record'])).toThrow(
        /not authorized/i
      );
    });

    it('intersects mixed requested types down to only the role-authorized subset', () => {
      const resolved = resolveAuthorizedSearchTypes('PATIENT', [
        'prescription',
        'patient',
        'user',
        'doctor',
      ]);
      expect(resolved).toEqual(['prescription', 'doctor']);
    });

    it('covers all 5 platform roles explicitly', () => {
      expect(Object.keys(ROLE_SEARCH_PERMISSION_MATRIX).sort()).toEqual([
        'ADMIN',
        'DOCTOR',
        'LABORATORY',
        'PATIENT',
        'PHARMACY',
      ]);
    });
  });

  describe('Query sanitization, ReDoS protection & sensitive history blocking', () => {
    it('strips control characters, collapses whitespace, and enforces 100-character max length', () => {
      expect(sanitizeSearchQuery('  hello\u0000\u001F   world\t\n ')).toBe('hello world');
      expect(sanitizeSearchQuery('a'.repeat(250)).length).toBe(100);
    });

    it('escapes all RegExp metacharacters to prevent catastrophic backtracking (ReDoS)', () => {
      const hostile = '(a+)+$^[.*+?{}|()\\]';
      const escaped = escapeRegexSpecialChars(hostile);
      const regex = buildSafeContainsRegex(hostile);
      expect(regex.test(hostile)).toBe(true);
      expect(escaped).toContain('\\(a\\+\\)\\+\\$');
      const prefix = buildSafePrefixRegex('RX-[2026]');
      expect(prefix.test('RX-[2026]-001')).toBe(true);
      expect(prefix.test('PREFIX-RX-[2026]')).toBe(false);
    });

    it('blocks ABHA numbers, Aadhaar numbers, credentials, and sensitive clinical terms from session history', () => {
      expect(isSensitiveHistoryQuery('12-3456-7890-1234')).toBe(true);
      expect(isSensitiveHistoryQuery('12345678901234')).toBe(true);
      expect(isSensitiveHistoryQuery('1234 5678 9012')).toBe(true);
      expect(isSensitiveHistoryQuery('reset password token')).toBe(true);
      expect(isSensitiveHistoryQuery('HIV screening')).toBe(true);
      expect(isSensitiveHistoryQuery('psychiatric evaluation')).toBe(true);
      expect(isSensitiveHistoryQuery('   ')).toBe(true);

      // Non-sensitive operational/provider queries are allowed in session memory
      expect(isSensitiveHistoryQuery('Cardiology')).toBe(false);
      expect(isSensitiveHistoryQuery('Paracetamol')).toBe(false);
      expect(isSensitiveHistoryQuery('RX-2026-0001')).toBe(false);
    });

    it('computes deterministic relevance scores across exact, title, prefix, partial, and secondary matches', () => {
      expect(computeMatchScore('RX-1001', 'Prescription', ['RX-1001'])).toBe(100);
      expect(computeMatchScore('Cardiology', 'Cardiology')).toBe(95);
      expect(computeMatchScore('Cardio', 'Cardiology Clinic')).toBe(80);
      expect(computeMatchScore('Clinic', 'Cardiology Clinic')).toBe(60);
      expect(computeMatchScore('Mumbai', 'Metro Lab', [], 'Located in Mumbai')).toBe(40);
      expect(computeMatchScore('unrelated', 'Metro Lab', [], 'Delhi')).toBe(20);
    });
  });

  describe('GlobalSearchService orchestration, deduplication, history & privacy-safe audit', () => {
    const sampleItems: GlobalSearchResultItemDto[] = [
      {
        id: 'rx-1',
        resourceType: 'prescription',
        categoryGroup: 'PRESCRIPTIONS',
        title: 'Metformin 500mg',
        description: 'Active outpatient prescription',
        destinationRoute: '/patient/prescriptions',
        date: '2026-11-10T10:00:00.000Z',
        status: 'ACTIVE',
        sourceModule: 'healthcare',
        metadata: {},
        score: 80,
      },
      {
        // Duplicate with higher score should win deduplication
        id: 'rx-1',
        resourceType: 'prescription',
        categoryGroup: 'PRESCRIPTIONS',
        title: 'Metformin 500mg',
        description: 'Active outpatient prescription',
        destinationRoute: '/patient/prescriptions',
        date: '2026-11-10T10:00:00.000Z',
        status: 'ACTIVE',
        sourceModule: 'healthcare',
        metadata: {},
        score: 95,
      },
      {
        id: 'doc-1',
        resourceType: 'doctor',
        categoryGroup: 'HEALTHCARE_PROVIDERS',
        title: 'Dr. Ananya Sharma',
        description: 'Cardiology • Verified HPR',
        destinationRoute: '/patient/appointments',
        date: '2026-11-15T10:00:00.000Z',
        status: 'ACTIVE',
        sourceModule: 'users',
        metadata: {},
        score: 60,
      },
    ];

    it('deduplicates, ranks, paginates, records non-sensitive session history, and NEVER logs raw query text in AuditLog', async () => {
      const mockRepo = {
        resolveActorScope: vi.fn().mockResolvedValue({ userId: 'u-patient-1', role: 'PATIENT' }),
        searchByType: vi.fn().mockImplementation(async (type: string) => {
          if (type === 'prescription') return [sampleItems[0], sampleItems[1]];
          if (type === 'doctor') return [sampleItems[2]];
          return [];
        }),
      };

      const auditSpy = vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger as any);

      const service = new GlobalSearchService(mockRepo as any);
      const result = await service.executeGlobalSearch(
        { userId: 'u-patient-1', role: 'PATIENT' },
        {
          q: 'Metformin',
          types: ['prescription', 'doctor'],
          page: 1,
          limit: 10,
          sortBy: 'relevance',
          sortOrder: 'desc',
        },
        'req-unit-1'
      );

      expect(result.results).toHaveLength(2);
      expect(result.results[0].id).toBe('rx-1');
      expect(result.results[0].score).toBe(95);
      expect(result.groupedCounts).toEqual({
        PRESCRIPTIONS: 1,
        HEALTHCARE_PROVIDERS: 1,
      });
      expect(result.pagination.total).toBe(2);
      expect(result.allowedTypes).toEqual(ROLE_SEARCH_PERMISSION_MATRIX.PATIENT);

      // Session-only recent search recorded and clearable
      const recent = service.getRecentSearches('u-patient-1');
      expect(recent).toHaveLength(1);
      expect(recent[0].query).toBe('Metformin');
      expect(recent[0].storagePolicy).toBe('SESSION_MEMORY_ONLY');

      const cleared = service.clearRecentSearches('u-patient-1');
      expect(cleared.clearedCount).toBe(1);
      expect(service.getRecentSearches('u-patient-1')).toHaveLength(0);

      // Operational-only audit event — must NOT contain the raw query string
      expect(auditSpy).toHaveBeenCalledTimes(1);
      const auditPayload = JSON.stringify(auditSpy.mock.calls[0][0]);
      expect(auditPayload).not.toContain('Metformin');
      expect(auditPayload).toContain('"queryLength":9');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('skips storing sensitive health queries in session history', async () => {
      const mockRepo = {
        resolveActorScope: vi.fn().mockResolvedValue({ userId: 'u-patient-2', role: 'PATIENT' }),
        searchByType: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      const service = new GlobalSearchService(mockRepo as any);
      await service.executeGlobalSearch(
        { userId: 'u-patient-2', role: 'PATIENT' },
        {
          q: '12-3456-7890-1234',
          page: 1,
          limit: 10,
          sortBy: 'relevance',
          sortOrder: 'desc',
        }
      );

      expect(service.getRecentSearches('u-patient-2')).toHaveLength(0);
    });

    it('rejects invalid date windows where from > to', async () => {
      const mockRepo = {
        resolveActorScope: vi.fn(),
        searchByType: vi.fn(),
      };
      const service = new GlobalSearchService(mockRepo as any);

      await expect(
        service.executeGlobalSearch(
          { userId: 'u-1', role: 'PATIENT' },
          {
            q: 'Cardio',
            from: '2026-12-01T00:00:00.000Z',
            to: '2026-11-01T00:00:00.000Z',
            page: 1,
            limit: 10,
            sortBy: 'relevance',
            sortOrder: 'desc',
          }
        )
      ).rejects.toThrow(/from.*after.*to/i);
    });
  });
});
