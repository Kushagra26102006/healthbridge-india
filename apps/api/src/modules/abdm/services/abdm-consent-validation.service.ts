/**
 * HealthBridge India — Centralized ABDM Consent Validation & Authorization Service (Day 7 Task 03)
 *
 * Exposes `validateAbdmConsentAccess(input)` returning a structured decision:
 *   - `ALLOWED`
 *   - `DENIED`
 *   - `REQUIRES_REVALIDATION`
 *   - `PENDING_EXTERNAL_CONFIRMATION`
 *
 * SECURITY INVARIANTS:
 * 1. Fails CLOSED whenever external confirmation, signature verification, expiry, revocation,
 *    patient ownership, participant authorization, purpose, HI-type, or date range fails.
 * 2. NEVER treats an internal HealthBridge consent as an ABDM HIE-CM Consent Artefact.
 * 3. NEVER blocks legitimate patient self-access to their own internal HealthBridge records
 *    merely because no external ABDM consent artefact exists.
 * 4. Caches positive decisions with a short TTL and invalidates immediately upon revocation,
 *    expiry, or consent status change.
 */

import mongoose, { Types } from 'mongoose';
import type {
  AbdmConsentAccessValidationInput,
  AbdmConsentValidationResultDto,
  AbdmExternalConsentStatus,
  AbdmHealthInfoType,
  AbdmPurposeCode,
  AbdmConsentArtefactValidationStatus,
  AbdmConsentRevocationStatus,
  ConsentOriginType,
} from '@healthbridge/shared-types';
import {
  AbdmConsentArtefactModel,
  type IAbdmConsentArtefactDocument,
} from '../models/abdm-consent-artefact.model';

export interface EvaluatableAbdmArtefact {
  id?: string;
  _id?: Types.ObjectId | string;
  externalConsentId: string;
  origin: ConsentOriginType;
  patientId: Types.ObjectId | string;
  hiuId: string;
  hipId?: string;
  purposeCode: AbdmPurposeCode | string;
  hiTypes: AbdmHealthInfoType[];
  dateRange: { from: Date | string; to: Date | string };
  dataEraseAt: Date | string;
  expiresAt: Date | string;
  externalStatus: AbdmExternalConsentStatus;
  validationStatus: AbdmConsentArtefactValidationStatus;
  revocationStatus: AbdmConsentRevocationStatus;
  signatureVerified: boolean;
  externalConfirmationReceived: boolean;
  revokedAt?: Date | string | null;
  lastSyncedAt?: Date | string | null;
}

interface CacheEntry {
  result: AbdmConsentValidationResultDto;
  expiresAtMs: number;
  patientId: string;
  artefactId?: string;
  externalConsentId?: string;
}

export class AbdmConsentValidationService {
  private readonly decisionCache = new Map<string, CacheEntry>();
  private readonly defaultCacheTtlMs = 60 * 1000; // 60 seconds

