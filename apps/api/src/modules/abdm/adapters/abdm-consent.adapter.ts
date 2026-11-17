/**
 * HealthBridge India — ABDM Consent Adapter Service (Day 7 Task 01)
 *
 * Strictly separates internal HealthBridge ConsentArtifactModel records
 * (`origin: 'INTERNAL_HEALTHBRIDGE'`) from externally issued ABDM HIE-CM
 * signed Consent Artefacts (`origin: 'ABDM_HIE_CM'`).
 *
 * INVARIANT: An internal HealthBridge consent record MUST NEVER be treated
 * as a valid ABDM HIE-CM Consent Artefact for cross-ecosystem health data exchange.
 */

import type {
  AbdmConsentArtefactDto,
  AbdmConsentAccessCheckResultDto,
  AbdmHealthInfoType,
} from '@healthbridge/shared-types';
import type { IConsentArtifactDocument } from '../../consent/models/consent-artifact.model';

export interface ConsentAccessEvaluationRequest {
  artefact: AbdmConsentArtefactDto | null | undefined;
  requireAbdmOrigin: boolean;
  requestedHiType: AbdmHealthInfoType;
  requestedPurposeCode?: string;
  recordDateIso?: string;
  now?: Date;
}

export class AbdmConsentAdapter {
  /**
   * Adapts an internal HealthBridge ConsentArtifact document into a typed DTO
   * explicitly tagged with `origin: 'INTERNAL_HEALTHBRIDGE'` and `signatureVerified: false`
   * so downstream ABDM transfer paths can never mistake it for an HIE-CM signed artefact.
   */
  fromInternalConsentArtifact(doc: Partial<IConsentArtifactDocument>): AbdmConsentArtefactDto {
    const rawStatus = doc.consentStatus || 'ACTIVE';
    const mappedStatus =
      rawStatus === 'ACTIVE'
        ? 'GRANTED'
        : rawStatus === 'REVOKED'
        ? 'REVOKED'
        : 'EXPIRED';

    const hiTypeMap: Record<string, AbdmHealthInfoType> = {
      LAB_REPORT: 'DiagnosticReport',
      DIAGNOSTIC_REPORT: 'DiagnosticReport',
      PRESCRIPTION: 'Prescription',
      ENCOUNTER: 'OPConsultation',
      OP_CONSULTATION: 'OPConsultation',
      DISCHARGE_SUMMARY: 'DischargeSummary',
      MEDICAL_RECORD: 'HealthDocumentRecord',
      HEALTH_DOCUMENT: 'HealthDocumentRecord',
    };

    const mappedHiTypes = (doc.permittedDataTypes || [])
      .map((dt) => hiTypeMap[dt.toUpperCase()])
      .filter((v): v is AbdmHealthInfoType => Boolean(v));

    return {
      artefactId: doc._id ? doc._id.toString() : 'internal-consent',
      origin: 'INTERNAL_HEALTHBRIDGE',
      internalPatientId: doc.patientId?.toString(),
      purposeCode: doc.purpose || 'CAREMGT',
      hiTypes: mappedHiTypes.length > 0 ? Array.from(new Set(mappedHiTypes)) : ['HealthDocumentRecord'],
      dateRange: {
        from: doc.validityPeriod?.from
          ? new Date(doc.validityPeriod.from).toISOString()
          : new Date(0).toISOString(),
        to: doc.validityPeriod?.to
          ? new Date(doc.validityPeriod.to).toISOString()
          : new Date().toISOString(),
      },
      dataEraseAt: doc.validityPeriod?.to
        ? new Date(doc.validityPeriod.to).toISOString()
        : new Date().toISOString(),
      status: mappedStatus,
      grantedAt: doc.approvedAt ? new Date(doc.approvedAt).toISOString() : undefined,
      revokedAt: doc.revokedAt ? new Date(doc.revokedAt).toISOString() : undefined,
      signatureVerified: false,
    };
  }

  /**
   * Evaluates whether a consent artefact authorizes access to a requested health record.
   * Enforces origin boundary, active status, expiry, revocation, purpose limitation,
   * HI-type scope, date range, and signature verification for ABDM transfers.
   */
  evaluateConsentAccess(req: ConsentAccessEvaluationRequest): AbdmConsentAccessCheckResultDto {
    const now = req.now || new Date();
    const checkedAt = now.toISOString();

    if (!req.artefact) {
      return {
        authorized: false,
        origin: req.requireAbdmOrigin ? 'ABDM_HIE_CM' : 'INTERNAL_HEALTHBRIDGE',
        denialCode: 'CONSENT_MISSING',
        reason: 'No consent artefact provided for health information access.',
        checkedAt,
      };
    }

    const artefact = req.artefact;

    // Critical Boundary: Internal HealthBridge consent cannot authorize ABDM HIE-CM exchange
    if (req.requireAbdmOrigin && artefact.origin !== 'ABDM_HIE_CM') {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'INTERNAL_CONSENT_NOT_ABDM_ARTEFACT',
        reason:
          'Internal HealthBridge consent records cannot be misrepresented as ABDM HIE-CM signed Consent Artefacts.',
        checkedAt,
      };
    }

    if (req.requireAbdmOrigin && !artefact.signatureVerified) {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'SIGNATURE_UNVERIFIED',
        reason: 'ABDM Consent Artefact cryptographic signature has not been verified.',
        checkedAt,
      };
    }

    if (artefact.status === 'REVOKED' || Boolean(artefact.revokedAt)) {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'CONSENT_REVOKED',
        reason: 'Consent artefact has been revoked by the patient.',
        checkedAt,
      };
    }

    if (artefact.status === 'EXPIRED' || new Date(artefact.dataEraseAt).getTime() <= now.getTime()) {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'CONSENT_EXPIRED',
        reason: 'Consent artefact has expired and can no longer authorize data access.',
        checkedAt,
      };
    }

    if (artefact.status !== 'GRANTED') {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'CONSENT_NOT_GRANTED',
        reason: `Consent artefact is in non-granted status '${artefact.status}'.`,
        checkedAt,
      };
    }

    if (!artefact.hiTypes.includes(req.requestedHiType)) {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'HI_TYPE_NOT_PERMITTED',
        reason: `Requested HI-type '${req.requestedHiType}' is outside permitted consent scope.`,
        checkedAt,
      };
    }

    if (
      req.requestedPurposeCode &&
      artefact.purposeCode.toUpperCase() !== req.requestedPurposeCode.toUpperCase()
    ) {
      return {
        authorized: false,
        origin: artefact.origin,
        artefactId: artefact.artefactId,
        denialCode: 'PURPOSE_MISMATCH',
        reason: `Requested purpose '${req.requestedPurposeCode}' does not match consent purpose '${artefact.purposeCode}'.`,
        checkedAt,
      };
    }

    if (req.recordDateIso) {
      const recTime = new Date(req.recordDateIso).getTime();
      const fromTime = new Date(artefact.dateRange.from).getTime();
      const toTime = new Date(artefact.dateRange.to).getTime();
      if (recTime < fromTime || recTime > toTime) {
        return {
          authorized: false,
          origin: artefact.origin,
          artefactId: artefact.artefactId,
          denialCode: 'DATE_OUT_OF_RANGE',
          reason: 'Requested clinical record falls outside the permitted consent date range.',
          checkedAt,
        };
      }
    }

    return {
      authorized: true,
      origin: artefact.origin,
      artefactId: artefact.artefactId,
      reason: 'Consent artefact validated against origin, status, expiry, HI-type, purpose, and date range.',
      checkedAt,
    };
  }
}

export const abdmConsentAdapter = new AbdmConsentAdapter();
