/**
 * HealthBridge India — Read-Only Immutable Audit Log Query & Redacted Export Service (Phase 18)
 *
 * Enforces:
 * - Strictly read-only queries against append-only `AuditLogModel` (zero update/delete APIs)
 * - ReDoS-safe search escaping
 * - Recursive credential/PHI redaction on every returned record
 * - RFC-4180 CSV export with spreadsheet formula-injection neutralization (=, +, -, @, \t, \r)
 * - Self-auditing on every authorized export (`AUDIT_LOG_EXPORTED`)
 */

import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { AuditLogModel } from '../../security/models/audit-log.model';
import {
  sanitizeAuditMetadata,
  securityAuditMonitor,
} from '../../../security/security-audit.monitor';
import { AppError } from '../../../shared/errors/app-error';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().max(100).optional(),
  actorId: z.string().trim().max(80).optional(),
  actorRole: z
    .enum(['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN', 'SYSTEM', 'ANONYMOUS'])
    .optional(),
  resourceType: z.string().trim().max(80).optional(),
  outcome: z.enum(['SUCCESS', 'FAILURE', 'BLOCKED']).optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

export interface SanitizedAuditLogItem {
  id: string;
  actorId?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: string;
  requestId: string;
  correlationId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata: Record<string, unknown>;
}