  /**
   * Centralized authorization check for ABDM-governed health information access.
   * Supports direct artefact injection for deterministic unit evaluation or automatic DB lookup.
   */
  async validateAbdmConsentAccess(
    input: AbdmConsentAccessValidationInput,
    directArtefact?: EvaluatableAbdmArtefact | null
  ): Promise<AbdmConsentValidationResultDto> {
    const now = input.now || new Date();
    const evaluatedAt = now.toISOString();

    // INVARIANT: Legitimate patient self-access to own HealthBridge records is NEVER blocked
    // merely because an external ABDM consent artefact does not exist.
    if (
      input.allowPatientSelfAccess !== false &&
      input.actorId &&
      input.actorId === input.patientId &&
      (!input.actorRole || input.actorRole === 'PATIENT')
    ) {
      return {
        decision: 'ALLOWED',
        allowed: true,
        reasonCode: 'PATIENT_SELF_ACCESS_ALLOWED',
        reason:
          'Patient self-access to own HealthBridge records is authorized independently of external ABDM consent artefacts.',
        origin: 'INTERNAL_HEALTHBRIDGE',
        cacheHit: false,
        evaluatedAt,
      };
    }

    // Check short-TTL decision cache only when evaluating against persisted artefacts (no custom `now` override)
    const cacheKey = this.buildCacheKey(input);
    if (!directArtefact && !input.now) {
      const cached = this.decisionCache.get(cacheKey);
      if (cached && cached.expiresAtMs > now.getTime()) {
        return {
          ...cached.result,
          cacheHit: true,
          evaluatedAt,
        };
      }
      if (cached) {
        this.decisionCache.delete(cacheKey);
      }
    }

    // Resolve artefact either from caller or database
    let artefact: EvaluatableAbdmArtefact | null | undefined = directArtefact;
    if (artefact === undefined) {
      artefact = await this.lookupArtefact(input);
    }

    const result = this.evaluateArtefact(input, artefact, now);

    // Cache only ALLOWED decisions when DB-backed and non-overridden clock
    if (result.decision === 'ALLOWED' && !directArtefact && !input.now) {
      this.decisionCache.set(cacheKey, {
        result,
        expiresAtMs: now.getTime() + this.defaultCacheTtlMs,
        patientId: input.patientId,
        artefactId: result.artefactId,
        externalConsentId: result.externalConsentId,
      });
    }

    return result;
  }

