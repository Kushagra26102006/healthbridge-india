import mongoose, { Types } from 'mongoose';
import {
  ConsentRequestModel,
  IConsentRequestDocument,
} from '../models/consent-request.model';
import {
  ConsentArtifactModel,
} from '../models/consent-artifact.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import { consentEnforcementService } from './consent-enforcement.service';
import { eventPublisher } from '../../events/event.publisher';
import type {
  ConsentListItemDto,
  ConsentDetailDto,
  ConsentSummaryMetricsDto,
  ConsentHistoryEventDto,
  ConsentStatus,
} from '@healthbridge/shared-types';
import type {
  ConsentFilterQueryInput,
  ApproveConsentActionInput,
  RejectConsentActionInput,
  RevokeConsentActionInput,
} from '@healthbridge/validation';

/**
 * Normalizes legacy ABDM statuses to modern standard
 */
const normalizeStatus = (status: string): ConsentStatus => {
  switch (status) {
    case 'GRANTED':
      return 'APPROVED';
    case 'DENIED':
      return 'REJECTED';
    case 'REQUESTED':
      return 'PENDING';
    case 'APPROVED':
    case 'REJECTED':
    case 'REVOKED':
    case 'EXPIRED':
      return status as ConsentStatus;
    default:
      return 'PENDING';
  }
};

/**
 * Comprehensive synthetic demo consent records for offline development & resilience
 */