function escapeRegExp(val: string): string {
  return val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Neutralizes spreadsheet formula injection (CSV Injection / DDE) and applies RFC-4180 quoting.
 */
export function escapeAuditCsvCell(raw: unknown): string {
  const str = raw === undefined || raw === null ? '' : String(raw);
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  const escaped = neutralized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildRedactedAuditCsv(items: SanitizedAuditLogItem[]): string {
  const headers = [
    'Event ID',
    'Timestamp (ISO)',
    'Action',
    'Outcome',
    'Actor Role',
    'Actor ID',
    'Resource Type',
    'Resource ID',
    'Request ID',
    'Correlation ID',
    'Redacted Metadata',
  ];

  const rows = items.map((item) =>
    [
      item.id,
      item.timestamp,
      item.action,
      item.outcome,
      item.actorRole,
      item.actorId || '',
      item.resourceType,
      item.resourceId || '',
      item.requestId,
      item.correlationId || '',
      JSON.stringify(sanitizeAuditMetadata(item.metadata) || {}),
    ]
      .map(escapeAuditCsvCell)
      .join(',')
  );

  return [headers.map(escapeAuditCsvCell).join(','), ...rows].join('\r\n');
}

export class AuditLogQueryService {
  private buildFilter(query: AuditLogQueryInput): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.action) {
      filter.action = new RegExp(escapeRegExp(query.action), 'i');
    }
    if (query.actorId && Types.ObjectId.isValid(query.actorId)) {
      filter.actorId = new Types.ObjectId(query.actorId);
    }
    if (query.actorRole) {
      filter.actorRole = query.actorRole;
    }
    if (query.resourceType) {
      filter.resourceType = new RegExp(escapeRegExp(query.resourceType), 'i');
    }
    if (query.outcome) {
      filter.outcome = query.outcome;
    }
    if (query.from || query.to) {
      const range: Record<string, Date> = {};
      if (query.from) {
        const d = new Date(query.from);
        if (!Number.isNaN(d.getTime())) range.$gte = d;
      }
      if (query.to) {
        const d = new Date(query.to);
        if (!Number.isNaN(d.getTime())) range.$lte = d;
      }
      if (Object.keys(range).length > 0) {
        filter.timestamp = range;
      }
    }
    if (query.search) {
      const regex = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [
        { action: regex },
        { resourceType: regex },
        { resourceId: regex },
        { requestId: regex },
        { correlationId: regex },
      ];
    }

    return filter;
  }

  private normalizeDoc(doc: Record<string, any>): SanitizedAuditLogItem {
    return {
      id: String(doc._id || doc.id || ''),
      actorId: doc.actorId ? String(doc.actorId) : undefined,
      actorRole: doc.actorRole || 'SYSTEM',
      action: String(doc.action || ''),
      resourceType: String(doc.resourceType || ''),
      resourceId: doc.resourceId ? String(doc.resourceId) : undefined,
      timestamp: doc.timestamp ? new Date(doc.timestamp).toISOString() : new Date().toISOString(),
      requestId: String(doc.requestId || ''),
      correlationId: doc.correlationId ? String(doc.correlationId) : undefined,
      outcome: doc.outcome || 'SUCCESS',
      metadata: sanitizeAuditMetadata(doc.metadata) || {},
    };
  }

  async listLogs(query: AuditLogQueryInput): Promise<{
    items: SanitizedAuditLogItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
      return {
        items: [],
        pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    const filter = this.buildFilter(query);
    const skip = (query.page - 1) * query.limit;

    const [docs, total] = await Promise.all([
      AuditLogModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(query.limit).lean(),
      AuditLogModel.countDocuments(filter),
    ]);

    return {
      items: docs.map((d) => this.normalizeDoc(d)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / query.limit),
      },
    };
  }

  async getLogById(id: string): Promise<SanitizedAuditLogItem> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid audit log identifier.');
    }
    const doc = await AuditLogModel.findById(id).lean();
    if (!doc) {
      throw AppError.notFound('Audit log record not found.');
    }
    return this.normalizeDoc(doc);
  }

  async getSummary(): Promise<{
    totalEvents: number;
    last24hTotal: number;
    last24hBlocked: number;
    last24hFailures: number;
    byOutcome: Record<string, number>;
    immutabilityEnforced: true;
  }> {
    if (mongoose.connection.readyState !== 1) {
      return {
        totalEvents: 0,
        last24hTotal: 0,
        last24hBlocked: 0,
        last24hFailures: 0,
        byOutcome: { SUCCESS: 0, FAILURE: 0, BLOCKED: 0 },
        immutabilityEnforced: true,
      };
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalEvents, last24hTotal, last24hBlocked, last24hFailures, outcomeAgg] =
      await Promise.all([
        AuditLogModel.countDocuments({}),
        AuditLogModel.countDocuments({ timestamp: { $gte: since24h } }),
        AuditLogModel.countDocuments({ timestamp: { $gte: since24h }, outcome: 'BLOCKED' }),
        AuditLogModel.countDocuments({ timestamp: { $gte: since24h }, outcome: 'FAILURE' }),
        AuditLogModel.aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$outcome', count: { $sum: 1 } } },
        ]),
      ]);

    const byOutcome: Record<string, number> = { SUCCESS: 0, FAILURE: 0, BLOCKED: 0 };
    for (const row of outcomeAgg) {
      if (row._id) byOutcome[row._id] = row.count;
    }

    return {
      totalEvents,
      last24hTotal,
      last24hBlocked,
      last24hFailures,
      byOutcome,
      immutabilityEnforced: true,
    };
  }

  async exportRedactedCsv(
    query: AuditLogQueryInput,
    actor: { actorId: string; actorRole: string; requestId?: string }
  ): Promise<{ csv: string; rowCount: number }> {
    const cappedQuery: AuditLogQueryInput = { ...query, page: 1, limit: 100 };
    let items: SanitizedAuditLogItem[] = [];

    if (mongoose.connection.readyState === 1) {
      const filter = this.buildFilter(cappedQuery);
      const docs = await AuditLogModel.find(filter).sort({ timestamp: -1 }).limit(1000).lean();
      items = docs.map((d) => this.normalizeDoc(d));
    }

    await securityAuditMonitor.record({
      actorId: actor.actorId,
      actorRole: actor.actorRole as any,
      action: 'AUDIT_LOG_EXPORTED',
      resourceType: 'AUDIT_LOG',
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: {
        exportedRowCount: items.length,
        appliedOutcomeFilter: query.outcome || 'ALL',
        appliedRoleFilter: query.actorRole || 'ALL',
      },
    });

    return {
      csv: buildRedactedAuditCsv(items),
      rowCount: items.length,
    };
  }
}

export const auditLogQueryService = new AuditLogQueryService();
export default auditLogQueryService;
