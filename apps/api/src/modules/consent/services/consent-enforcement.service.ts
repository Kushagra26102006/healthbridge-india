import mongoose, { Types } from 'mongoose';
import { ConsentArtifactModel } from '../models/consent-artifact.model';
import { ConsentRequestModel } from '../models/consent-request.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';

export interface ConsentValidationOptions {
  requesterId: string;
  requesterRole: string;
  patientId: string;
  dataCategory: string; // e.g. MEDICAL_RECORDS, PRESCRIPTIONS, LAB_REPORTS, DIAGNOSTIC_REPORTS, ENCOUNTER_INFO
  purpose?: string;
  requestId?: string;
}

export interface ConsentValidationResult {
  authorized: boolean;
  reason?: string;
  consentArtifactId?: string;
}

export class ConsentEnforcementService {
  /**
   * Evaluates electronic consent authorization for a requester attempting to access patient health records.
   * Fails closed: if no valid, active, non-expired, category-matching consent exists, access is DENIED.
   */
  async validateAccess(options: ConsentValidationOptions): Promise<ConsentValidationResult> {
    const { requesterId, requesterRole, patientId, dataCategory, requestId } = options;

    // 1. Patient self-access is always authorized
    if (requesterId === patientId) {
      return { authorized: true };
    }

    // 2. System Administrators (Auditing purposes)
    if (requesterRole === 'ADMIN') {
      await this.recordAuditLog({
        actorId: requesterId,
        action: 'ADMIN_PATIENT_DATA_INSPECTION',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId: requestId || 'req-system',
        outcome: 'SUCCESS',
        metadata: { patientId, dataCategory, reason: 'Administrative inspection' },
      });
      return { authorized: true };
    }

    const pId = Types.ObjectId.isValid(patientId) ? new Types.ObjectId(patientId) : patientId;
    const rId = Types.ObjectId.isValid(requesterId) ? new Types.ObjectId(requesterId) : requesterId;
    const now = new Date();

    let artifact: any = null;
    let request: any = null;

    try {
      const artQuery = ConsentArtifactModel.findOne({
        patientId: pId,
        requesterId: rId,
      });
      artifact = artQuery && typeof artQuery.sort === 'function'
        ? await artQuery.sort({ createdAt: -1 })
        : await artQuery;
    } catch {
      artifact = null;
    }

    if (!artifact) {
      try {
        const reqQuery = ConsentRequestModel.findOne({
          patientId: pId,
          requesterId: rId,
        });
        request = reqQuery && typeof reqQuery.sort === 'function'
          ? await reqQuery.sort({ createdAt: -1 })
          : await reqQuery;
      } catch {
        request = null;
      }
    }

    // Fail closed if neither exists
    if (!artifact && !request) {
      await this.recordAuditLog({
        actorId: requesterId,
        action: 'DATA_ACCESS_DENIED_NO_CONSENT',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId: requestId || 'req-blocked',
        outcome: 'BLOCKED',
        metadata: { patientId, dataCategory, reason: 'No consent record exists' },
      });
      return {
        authorized: false,
        reason: 'Access denied: No consent request or artifact found for this patient',
      };
    }

    // Evaluate Request if no artifact exists yet
    if (!artifact && request) {
      if (request.status === 'REVOKED') {
        return { authorized: false, reason: 'Access denied: Consent has been revoked by the patient' };
      }
      if (request.status === 'REJECTED' || request.status === 'DENIED') {
        return { authorized: false, reason: 'Access denied: Consent request was rejected by the patient' };
      }
      if (request.expiresAt && now > new Date(request.expiresAt)) {
        return { authorized: false, reason: 'Access denied: Consent request has expired' };
      }
      if (request.status !== 'APPROVED' && request.status !== 'GRANTED') {
        return { authorized: false, reason: 'Access denied: Consent request is still pending patient review' };
      }

      const normalizedRequestedCategory = dataCategory.toUpperCase();
      const hasCategory = (request.requestedDataTypes || []).some(
        (t: string) => t.toUpperCase() === normalizedRequestedCategory
      );

      if (!hasCategory) {
        return {
          authorized: false,
          reason: `Access denied: Consent does not authorize access to category '${dataCategory}'`,
        };
      }

      return { authorized: true };
    }

    // Evaluate Artifact Status
    if (artifact.consentStatus === 'REVOKED') {
      await this.recordAuditLog({
        actorId: requesterId,
        action: 'DATA_ACCESS_DENIED_REVOKED',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId: requestId || 'req-blocked',
        outcome: 'BLOCKED',
        metadata: { patientId, dataCategory, consentArtifactId: artifact.id },
      });
      return { authorized: false, reason: 'Access denied: Consent has been revoked by the patient' };
    }

    const validityTo = artifact.validityPeriod?.to ? new Date(artifact.validityPeriod.to) : null;
    const validityFrom = artifact.validityPeriod?.from ? new Date(artifact.validityPeriod.from) : null;

    if (artifact.consentStatus === 'EXPIRED' || (validityTo && now > validityTo)) {
      await this.recordAuditLog({
        actorId: requesterId,
        action: 'DATA_ACCESS_DENIED_EXPIRED',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId: requestId || 'req-blocked',
        outcome: 'BLOCKED',
        metadata: { patientId, dataCategory, consentArtifactId: artifact.id },
      });
      return { authorized: false, reason: 'Access denied: Consent validity window has expired' };
    }

    if (validityFrom && now < validityFrom) {
      return {
        authorized: false,
        reason: 'Access denied: Consent validity period has not started yet',
      };
    }

    // Check category scope
    const normalizedRequestedCategory = dataCategory.toUpperCase();
    const permittedCategories = (artifact.permittedDataTypes || []).map((t: string) =>
      t.toUpperCase()
    );
    const hasPermittedCategory = permittedCategories.includes(normalizedRequestedCategory);

    if (!hasPermittedCategory) {
      await this.recordAuditLog({
        actorId: requesterId,
        action: 'DATA_ACCESS_DENIED_SCOPE_EXCEEDED',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId: requestId || 'req-blocked',
        outcome: 'BLOCKED',
        metadata: {
          patientId,
          dataCategory,
          permittedCategories: artifact.permittedDataTypes,
        },
      });
      return {
        authorized: false,
        reason: `Access denied: Active consent does not authorize category '${dataCategory}'`,
      };
    }

    // Authorized!
    await this.recordAuditLog({
      actorId: requesterId,
      action: 'DATA_ACCESSED_UNDER_CONSENT',
      resourceType: dataCategory,
      resourceId: patientId,
      requestId: requestId || 'req-success',
      outcome: 'SUCCESS',
      metadata: {
        patientId,
        dataCategory,
        consentArtifactId: artifact.id || artifact._id?.toString(),
        purpose: artifact.purpose,
      },
    });

    return {
      authorized: true,
      consentArtifactId: artifact.id || artifact._id?.toString(),
    };
  }

  /**
   * Enforces consent or throws a 403 Forbidden AppError
   */
  async enforce(options: ConsentValidationOptions): Promise<void> {
    const result = await this.validateAccess(options);
    if (!result.authorized) {
      throw AppError.forbidden(result.reason || 'Access denied: Consent required');
    }
  }

  /**
   * Helper to write immutable audit logs safely
   */
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
          actorId: log.actorId && Types.ObjectId.isValid(log.actorId) ? new Types.ObjectId(log.actorId) : undefined,
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

export const consentEnforcementService = new ConsentEnforcementService();
export default consentEnforcementService;