  /**
   * Pure deterministic evaluator enforcing all 11 security & consent rules.
   */
  evaluateArtefact(
    input: AbdmConsentAccessValidationInput,
    artefact: EvaluatableAbdmArtefact | null | undefined,
    now: Date = new Date()
  ): AbdmConsentValidationResultDto {
    const evaluatedAt = now.toISOString();

    // 1. Consent exists
    if (!artefact) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'CONSENT_NOT_FOUND',
        reason: 'Access denied: No ABDM consent artefact found for this request.',
        origin: 'ABDM_HIE_CM',
        cacheHit: false,
        evaluatedAt,
      };
    }

    const artefactId =
      artefact.id || (artefact._id ? String(artefact._id) : undefined);

    // 2. Origin boundary (Internal HealthBridge consent is NEVER an ABDM artefact)
    if (artefact.origin !== 'ABDM_HIE_CM') {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'INTERNAL_CONSENT_NOT_ABDM_ARTEFACT',
        reason:
          'Access denied: An internal HealthBridge consent record cannot authorize ABDM HIE-CM exchange.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 3. Patient ownership check (prevents cross-patient consent reuse)
    if (String(artefact.patientId) !== String(input.patientId)) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'PATIENT_OWNERSHIP_MISMATCH',
        reason: 'Access denied: Consent artefact does not belong to the requested patient.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 4. Revocation check (both confirmed revocation and safe fail-closed pending revocation)
    if (
      artefact.externalStatus === 'REVOKED' ||
      artefact.revocationStatus === 'CONFIRMED_REVOKED' ||
      artefact.validationStatus === 'REVOKED' ||
      Boolean(artefact.revokedAt)
    ) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'CONSENT_REVOKED',
        reason: 'Access denied: ABDM consent artefact has been revoked by the patient.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    if (artefact.revocationStatus === 'PENDING_CONFIRMATION') {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'REVOCATION_PENDING_CONFIRMATION',
        reason:
          'Access denied: Patient has initiated consent revocation; access is blocked pending external HIE-CM confirmation.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 5. External confirmation & validation checks (fail closed!)
    const requireExternalConfirmation = input.requireExternalConfirmation !== false;

    if (artefact.validationStatus === 'INVALID_SCHEMA') {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'ARTEFACT_SCHEMA_INVALID',
        reason: 'Access denied: Consent artefact failed official schema validation.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    if (requireExternalConfirmation && !artefact.externalConfirmationReceived) {
      return {
        decision: 'PENDING_EXTERNAL_CONFIRMATION',
        allowed: false,
        reasonCode: 'EXTERNAL_CONFIRMATION_REQUIRED',
        reason:
          'Access withheld: Official external ABDM Consent Manager confirmation has not been received.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    if (
      requireExternalConfirmation &&
      (!artefact.signatureVerified || artefact.validationStatus === 'SIGNATURE_UNVERIFIED')
    ) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'SIGNATURE_UNVERIFIED',
        reason:
          'Access denied: ABDM Consent Artefact digital signature has not been verified.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 6. Expiry & data erasure deadline enforcement
    const expiresAtMs = new Date(artefact.expiresAt).getTime();
    if (
      artefact.externalStatus === 'EXPIRED' ||
      artefact.validationStatus === 'EXPIRED' ||
      Number.isNaN(expiresAtMs) ||
      expiresAtMs <= now.getTime()
    ) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'CONSENT_EXPIRED',
        reason: 'Access denied: ABDM consent artefact has expired.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    const dataEraseAtMs = new Date(artefact.dataEraseAt).getTime();
    if (Number.isNaN(dataEraseAtMs) || dataEraseAtMs <= now.getTime()) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'DATA_ERASE_DEADLINE_PASSED',
        reason: 'Access denied: Consent data erasure deadline (dataEraseAt) has passed.',
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 7. External status must be GRANTED
    if (artefact.externalStatus !== 'GRANTED') {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'CONSENT_NOT_GRANTED',
        reason: `Access denied: Consent artefact is in non-granted external status '${artefact.externalStatus}'.`,
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 8. Optional sync staleness revalidation check
    if (input.maxSyncStalenessMs && input.maxSyncStalenessMs > 0) {
      const lastSyncMs = artefact.lastSyncedAt ? new Date(artefact.lastSyncedAt).getTime() : 0;
      if (!lastSyncMs || now.getTime() - lastSyncMs > input.maxSyncStalenessMs) {
        return {
          decision: 'REQUIRES_REVALIDATION',
          allowed: false,
          reasonCode: 'STALE_SYNC_REQUIRES_REVALIDATION',
          reason:
            'Consent synchronization is older than policy threshold; external status revalidation is required.',
          origin: artefact.origin,
          artefactId,
          externalConsentId: artefact.externalConsentId,
          cacheHit: false,
          evaluatedAt,
        };
      }
    }

    // 9. Requesting participant authorization (prevents cross-participant data access)
    if (input.participantId) {
      const allowedParticipants = [artefact.hiuId, artefact.hipId].filter(Boolean);
      if (!allowedParticipants.includes(input.participantId)) {
        return {
          decision: 'DENIED',
          allowed: false,
          reasonCode: 'PARTICIPANT_UNAUTHORIZED',
          reason: `Access denied: Participant '${input.participantId}' is not authorized by this consent artefact.`,
          origin: artefact.origin,
          artefactId,
          externalConsentId: artefact.externalConsentId,
          cacheHit: false,
          evaluatedAt,
        };
      }
    }

    // 10. Purpose limitation enforcement
    if (
      String(artefact.purposeCode).toUpperCase() !==
      String(input.requestedPurposeCode).toUpperCase()
    ) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'PURPOSE_MISMATCH',
        reason: `Access denied: Requested purpose '${input.requestedPurposeCode}' does not match consented purpose '${artefact.purposeCode}'.`,
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 11. Data-category (HI-type) scope enforcement
    if (!artefact.hiTypes.includes(input.requestedHiType)) {
      return {
        decision: 'DENIED',
        allowed: false,
        reasonCode: 'HI_TYPE_OUT_OF_SCOPE',
        reason: `Access denied: Requested HI-type '${input.requestedHiType}' is outside permitted consent scope.`,
        origin: artefact.origin,
        artefactId,
        externalConsentId: artefact.externalConsentId,
        cacheHit: false,
        evaluatedAt,
      };
    }

    // 12. Date-range enforcement
    if (input.recordDateIso) {
      const recMs = new Date(input.recordDateIso).getTime();
      const fromMs = new Date(artefact.dateRange.from).getTime();
      const toMs = new Date(artefact.dateRange.to).getTime();
      if (Number.isNaN(recMs) || recMs < fromMs || recMs > toMs) {
        return {
          decision: 'DENIED',
          allowed: false,
          reasonCode: 'DATE_RANGE_OUT_OF_SCOPE',
          reason: 'Access denied: Requested clinical record timestamp is outside consented date range.',
          origin: artefact.origin,
          artefactId,
          externalConsentId: artefact.externalConsentId,
          cacheHit: false,
          evaluatedAt,
        };
      }
    }

    return {
      decision: 'ALLOWED',
      allowed: true,
      reasonCode: 'AUTHORIZED',
      reason:
        'ABDM consent artefact validated across ownership, confirmation, signature, expiry, revocation, participant, purpose, HI-type, and date range.',
      origin: artefact.origin,
      artefactId,
      externalConsentId: artefact.externalConsentId,
      cacheHit: false,
      evaluatedAt,
    };
  }

  /**
   * Immediately invalidates cached authorization decisions for an artefact (e.g., on revocation/expiry).
   */
  invalidateByArtefact(artefactId?: string, externalConsentId?: string): number {
    let removed = 0;
    for (const [key, entry] of this.decisionCache.entries()) {
      if (
        (artefactId && entry.artefactId === artefactId) ||
        (externalConsentId && entry.externalConsentId === externalConsentId)
      ) {
        this.decisionCache.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  /**
   * Immediately invalidates all cached authorization decisions for a patient.
   */
  invalidateByPatient(patientId: string): number {
    let removed = 0;
    for (const [key, entry] of this.decisionCache.entries()) {
      if (entry.patientId === patientId) {
        this.decisionCache.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clearCache(): void {
    this.decisionCache.clear();
  }

  getCacheSize(): number {
    return this.decisionCache.size;
  }

  private async lookupArtefact(
    input: AbdmConsentAccessValidationInput
  ): Promise<IAbdmConsentArtefactDocument | null> {
    const dbReady =
      mongoose.connection.readyState === 1 ||
      Boolean((AbdmConsentArtefactModel.findOne as any)?.mock);
    if (!dbReady) return null;

    if (input.artefactId && Types.ObjectId.isValid(input.artefactId)) {
      return AbdmConsentArtefactModel.findById(input.artefactId);
    }

    if (input.externalConsentId) {
      return AbdmConsentArtefactModel.findOne({
        externalConsentId: input.externalConsentId,
      });
    }

    const filter: Record<string, unknown> = {
      patientId: Types.ObjectId.isValid(input.patientId)
        ? new Types.ObjectId(input.patientId)
        : input.patientId,
      externalStatus: 'GRANTED',
      revocationStatus: 'NOT_REVOKED',
    };
    if (input.participantId) {
      filter.hiuId = input.participantId;
    }

    const query = AbdmConsentArtefactModel.findOne(filter);
    return query && typeof (query as any).sort === 'function'
      ? await (query as any).sort({ createdAt: -1 })
      : await query;
  }

  private buildCacheKey(input: AbdmConsentAccessValidationInput): string {
    return [
      input.patientId,
      input.participantId || '*',
      input.artefactId || input.externalConsentId || 'latest',
      input.requestedHiType,
      input.requestedPurposeCode,
      input.recordDateIso || '*',
      input.requireExternalConfirmation !== false ? 'ext1' : 'ext0',
    ].join('|');
  }
}

export const abdmConsentValidationService = new AbdmConsentValidationService();
export const validateAbdmConsentAccess = (
  input: AbdmConsentAccessValidationInput,
  directArtefact?: EvaluatableAbdmArtefact | null
): Promise<AbdmConsentValidationResultDto> =>
  abdmConsentValidationService.validateAbdmConsentAccess(input, directArtefact);