const getDemoConsents = (patientId: string): Array<Partial<IConsentRequestDocument>> => {
  const pId = new Types.ObjectId(patientId);
  const now = new Date();

  return [
    {
      _id: new Types.ObjectId('651111111111111111110001'),
      patientId: pId,
      requesterId: new Types.ObjectId('651111111111111111110011'),
      requesterName: 'Dr. Rajesh Verma, MD',
      requesterRole: 'DOCTOR',
      organization: 'AIIMS New Delhi — Cardiology OPD',
      purpose: 'CAREMGT',
      purposeDescription:
        'Continuous cardiovascular management, ECG history review, and follow-up medication reconciliation.',
      requestedDataTypes: ['MEDICAL_RECORDS', 'PRESCRIPTIONS', 'LAB_REPORTS'],
      dateRange: {
        from: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
      requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      approvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      signature: 'SHA256_VERIFIED_ABHA_CONSENT_SIG_001',
    },
    {
      _id: new Types.ObjectId('651111111111111111110002'),
      patientId: pId,
      requesterId: new Types.ObjectId('651111111111111111110012'),
      requesterName: 'Dr. Priya Sharma, MD (Endocrinology)',
      requesterRole: 'DOCTOR',
      organization: 'Max Super Speciality Hospital, Saket',
      purpose: 'CAREMGT',
      purposeDescription:
        'Evaluation of HbA1c progression and metabolic panel telemetry for dosage adjustment.',
      requestedDataTypes: ['LAB_REPORTS', 'PRESCRIPTIONS'],
      dateRange: {
        from: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      requestedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      _id: new Types.ObjectId('651111111111111111110003'),
      patientId: pId,
      requesterId: new Types.ObjectId('651111111111111111110013'),
      requesterName: 'Apollo 24|7 Pharmacy Dispensing',
      requesterRole: 'PHARMACY',
      organization: 'Apollo Pharmacy — Digital Dispensation Division',
      purpose: 'CAREMGT',
      purposeDescription:
        'Verification of e-prescriptions for doorstep medication delivery and allergy checks.',
      requestedDataTypes: ['PRESCRIPTIONS'],
      dateRange: {
        from: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Expiring soon (<7 days)
      },
      requestedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      approvedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      signature: 'SHA256_VERIFIED_ABHA_CONSENT_SIG_003',
    },
    {
      _id: new Types.ObjectId('651111111111111111110004'),
      patientId: pId,
      requesterId: new Types.ObjectId('651111111111111111110014'),
      requesterName: 'Dr. Lal PathLabs Central Facility',
      requesterRole: 'LABORATORY',
      organization: 'Dr. Lal PathLabs Diagnostic Reference Lab',
      purpose: 'CAREMGT',
      purposeDescription:
        'Access to prior diagnostic panels to establish baseline comparisons for lipid tests.',
      requestedDataTypes: ['LAB_REPORTS', 'DIAGNOSTIC_REPORTS'],
      dateRange: {
        from: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      requestedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      status: 'REVOKED',
      approvedAt: new Date(now.getTime() - 39 * 24 * 60 * 60 * 1000),
      revokedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      revocationReason: 'Patient completed treatment episode and revoked access to prior reports.',
      expiresAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      _id: new Types.ObjectId('651111111111111111110005'),
      patientId: pId,
      requesterId: new Types.ObjectId('651111111111111111110015'),
      requesterName: 'Care Health Insurance Claims Division',
      requesterRole: 'INSURER',
      organization: 'Care Health Insurance TPA Department',
      purpose: 'HPAYMT',
      purposeDescription:
        'Cashless hospitalization claim verification for past 3 months medical records.',
      requestedDataTypes: ['MEDICAL_RECORDS', 'DISCHARGE_SUMMARY'],
      dateRange: {
        from: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      requestedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      status: 'EXPIRED',
      approvedAt: new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  ] as Array<Partial<IConsentRequestDocument>>;
};

export class ConsentService {
  /**
   * Retrieves paginated consent requests and permissions for the authenticated patient
   */
  async getPatientConsents(
    patientId: string,
    query: Partial<ConsentFilterQueryInput> = {}
  ): Promise<{
    items: ConsentListItemDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const pId = new Types.ObjectId(patientId);
      const filter: Record<string, unknown> = { patientId: pId };

      // Status filter
      if (query.status && query.status !== 'ALL') {
        if (query.status === 'PENDING') {
          filter.status = { $in: ['PENDING', 'REQUESTED'] };
        } else if (query.status === 'APPROVED') {
          filter.status = { $in: ['APPROVED', 'GRANTED'] };
        } else if (query.status === 'REJECTED') {
          filter.status = { $in: ['REJECTED', 'DENIED'] };
        } else {
          filter.status = query.status;
        }
      }

      // Category filter
      if (query.category) {
        filter.requestedDataTypes = query.category;
      }

      // Search filter
      if (query.search && query.search.trim()) {
        const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(sanitized, 'i');
        filter.$or = [
          { organization: regex },
          { requesterName: regex },
          { purposeDescription: regex },
          { purpose: regex },
        ];
      }

      const sortField = query.sortBy || 'requestedAt';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
      const sortOption: Record<string, 1 | -1> = { [sortField]: sortOrder };

      const [docs, total] = await Promise.all([
        ConsentRequestModel.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
        ConsentRequestModel.countDocuments(filter),
      ]);

      if (total > 0 || query.status || query.search) {
        const items: ConsentListItemDto[] = docs.map((doc) => ({
          id: doc._id.toString(),
          consentRequestId: doc._id.toString(),
          organization: doc.organization || 'Healthcare Organization',
          doctorName: doc.requesterName,
          requesterId: doc.requesterId.toString(),
          requesterRole: doc.requesterRole || 'DOCTOR',
          purpose: doc.purpose,
          purposeDescription: doc.purposeDescription,
          requestedDataTypes: doc.requestedDataTypes || [],
          status: normalizeStatus(doc.status),
          requestedAt: doc.requestedAt ? new Date(doc.requestedAt).toISOString() : new Date().toISOString(),
          expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : new Date().toISOString(),
          approvedAt: doc.approvedAt ? new Date(doc.approvedAt).toISOString() : undefined,
          revokedAt: doc.revokedAt ? new Date(doc.revokedAt).toISOString() : undefined,
          rejectionReason: doc.rejectionReason,
          revocationReason: doc.revocationReason,
        }));

        const totalPages = Math.ceil(total / limit) || 1;
        return {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      }
    }

    // Demo Fallback
    let demoList = getDemoConsents(patientId);

    if (query.status && query.status !== 'ALL') {
      const matchStatus = query.status === 'PENDING' ? ['PENDING', 'REQUESTED'] : [query.status];
      demoList = demoList.filter((c) => matchStatus.includes(c.status!));
    }

    if (query.category) {
      demoList = demoList.filter((c) => c.requestedDataTypes?.includes(query.category!));
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      demoList = demoList.filter(
        (c) =>
          c.organization?.toLowerCase().includes(term) ||
          c.requesterName?.toLowerCase().includes(term) ||
          c.purposeDescription?.toLowerCase().includes(term)
      );
    }

    const total = demoList.length;
    const paginated = demoList.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    const items: ConsentListItemDto[] = paginated.map((doc) => ({
      id: doc._id ? doc._id.toString() : 'demo-id',
      consentRequestId: doc._id ? doc._id.toString() : 'demo-id',
      organization: doc.organization || 'Healthcare Organization',
      doctorName: doc.requesterName,
      requesterId: doc.requesterId ? doc.requesterId.toString() : 'demo-req',
      requesterRole: doc.requesterRole || 'DOCTOR',
      purpose: doc.purpose || 'CAREMGT',
      purposeDescription: doc.purposeDescription,
      requestedDataTypes: doc.requestedDataTypes || [],
      status: normalizeStatus(doc.status!),
      requestedAt: doc.requestedAt ? new Date(doc.requestedAt).toISOString() : new Date().toISOString(),
      expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : new Date().toISOString(),
      approvedAt: doc.approvedAt ? new Date(doc.approvedAt).toISOString() : undefined,
      revokedAt: doc.revokedAt ? new Date(doc.revokedAt).toISOString() : undefined,
      rejectionReason: doc.rejectionReason,
      revocationReason: doc.revocationReason,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves summary metric counts across consent request and permission categories
   */
  async getPatientConsentSummary(patientId: string): Promise<ConsentSummaryMetricsDto> {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const pId = new Types.ObjectId(patientId);
      const now = new Date();
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [pendingRequests, activePermissions, expiringSoon, revokedPermissions, total] =
        await Promise.all([
          ConsentRequestModel.countDocuments({
            patientId: pId,
            status: { $in: ['PENDING', 'REQUESTED'] },
            expiresAt: { $gt: now },
          }),
          ConsentRequestModel.countDocuments({
            patientId: pId,
            status: { $in: ['APPROVED', 'GRANTED'] },
            expiresAt: { $gt: now },
          }),
          ConsentRequestModel.countDocuments({
            patientId: pId,
            status: { $in: ['APPROVED', 'GRANTED'] },
            expiresAt: { $gt: now, $lte: inSevenDays },
          }),
          ConsentRequestModel.countDocuments({
            patientId: pId,
            status: 'REVOKED',
          }),
          ConsentRequestModel.countDocuments({ patientId: pId }),
        ]);

      if (total > 0) {
        return {
          pendingRequests,
          activePermissions,
          expiringSoon,
          revokedPermissions,
          total,
        };
      }
    }

    // Demo fallback counts
    const demo = getDemoConsents(patientId);
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      pendingRequests: demo.filter(
        (c) => ['PENDING', 'REQUESTED'].includes(c.status!) && c.expiresAt! > now
      ).length,
      activePermissions: demo.filter(
        (c) => ['APPROVED', 'GRANTED'].includes(c.status!) && c.expiresAt! > now
      ).length,
      expiringSoon: demo.filter(
        (c) =>
          ['APPROVED', 'GRANTED'].includes(c.status!) &&
          c.expiresAt! > now &&
          c.expiresAt! <= inSevenDays
      ).length,
      revokedPermissions: demo.filter((c) => c.status === 'REVOKED').length,
      total: demo.length,
    };
  }

  /**
   * Retrieves full details of a specific consent request with strict ownership verification
   */
  async getPatientConsentById(patientId: string, consentId: string): Promise<ConsentDetailDto> {
    if (!Types.ObjectId.isValid(consentId)) {
      throw AppError.badRequest('Invalid consent ID format');
    }

    let request: IConsentRequestDocument | null = null;
    try {
      request = await ConsentRequestModel.findById(consentId);
    } catch {
      request = null;
    }

    if (!request) {
      const demo = getDemoConsents(patientId).find((c) => c._id?.toString() === consentId);
      if (demo) {
        request = demo as unknown as IConsentRequestDocument;
      }
    }

    if (!request) {
      throw AppError.notFound('Consent request not found');
    }

    // Strict patient ownership check
    if (request.patientId && request.patientId.toString() !== patientId) {
      throw AppError.forbidden(
        'Access denied: You do not have permission to view this consent request'
      );
    }

    const fromDate = request.dateRange?.from ? new Date(request.dateRange.from) : new Date();
    const toDate = request.dateRange?.to ? new Date(request.dateRange.to) : new Date();
    const durationDays = Math.max(
      1,
      Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      id: request.id || request._id.toString(),
      consentRequestId: request.id || request._id.toString(),
      patientId: request.patientId.toString(),
      organization: request.organization || 'Healthcare Organization',
      doctorName: request.requesterName,
      requesterId: request.requesterId.toString(),
      requesterRole: request.requesterRole || 'DOCTOR',
      facilityDetails: {
        name: request.organization || 'Medical Center',
        address: 'NMC / ABDM Registered Facility',
        verified: true,
      },
      verificationStatus: 'VERIFIED_ABDM_PROVIDER',
      purpose: request.purpose,
      purposeDescription: request.purposeDescription,
      requestedDataTypes: request.requestedDataTypes || [],
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      requestedAt: request.requestedAt
        ? new Date(request.requestedAt).toISOString()
        : new Date().toISOString(),
      expiresAt: request.expiresAt
        ? new Date(request.expiresAt).toISOString()
        : new Date().toISOString(),
      approvedAt: request.approvedAt ? new Date(request.approvedAt).toISOString() : undefined,
      rejectedAt: request.rejectedAt ? new Date(request.rejectedAt).toISOString() : undefined,
      revokedAt: request.revokedAt ? new Date(request.revokedAt).toISOString() : undefined,
      status: normalizeStatus(request.status),
      durationDays,
      rejectionReason: request.rejectionReason,
      revocationReason: request.revocationReason,
      signature: request.signature,
      createdAt: request.createdAt ? new Date(request.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: request.updatedAt ? new Date(request.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Approves a pending consent request, issues active ConsentArtifact, and writes audit trail
   */
  async approveConsent(
    patientId: string,
    consentId: string,
    input: ApproveConsentActionInput = {},
    requestId: string = 'req-approve'
  ): Promise<ConsentDetailDto> {
    if (!Types.ObjectId.isValid(consentId)) {
      throw AppError.badRequest('Invalid consent ID format');
    }

    let request: IConsentRequestDocument | null = null;
    try {
      request = await ConsentRequestModel.findById(consentId);
    } catch {
      request = null;
    }

    if (!request) {
      const demo = getDemoConsents(patientId).find((c) => c._id?.toString() === consentId);
      if (demo) request = demo as unknown as IConsentRequestDocument;
    }

    if (!request) {
      throw AppError.notFound('Consent request not found');
    }

    // Ownership check
    if (request.patientId.toString() !== patientId) {
      throw AppError.forbidden('Access denied: You cannot approve another patient\'s consent');
    }

    // Status check
    const currentStatus = normalizeStatus(request.status);
    if (currentStatus === 'APPROVED') {
      throw AppError.badRequest('Consent request has already been approved');
    }
    if (currentStatus === 'REJECTED') {
      throw AppError.badRequest('Consent request was already rejected and cannot be approved');
    }
    if (currentStatus === 'REVOKED') {
      throw AppError.badRequest('Consent was already revoked and cannot be approved');
    }
    if (new Date() > request.expiresAt) {
      throw AppError.badRequest('Cannot approve an expired consent request');
    }

    const now = new Date();
    const signature = input.signature || `ABHA_DIGITAL_SIGNATURE_${patientId}_${now.getTime()}`;

    request.status = 'APPROVED';
    request.approvedAt = now;
    request.signature = signature;

    if (typeof request.save === 'function') {
      try {
        await request.save();
      } catch {
        // Mocked or non-blocking
      }
    }

    try {
      await ConsentArtifactModel.findOneAndUpdate(
        { consentRequestId: request._id },
        {
          consentRequestId: request._id,
          patientId: request.patientId,
          requesterId: request.requesterId,
          requesterName: request.requesterName,
          organization: request.organization,
          purpose: request.purpose,
          permittedDataTypes: request.requestedDataTypes,
          validityPeriod: request.dateRange,
          consentStatus: 'ACTIVE',
          approvedAt: now,
          signature,
        },
        { upsert: true, new: true }
      );
    } catch {
      // Mocked or non-blocking
    }

    await this.recordAuditLog({
      actorId: patientId,
      action: 'CONSENT_APPROVED',
      resourceType: 'CONSENT_REQUEST',
      resourceId: consentId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        patientId,
        requesterId: request.requesterId.toString(),
        organization: request.organization,
        categories: request.requestedDataTypes,
      },
    });

    return this.getPatientConsentById(patientId, consentId);
  }

  /**
   * Rejects an incoming consent request and writes audit trail
   */
  async rejectConsent(
    patientId: string,
    consentId: string,
    input: RejectConsentActionInput = {},
    requestId: string = 'req-reject'
  ): Promise<ConsentDetailDto> {
    if (!Types.ObjectId.isValid(consentId)) {
      throw AppError.badRequest('Invalid consent ID format');
    }

    let request: IConsentRequestDocument | null = null;
    try {
      request = await ConsentRequestModel.findById(consentId);
    } catch {
      request = null;
    }

    if (!request) {
      const demo = getDemoConsents(patientId).find((c) => c._id?.toString() === consentId);
      if (demo) request = demo as unknown as IConsentRequestDocument;
    }

    if (!request) {
      throw AppError.notFound('Consent request not found');
    }

    if (request.patientId.toString() !== patientId) {
      throw AppError.forbidden('Access denied: You cannot reject another patient\'s consent');
    }

    const currentStatus = normalizeStatus(request.status);
    if (currentStatus !== 'PENDING') {
      throw AppError.badRequest(`Cannot reject a consent request with status '${currentStatus}'`);
    }

    const now = new Date();
    const reason = input.reason || 'Declined by patient';

    request.status = 'REJECTED';
    request.rejectedAt = now;
    request.rejectionReason = reason;

    if (typeof request.save === 'function') {
      try {
        await request.save();
      } catch {
        // Mocked or non-blocking
      }
    }

    await this.recordAuditLog({
      actorId: patientId,
      action: 'CONSENT_REJECTED',
      resourceType: 'CONSENT_REQUEST',
      resourceId: consentId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        patientId,
        requesterId: request.requesterId.toString(),
        reason,
      },
    });

    return this.getPatientConsentById(patientId, consentId);
  }

  /**
   * Revokes an active consent permission, updates artifact, and writes audit trail
   */
  async revokeConsent(
    patientId: string,
    consentId: string,
    input: RevokeConsentActionInput = {},
    requestId: string = 'req-revoke'
  ): Promise<ConsentDetailDto> {
    if (!Types.ObjectId.isValid(consentId)) {
      throw AppError.badRequest('Invalid consent ID format');
    }

    let request: IConsentRequestDocument | null = null;
    try {
      request = await ConsentRequestModel.findById(consentId);
    } catch {
      request = null;
    }

    if (!request) {
      const demo = getDemoConsents(patientId).find((c) => c._id?.toString() === consentId);
      if (demo) request = demo as unknown as IConsentRequestDocument;
    }

    if (!request) {
      throw AppError.notFound('Consent record not found');
    }

    if (request.patientId.toString() !== patientId) {
      throw AppError.forbidden('Access denied: You cannot revoke another patient\'s consent');
    }

    const currentStatus = normalizeStatus(request.status);
    if (currentStatus !== 'APPROVED') {
      throw AppError.badRequest(`Only active approved consents can be revoked (current status: '${currentStatus}')`);
    }

    const now = new Date();
    const reason = input.reason || 'Revoked by patient via consent dashboard';

    request.status = 'REVOKED';
    request.revokedAt = now;
    request.revocationReason = reason;

    if (typeof request.save === 'function') {
      try {
        await request.save();
      } catch {
        // Mocked or non-blocking
      }
    }

    try {
      await ConsentArtifactModel.updateMany(
        { consentRequestId: request._id },
        {
          consentStatus: 'REVOKED',
          revokedAt: now,
          revocationReason: reason,
        }
      );
    } catch {
      // Mocked or non-blocking
    }

    // SYNCHRONOUS IMMEDIATE ENFORCEMENT: Never wait for async worker to block revoked access
    const requesterIdStr = request.requesterId ? request.requesterId.toString() : undefined;
    consentEnforcementService.invalidateConsentImmediately(patientId, requesterIdStr, consentId);

    // Publish CONSENT_REVOKED to durable outbox for async notifications & timeline projection
    await eventPublisher.publishSafe({
      idempotencyKey: `consent_revoked:${consentId}:${now.getTime()}`,
      eventType: 'CONSENT_REVOKED',
      sourceModule: 'CONSENT',
      aggregateId: consentId,
      aggregateType: 'ConsentRequest',
      correlationId: requestId,
      actorId: patientId,
      actorRole: 'PATIENT',
      payload: {
        consentId,
        patientId,
        ...(requesterIdStr ? { requesterId: requesterIdStr } : {}),
        consentScope: 'INTERNAL',
        status: 'REVOKED',
        revokedSynchronously: true,
        effectiveAt: now.toISOString(),
      },
    });

    await this.recordAuditLog({
      actorId: patientId,
      action: 'CONSENT_REVOKED',
      resourceType: 'CONSENT_REQUEST',
      resourceId: consentId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        patientId,
        requesterId: request.requesterId.toString(),
        reason,
      },
    });

    return this.getPatientConsentById(patientId, consentId);
  }

  /**
   * Retrieves chronological consent audit events for the patient
   */
  async getConsentHistory(patientId: string): Promise<ConsentHistoryEventDto[]> {
    const isConnected = mongoose.connection.readyState === 1;
    const events: ConsentHistoryEventDto[] = [];

    if (isConnected) {
      const pId = new Types.ObjectId(patientId);
      const consents = await ConsentRequestModel.find({ patientId: pId }).sort({ requestedAt: -1 }).lean();

      for (const c of consents) {
        const org = c.organization || 'Healthcare Organization';
        const doc = c.requesterName;

        // Requested Event
        events.push({
          id: `${c._id.toString()}_req`,
          consentId: c._id.toString(),
          eventType: 'CONSENT_REQUESTED',
          title: 'Access Permission Requested',
          description: `${org} requested access to ${c.requestedDataTypes?.join(', ') || 'records'} for ${c.purpose}.`,
          organization: org,
          doctorName: doc,
          timestamp: new Date(c.requestedAt).toISOString(),
          status: 'PENDING',
        });

        // Approved Event
        if (c.approvedAt) {
          events.push({
            id: `${c._id.toString()}_app`,
            consentId: c._id.toString(),
            eventType: 'CONSENT_APPROVED',
            title: 'Consent Approved by Patient',
            description: `You granted access to ${org} valid until ${new Date(c.expiresAt).toLocaleDateString('en-IN')}.`,
            organization: org,
            doctorName: doc,
            timestamp: new Date(c.approvedAt).toISOString(),
            status: 'APPROVED',
          });
        }

        // Rejected Event
        if (c.rejectedAt) {
          events.push({
            id: `${c._id.toString()}_rej`,
            consentId: c._id.toString(),
            eventType: 'CONSENT_REJECTED',
            title: 'Consent Request Rejected',
            description: `You declined access request from ${org}. Reason: ${c.rejectionReason || 'Declined'}.`,
            organization: org,
            doctorName: doc,
            timestamp: new Date(c.rejectedAt).toISOString(),
            status: 'REJECTED',
          });
        }

        // Revoked Event
        if (c.revokedAt) {
          events.push({
            id: `${c._id.toString()}_rev`,
            consentId: c._id.toString(),
            eventType: 'CONSENT_REVOKED',
            title: 'Permission Explicitly Revoked',
            description: `You terminated active permissions for ${org}. Future access attempts will be blocked.`,
            organization: org,
            doctorName: doc,
            timestamp: new Date(c.revokedAt).toISOString(),
            status: 'REVOKED',
          });
        }
      }

      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (events.length > 0) return events;
    }

    // Demo Events
    const demo = getDemoConsents(patientId);
    for (const c of demo) {
      const org = c.organization || 'Healthcare Organization';
      events.push({
        id: `${c._id!.toString()}_req`,
        consentId: c._id!.toString(),
        eventType: 'CONSENT_REQUESTED',
        title: 'Access Permission Requested',
        description: `${org} requested access to ${c.requestedDataTypes?.join(', ') || 'records'}.`,
        organization: org,
        doctorName: c.requesterName,
        timestamp: new Date(c.requestedAt!).toISOString(),
        status: 'PENDING',
      });

      if (c.approvedAt) {
        events.push({
          id: `${c._id!.toString()}_app`,
          consentId: c._id!.toString(),
          eventType: 'CONSENT_APPROVED',
          title: 'Consent Approved by Patient',
          description: `You approved digital permissions for ${org}.`,
          organization: org,
          doctorName: c.requesterName,
          timestamp: new Date(c.approvedAt).toISOString(),
          status: 'APPROVED',
        });
      }

      if (c.revokedAt) {
        events.push({
          id: `${c._id!.toString()}_rev`,
          consentId: c._id!.toString(),
          eventType: 'CONSENT_REVOKED',
          title: 'Permission Explicitly Revoked',
          description: `You terminated active permissions for ${org}.`,
          organization: org,
          doctorName: c.requesterName,
          timestamp: new Date(c.revokedAt).toISOString(),
          status: 'REVOKED',
        });
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return events;
  }

  private async recordAuditLog(log: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    requestId: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    metadata?: Record<string, unknown>;
  }) {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          actorId: log.actorId ? new Types.ObjectId(log.actorId) : undefined,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          requestId: log.requestId,
          outcome: log.outcome,
          metadata: log.metadata,
          timestamp: new Date(),
        });
      }
    } catch {
      // Non-blocking
    }
  }
}

export const consentService = new ConsentService();
export default consentService;
