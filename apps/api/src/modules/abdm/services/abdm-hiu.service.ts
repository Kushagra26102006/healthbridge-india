/**
 * HealthBridge India — ABDM Health Information User (HIU) Service (Day 7 Task 04)
 *
 * Strictly scoped to HIU responsibilities (separate from HIP):
 *   1. Initiate authorized Health Information Requests ONLY after centralized ABDM Consent
 *      Artefact validation succeeds (ABHA link alone NEVER authorizes data retrieval)
 *   2. Generate ephemeral ECDH key material via `abdmEncryptionAdapter` (private key stays
 *      strictly in ephemeral server memory — never persisted or returned)
 *   3. Receive & validate incoming `dataPushUrl` callbacks
 *   4. Reject unencrypted payloads when encryption is required (`ABDM_ENCRYPTION_REQUIRED`)
 *   5. Decrypt via `abdmEncryptionAdapter`, purge ephemeral private key, validate FHIR R4 Bundle
 *   6. Verify patient identity mapping (quarantine ambiguous matches into `QUARANTINED_REVIEW`;
 *      reject invalid or incomplete bundles)
 *   7. Prevent duplicate imports & preserve immutable provenance (`AbdmImportedRecordModel`)
 *   8. Expose strictly read-only imported records to authorized Patients & Doctors (doctors may
 *      NEVER modify imported external source records)
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmFideliusKeyMaterialDto,
  AbdmHealthInfoType,
  AbdmHealthInformationRequestDto,
  AbdmHealthInformationTransferDto,
  AbdmImportedRecordDto,
  AbdmImportedRecordSummaryDto,
  AbdmPurposeCode,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmConsentValidationService } from './abdm-consent-validation.service';
import { abdmEncryptionAdapter } from '../adapters/abdm-encryption.adapter';
import { abdmHieV3Client } from '../clients/abdm-hie-v3.client';
import { abdmHealthInformationTransferService } from './abdm-health-information-transfer.service';
import { abdmTransferAcknowledgementService } from './abdm-transfer-acknowledgement.service';
import { fhirR4Validator } from '../validators/fhir-r4.validator';
import { encryptSensitivePayloadForStorage } from '../utils/abha-crypto.util';
import { AbdmConsentArtefactModel } from '../models/abdm-consent-artefact.model';
import { AbdmHealthInformationRequestModel } from '../models/abdm-health-information-request.model';
import { AbdmHealthInformationTransferModel } from '../models/abdm-health-information-transfer.model';
import {
  AbdmImportedRecordModel,
  type IAbdmImportedRecordDocument,
} from '../models/abdm-imported-record.model';
import { AbdmFhirMappingResultModel } from '../models/abdm-fhir-mapping-result.model';
import { AbhaLinkModel } from '../models/abha-link.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { NotificationModel } from '../../notifications/models/notification.model';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface InitiateHiuRequestInput {
  actorId: string;
  actorRole: string;
  patientId?: string;
  consentArtefactId: string;
  participantId: string;
  hiTypes: AbdmHealthInfoType[];
  purposeCode: AbdmPurposeCode;
  dateRange: {
    from: string;
    to: string;
  };
  dataPushUrl?: string;
}

export interface HiuDataPushInput {
  pageNumber: number;
  pageCount: number;
  transactionId: string;
  timestamp?: string;
  sourceParticipantId?: string;
  sourceOrganizationName?: string;
  entries: Array<{
    content: string;
    media: string;
    checksum?: string;
    careContextReference: string;
    encrypted: boolean;
  }>;
  keyMaterial?: AbdmFideliusKeyMaterialDto;
  requireEncryption?: boolean;
}

export interface HiuDataPushResult {
  transfer: AbdmHealthInformationTransferDto;
  imported: AbdmImportedRecordDto[];
  quarantined: AbdmImportedRecordDto[];
  duplicatesSkipped: number;
  rejectedEntries: Array<{ careContextReference: string; reason: string }>;
}

export class AbdmHiuService {
  /**
   * Step 1 (HIU): Initiate a consent-authorized Health Information Request.
   */
  async initiateHealthInfoRequest(
    input: InitiateHiuRequestInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<{
    request: AbdmHealthInformationRequestDto;
    transfer: AbdmHealthInformationTransferDto;
    ephemeralKeyMaterial: AbdmFideliusKeyMaterialDto;
  }> {
    const config = abdmConfigurationService.loadConfig(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM HIU health information requests are unavailable while ABDM is disabled.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }
    if (config.environment === 'production' && !config.allowProduction) {
      throw new AbdmIntegrationError({
        message: 'ABDM production mode is locked (ABDM_ALLOW_PRODUCTION=false).',
        abdmCode: 'ABDM_PRODUCTION_LOCKED',
        statusCode: 403,
      });
    }

    if (!['DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN', 'PATIENT'].includes(input.actorRole)) {
      throw new AbdmIntegrationError({
        message: 'Role not authorized to initiate HIU health information requests.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    // Look up Consent Artefact strictly
    const artefactQuery = Types.ObjectId.isValid(input.consentArtefactId)
      ? {
          $or: [
            { _id: new Types.ObjectId(input.consentArtefactId) },
            { externalConsentId: input.consentArtefactId },
          ],
        }
      : { externalConsentId: input.consentArtefactId };

    const artefact = await AbdmConsentArtefactModel.findOne(artefactQuery);
    if (!artefact) {
      throw new AbdmIntegrationError({
        message:
          'HIU request denied: a valid ABDM Consent Artefact is required (ABHA identity linking alone is not consent).',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 403,
      });
    }

    const artefactPatientId = String(artefact.patientId);
    if (input.actorRole === 'PATIENT' && artefactPatientId !== input.actorId) {
      throw new AbdmIntegrationError({
        message: 'Patients may only initiate HIU requests against their own consent artefacts.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    if (input.patientId && input.patientId !== artefactPatientId) {
      throw new AbdmIntegrationError({
        message: 'Patient reference does not match the Consent Artefact subject.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    // Centralized Consent Authorization across every requested HI type (strictly fail-closed)
    for (const hiType of input.hiTypes) {
      const validation = await abdmConsentValidationService.validateAbdmConsentAccess(
        {
          artefactId: String(artefact._id),
          externalConsentId: artefact.externalConsentId,
          patientId: artefactPatientId,
          participantId: artefact.hiuId,
          requestedPurposeCode: input.purposeCode,
          requestedHiType: hiType,
          recordDateIso: input.dateRange.from,
          allowPatientSelfAccess: false,
        },
        artefact as any
      );

      if (!validation.allowed) {
        throw new AbdmIntegrationError({
          message: `HIU health information request blocked by consent validation: ${validation.reason}`,
          abdmCode: 'ABDM_CONSENT_INVALID',
          statusCode: 403,
          details: { reasonCode: validation.reasonCode, decision: validation.decision },
        });
      }
    }

    const internalRequestRef = `HIU-REQ-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const internalTransferRef = `HIU-TRF-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const dataPushUrl =
      input.dataPushUrl ||
      (config.callbackUrl
        ? `${config.callbackUrl.replace(/\/$/, '')}/api/v1/abdm/webhooks/hiu/data-push`
        : 'https://hiu.healthbridge.local/api/v1/abdm/webhooks/hiu/data-push');

    // Generate ephemeral key material (private key NEVER leaves server memory)
    const provisionalSessionId = `hiu-session-${crypto.randomUUID()}`;
    const keyHandle = abdmEncryptionAdapter.generateEphemeralKeyMaterial(
      provisionalSessionId,
      envSource
    );

    const outboundAck = await abdmHieV3Client.submitHealthInformationRequest(
      {
        externalConsentId: artefact.externalConsentId,
        dateRange: input.dateRange,
        dataPushUrl,
        keyMaterial: keyHandle.keyMaterial,
        hiuId: artefact.hiuId,
      },
      envSource
    );

    // Re-key ephemeral session under the confirmed externalTransactionId (re-generating or aliasing cleanly)
    // Keep sessionId mapped deterministically by registering with externalTransactionId via fresh handle in dev/mock
    abdmEncryptionAdapter.purgeSessionKey(provisionalSessionId);
    const txnKeyHandle = abdmEncryptionAdapter.generateEphemeralKeyMaterial(
      outboundAck.externalTransactionId,
      envSource
    );

    const reqDoc = await AbdmHealthInformationRequestModel.create({
      internalRequestRef,
      externalTransactionId: outboundAck.externalTransactionId,
      role: 'HIU',
      patientId: new Types.ObjectId(artefactPatientId),
      requesterId: new Types.ObjectId(input.actorId),
      requesterRole: input.actorRole,
      participantId: input.participantId,
      consentArtefactId: String(artefact._id),
      externalConsentId: artefact.externalConsentId,
      purposeCode: input.purposeCode,
      hiTypes: input.hiTypes,
      dateRange: {
        from: new Date(input.dateRange.from),
        to: new Date(input.dateRange.to),
      },
      dataPushUrl,
      status: 'REQUEST_SUBMITTED',
      externalSessionStatus: 'REQUESTED',
      correlationId: outboundAck.correlationId,
      environment: config.environment,
      isMocked: outboundAck.isMocked,
    });

    const transferDoc = await AbdmHealthInformationTransferModel.create({
      internalTransferRef,
      externalTransactionId: outboundAck.externalTransactionId,
      healthInformationRequestId: reqDoc._id,
      role: 'HIU',
      direction: 'INBOUND_HIU_RECEIVE',
      patientId: new Types.ObjectId(artefactPatientId),
      participantId: input.participantId,
      consentArtefactId: String(artefact._id),
      externalConsentId: artefact.externalConsentId,
      hiTypes: input.hiTypes,
      status: 'REQUEST_SUBMITTED',
      externalSessionStatus: 'REQUESTED',
      encryptionApplied: true,
      encryptionProviderMode: abdmEncryptionAdapter.getReadiness(envSource).providerMode,
      stateHistory: [
        {
          toState: 'AUTHORIZED',
          source: 'LOCAL_WORKFLOW',
          reason: 'ABDM Consent Artefact verified before HIU request submission',
          correlationId: outboundAck.correlationId,
          occurredAt: new Date().toISOString(),
        },
        {
          fromState: 'AUTHORIZED',
          toState: 'REQUEST_SUBMITTED',
          externalStatus: 'REQUESTED',
          source: 'LOCAL_WORKFLOW',
          reason: `Submitted to ${outboundAck.endpointPath}`,
          correlationId: outboundAck.correlationId,
          occurredAt: new Date().toISOString(),
        },
      ],
      correlationId: outboundAck.correlationId,
      environment: config.environment,
      isMocked: outboundAck.isMocked,
    });

    await this.writeAudit(input.actorId, 'ABDM_HIU_REQUEST_SUBMITTED', String(transferDoc._id), 'SUCCESS', {
      internalTransferRef,
      externalTransactionId: outboundAck.externalTransactionId,
      participantId: input.participantId,
      hiTypes: input.hiTypes,
      isMocked: outboundAck.isMocked,
      correlationId: outboundAck.correlationId,
    });

    return {
      request: this.toRequestDto(reqDoc),
      transfer: abdmHealthInformationTransferService.toDto(transferDoc),
      ephemeralKeyMaterial: txnKeyHandle.keyMaterial,
    };
  }

  /**
   * Step 2 (HIU): Receive encrypted data push callback, verify consent & transaction, decrypt,
   * validate FHIR R4 bundle, check patient match & duplicates, and store with immutable provenance.
   */
  async receiveDataPushCallback(
    input: HiuDataPushInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<HiuDataPushResult> {
    const requireEncryption = input.requireEncryption !== false;

    const transferDoc = await AbdmHealthInformationTransferModel.findOne({
      externalTransactionId: input.transactionId,
      role: 'HIU',
    });
    if (!transferDoc) {
      throw new AbdmIntegrationError({
        message: `Rejected HIU data push: unknown transactionId '${input.transactionId}'.`,
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }

    if (
      input.sourceParticipantId &&
      transferDoc.participantId &&
      input.sourceParticipantId !== transferDoc.participantId
    ) {
      throw new AbdmIntegrationError({
        message: 'Rejected HIU data push: source participant does not match transfer request participant.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    // Re-validate Consent Artefact right before importing incoming health data
    const artefact = await AbdmConsentArtefactModel.findById(transferDoc.consentArtefactId);
    if (!artefact) {
      throw new AbdmIntegrationError({
        message: 'Rejected HIU data push: consent artefact no longer exists.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 403,
      });
    }

    const consentCheck = await abdmConsentValidationService.validateAbdmConsentAccess(
      {
        artefactId: String(artefact._id),
        externalConsentId: artefact.externalConsentId,
        patientId: String(transferDoc.patientId),
        participantId: artefact.hiuId,
        requestedPurposeCode: artefact.purposeCode as AbdmPurposeCode,
        requestedHiType: transferDoc.hiTypes[0] || 'OPConsultation',
        allowPatientSelfAccess: false,
      },
      artefact as any
    );

    if (!consentCheck.allowed) {
      await abdmHealthInformationTransferService.transitionState({
        transfer: transferDoc,
        toState: 'FAILED',
        externalStatus: 'FAILED',
        source: 'HIP_DATA_PUSH',
        reason: `Consent invalid at import time: ${consentCheck.reasonCode}`,
        failureCode: consentCheck.reasonCode,
        failureReason: consentCheck.reason,
      });
      throw new AbdmIntegrationError({
        message: `HIU data import denied because consent is no longer valid: ${consentCheck.reason}`,
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 403,
      });
    }

    // Enforce encryption requirement before processing entries
    for (const entry of input.entries) {
      if (requireEncryption && (!entry.encrypted || !input.keyMaterial)) {
        throw new AbdmIntegrationError({
          message:
            'Unencrypted health information payload rejected: ABDM encrypted transfer with sender keyMaterial is required.',
          abdmCode: 'ABDM_ENCRYPTION_REQUIRED',
          statusCode: 422,
        });
      }
    }

    await abdmHealthInformationTransferService.transitionState({
      transfer: transferDoc,
      toState: 'TRANSFER_RECEIVED',
      externalStatus: 'RECEIVED',
      source: 'HIP_DATA_PUSH',
      reason: `Received ${input.entries.length} entry(ies) for validation`,
    });

    await abdmHealthInformationTransferService.transitionState({
      transfer: transferDoc,
      toState: 'VALIDATION_PENDING',
      source: 'LOCAL_WORKFLOW',
      reason: 'Decrypting and validating incoming FHIR R4 Document Bundles',
    });

    const patientAbhaLink = await AbhaLinkModel.findOne({
      patientId: transferDoc.patientId,
      isActive: true,
      verificationStatus: 'VERIFIED',
    }).lean();

    const imported: AbdmImportedRecordDto[] = [];
    const quarantined: AbdmImportedRecordDto[] = [];
    const rejectedEntries: Array<{ careContextReference: string; reason: string }> = [];
    let duplicatesSkipped = 0;

    try {
      for (const entry of input.entries) {
        let plaintextBundle: string;
        if (entry.encrypted) {
          const decrypted = abdmEncryptionAdapter.decryptBundleFromPeer(
            entry.content,
            input.keyMaterial!,
            input.transactionId,
            envSource
          );
          plaintextBundle = decrypted.plaintext;
        } else {
          plaintextBundle = entry.content;
        }

        if (Buffer.byteLength(plaintextBundle, 'utf8') > 2 * 1024 * 1024) {
          rejectedEntries.push({
            careContextReference: entry.careContextReference,
            reason: 'Decrypted FHIR bundle exceeds the safe 2 MB payload size limit.',
          });
          continue;
        }

        let parsedBundle: Record<string, unknown>;
        try {
          parsedBundle = JSON.parse(plaintextBundle) as Record<string, unknown>;
        } catch {
          rejectedEntries.push({
            careContextReference: entry.careContextReference,
            reason: 'Decrypted payload is not valid JSON.',
          });
          continue;
        }

        // Strict FHIR R4 structural validation
        const fhirValidation = fhirR4Validator.validateResource(parsedBundle, {
          strictAbdmProfile: true,
        });

        const bundleSha256 = crypto.createHash('sha256').update(plaintextBundle).digest('hex');

        // Record FHIR mapping validation telemetry (zero plaintext PHI)
        if (mongoose.connection.readyState === 1) {
          await AbdmFhirMappingResultModel.create({
            bundleId: String(parsedBundle.id || entry.careContextReference),
            role: 'HIU',
            patientId: transferDoc.patientId,
            transferId: transferDoc._id,
            hiType: this.inferHiTypeFromBundle(parsedBundle, transferDoc.hiTypes[0] || 'OPConsultation'),
            profileUrl: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle',
            mappingVersion: 'hiu-inbound-validation',
            bundleSha256,
            validationStatus: !fhirValidation.valid
              ? 'INVALID'
              : fhirValidation.warnings.length > 0
                ? 'VALID_WITH_WARNINGS'
                : 'VALID',
            errorCount: fhirValidation.errors.length,
            warningCount: fhirValidation.warnings.length,
            errorCodes: fhirValidation.errors.map((e) => e.code),
            warningCodes: fhirValidation.warnings.map((w) => w.code),
            unmappedFields: [],
            resourceCounts: {},
            officialIgConformanceClaimed: false,
            correlationId: transferDoc.correlationId,
            environment: transferDoc.environment,
          }).catch(() => undefined);
        }

        // Invalid or incomplete FHIR bundles MUST NOT be silently imported
        if (!fhirValidation.valid) {
          rejectedEntries.push({
            careContextReference: entry.careContextReference,
            reason: `FHIR R4 structural validation failed: ${fhirValidation.errors
              .map((e) => e.code)
              .join(', ')}`,
          });
          continue;
        }

        // Deduplication check
        const existingImport = await AbdmImportedRecordModel.findOne({
          patientId: transferDoc.patientId,
          sourceParticipantId: input.sourceParticipantId || transferDoc.participantId,
          careContextReference: entry.careContextReference,
          bundleSha256,
        });
        if (existingImport) {
          duplicatesSkipped++;
          continue;
        }

        // Verify patient identity mapping (quarantine ambiguous matches for manual review)
        const patientMatch = this.evaluatePatientIdentityMatch(
          parsedBundle,
          String(transferDoc.patientId),
          patientAbhaLink?.abhaAddress
        );

        const inferredHiType = this.inferHiTypeFromBundle(
          parsedBundle,
          transferDoc.hiTypes[0] || 'OPConsultation'
        );

        // Enforce consent HI-type restriction on incoming bundle
        if (!artefact.hiTypes.includes(inferredHiType)) {
          rejectedEntries.push({
            careContextReference: entry.careContextReference,
            reason: `Bundle HI type '${inferredHiType}' is outside permitted consent categories (${artefact.hiTypes.join(', ')}).`,
          });
          continue;
        }

        const summary = this.extractClinicalSummary(parsedBundle, inferredHiType);
        const reviewStatus =
          patientMatch.confidence === 'EXACT_ABHA_MATCH'
            ? 'IMPORTED_VERIFIED'
            : 'QUARANTINED_REVIEW';

        const encryptedBundleStorage = encryptSensitivePayloadForStorage(plaintextBundle, envSource);
        const importedDoc = await AbdmImportedRecordModel.create({
          internalImportRef: `IMP-${crypto.randomUUID().slice(0, 12).toUpperCase()}`,
          patientId: transferDoc.patientId,
          transferId: transferDoc._id,
          externalTransactionId: input.transactionId,
          consentArtefactId: transferDoc.consentArtefactId,
          externalConsentId: transferDoc.externalConsentId,
          sourceParticipantId: input.sourceParticipantId || transferDoc.participantId,
          sourceOrganizationName:
            input.sourceOrganizationName ||
            this.extractSourceOrganizationName(parsedBundle) ||
            transferDoc.participantId,
          careContextReference: entry.careContextReference,
          hiType: inferredHiType,
          bundleSha256,
          encryptedFhirBundle: encryptedBundleStorage,
          originalIssuedAt: summary.recordDate ? new Date(summary.recordDate) : undefined,
          importedAt: new Date(),
          validationStatus:
            fhirValidation.warnings.length > 0 ? 'VALID_WITH_WARNINGS' : 'VALID',
          reviewStatus,
          patientMatchConfidence: patientMatch.confidence,
          quarantineReason: patientMatch.quarantineReason,
          isAmended: summary.isAmended,
          summary,
          unmappedFields: [],
          validationErrors: [],
          validationWarnings: fhirValidation.warnings,
          correlationId: transferDoc.correlationId,
          environment: transferDoc.environment,
          isMocked: transferDoc.isMocked,
        });

        const dto = this.toImportedRecordDto(importedDoc);
        if (reviewStatus === 'QUARANTINED_REVIEW') {
          quarantined.push(dto);
        } else {
          imported.push(dto);
        }
      }
    } finally {
      // Purge ephemeral HIU private key once the transfer page is processed
      if (input.pageNumber + 1 >= input.pageCount) {
        abdmEncryptionAdapter.purgeSessionKey(input.transactionId);
      }
    }

    transferDoc.totalEntries += input.entries.length;
    transferDoc.validatedEntries += imported.length + quarantined.length;
    transferDoc.importedEntries += imported.length;
    transferDoc.quarantinedEntries += quarantined.length;
    await transferDoc.save();

    const finalState =
      rejectedEntries.length > 0 && imported.length === 0 && quarantined.length === 0
        ? 'FAILED'
        : quarantined.length > 0 || rejectedEntries.length > 0
          ? 'REQUIRES_REVIEW'
          : 'COMPLETED';

    const finalExternalStatus =
      finalState === 'COMPLETED'
        ? 'TRANSFERRED'
        : finalState === 'REQUIRES_REVIEW'
          ? 'PARTIAL_TRANSFERRED'
          : 'FAILED';

    await abdmHealthInformationTransferService.transitionState({
      transfer: transferDoc,
      toState: finalState,
      externalStatus: finalExternalStatus,
      source: 'HIP_DATA_PUSH',
      reason: `Imported=${imported.length}, Quarantined=${quarantined.length}, Duplicates=${duplicatesSkipped}, Rejected=${rejectedEntries.length}`,
      failureReason: rejectedEntries[0]?.reason,
    });

    await abdmTransferAcknowledgementService.processAcknowledgement(
      {
        externalTransactionId: input.transactionId,
        role: 'HIU',
        ackType:
          finalState === 'FAILED' ? 'TRANSFER_FAILED' : 'TRANSFER_COMPLETED',
        externalSessionStatus: finalExternalStatus,
        careContextStatuses: [
          ...imported.map((r) => ({
            careContextReference: r.careContextReference,
            hiStatus: 'DELIVERED' as const,
            description: 'Validated and imported with provenance',
          })),
          ...quarantined.map((r) => ({
            careContextReference: r.careContextReference,
            hiStatus: 'OK' as const,
            description: 'Quarantined pending manual patient identity review',
          })),
          ...rejectedEntries.map((r) => ({
            careContextReference: r.careContextReference,
            hiStatus: 'ERRORED' as const,
            description: r.reason,
          })),
        ],
        sendOutboundNotify: true,
        notifierId: artefact.hiuId,
      },
      envSource
    );

    if (mongoose.connection.readyState === 1) {
      await NotificationModel.create({
        userId: transferDoc.patientId,
        category: 'CONSENT',
        eventType:
          quarantined.length > 0
            ? 'ABDM_IMPORTED_RECORD_REVIEW_REQUIRED'
            : finalState === 'FAILED'
              ? 'ABDM_HI_TRANSFER_FAILED'
              : 'ABDM_HI_TRANSFER_COMPLETED',
        title:
          quarantined.length > 0
            ? 'Imported ABDM Record Requires Review'
            : finalState === 'FAILED'
              ? 'ABDM Health Record Transfer Failed'
              : 'ABDM Health Records Imported',
        message:
          quarantined.length > 0
            ? `${quarantined.length} imported record(s) were quarantined for identity verification before clinical display.`
            : finalState === 'FAILED'
              ? 'An ABDM health information transfer failed validation and was rejected.'
              : `${imported.length} external health record(s) were validated and imported with full provenance.`,
        priority: quarantined.length > 0 || finalState === 'FAILED' ? 'HIGH' : 'MEDIUM',
        relatedEntity: {
          entityType: 'AbdmHealthInformationTransfer',
          entityId: String(transferDoc._id),
          referenceNumber: transferDoc.internalTransferRef,
        },
      }).catch(() => undefined);
    }

    const updatedTransfer = await AbdmHealthInformationTransferModel.findById(transferDoc._id);

    return {
      transfer: abdmHealthInformationTransferService.toDto(updatedTransfer || transferDoc),
      imported,
      quarantined,
      duplicatesSkipped,
      rejectedEntries,
    };
  }

  /**
   * Manual review resolution for quarantined imported records (Patient or Admin only).
   */
  async reviewQuarantinedRecord(params: {
    recordId: string;
    actorId: string;
    actorRole: string;
    decision: 'APPROVE' | 'REJECT';
    reviewNotes: string;
  }): Promise<AbdmImportedRecordDto> {
    if (!Types.ObjectId.isValid(params.recordId)) {
      throw new AbdmIntegrationError({
        message: 'Invalid imported record ID.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    const doc = await AbdmImportedRecordModel.findById(params.recordId);
    if (!doc) {
      throw new AbdmIntegrationError({
        message: 'Imported ABDM record not found.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }

    if (params.actorRole === 'PATIENT' && String(doc.patientId) !== params.actorId) {
      throw new AbdmIntegrationError({
        message: 'Forbidden: cannot review another patient quarantined record.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    if (params.actorRole !== 'PATIENT' && params.actorRole !== 'ADMIN') {
      throw new AbdmIntegrationError({
        message: 'Only the owning patient or an administrator may review quarantined imported records.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    if (doc.reviewStatus !== 'QUARANTINED_REVIEW') {
      throw new AbdmIntegrationError({
        message: `Record is already in '${doc.reviewStatus}' status and cannot be re-reviewed.`,
        abdmCode: 'ABDM_INVALID_STATE_TRANSITION',
        statusCode: 409,
      });
    }

    doc.reviewStatus = params.decision === 'APPROVE' ? 'APPROVED_AFTER_REVIEW' : 'REJECTED';
    doc.reviewedBy = new Types.ObjectId(params.actorId);
    doc.reviewedAt = new Date();
    doc.reviewNotes = params.reviewNotes;
    await doc.save();

    await this.writeAudit(params.actorId, 'ABDM_IMPORTED_RECORD_REVIEWED', String(doc._id), 'SUCCESS', {
      decision: params.decision,
      newStatus: doc.reviewStatus,
      internalImportRef: doc.internalImportRef,
    });

    return this.toImportedRecordDto(doc);
  }

  /**
   * Read-only retrieval of imported records for Patients (own records) and Doctors
   * (ONLY verified/approved imported records for patients with active consent).
   */
  async listImportedRecords(params: {
    actorId: string;
    actorRole: string;
    patientId?: string;
    includeQuarantined?: boolean;
  }): Promise<AbdmImportedRecordDto[]> {
    const query: Record<string, unknown> = {};

    if (params.actorRole === 'PATIENT') {
      query.patientId = new Types.ObjectId(params.actorId);
      if (!params.includeQuarantined) {
        query.reviewStatus = { $in: ['IMPORTED_VERIFIED', 'APPROVED_AFTER_REVIEW', 'QUARANTINED_REVIEW'] };
      }
    } else if (params.actorRole === 'DOCTOR') {
      // Doctors NEVER see quarantined or rejected external records
      query.reviewStatus = { $in: ['IMPORTED_VERIFIED', 'APPROVED_AFTER_REVIEW'] };

      // Scope strictly to patients for whom there is an active GRANTED ABDM consent artefact
      const activeArtefacts = await AbdmConsentArtefactModel.find({
        externalStatus: 'GRANTED',
        revocationStatus: 'NONE',
        expiresAt: { $gt: new Date() },
        ...(params.patientId && Types.ObjectId.isValid(params.patientId)
          ? { patientId: new Types.ObjectId(params.patientId) }
          : {}),
      }).select('_id patientId');

      const allowedArtefactIds = activeArtefacts.map((a) => String(a._id));
      if (allowedArtefactIds.length === 0) {
        return [];
      }
      query.consentArtefactId = { $in: allowedArtefactIds };
      if (params.patientId && Types.ObjectId.isValid(params.patientId)) {
        query.patientId = new Types.ObjectId(params.patientId);
      }
    } else if (params.actorRole === 'ADMIN') {
      if (params.patientId && Types.ObjectId.isValid(params.patientId)) {
        query.patientId = new Types.ObjectId(params.patientId);
      }
    } else {
      throw new AbdmIntegrationError({
        message: 'Role is not authorized to view imported ABDM health records.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    const docs = await AbdmImportedRecordModel.find(query).sort({ importedAt: -1 }).limit(100);
    return docs.map((d) => this.toImportedRecordDto(d));
  }

  private evaluatePatientIdentityMatch(
    bundle: Record<string, unknown>,
    expectedPatientId: string,
    expectedAbhaAddress?: string
  ): { confidence: 'EXACT_ABHA_MATCH' | 'DEMOGRAPHIC_REVIEW_REQUIRED'; quarantineReason?: string } {
    const entries = Array.isArray(bundle.entry)
      ? (bundle.entry as Array<{ resource?: Record<string, unknown> }>)
      : [];
    const patientEntry = entries.find((e) => e.resource?.resourceType === 'Patient')?.resource;
    if (!patientEntry) {
      return {
        confidence: 'DEMOGRAPHIC_REVIEW_REQUIRED',
        quarantineReason: 'Incoming bundle did not contain a verifiable Patient resource.',
      };
    }

    const identifiers = Array.isArray(patientEntry.identifier)
      ? (patientEntry.identifier as Array<{ value?: string; system?: string }>)
      : [];

    const values = identifiers.map((i) => String(i.value || '').toLowerCase());
    if (
      (expectedAbhaAddress && values.includes(expectedAbhaAddress.toLowerCase())) ||
      values.includes(expectedPatientId.toLowerCase())
    ) {
      return { confidence: 'EXACT_ABHA_MATCH' };
    }

    return {
      confidence: 'DEMOGRAPHIC_REVIEW_REQUIRED',
      quarantineReason:
        'Incoming FHIR Patient identifier did not match patient verified ABHA Address or HealthBridge MRN; quarantined for manual review.',
    };
  }

  private inferHiTypeFromBundle(
    bundle: Record<string, unknown>,
    fallback: AbdmHealthInfoType
  ): AbdmHealthInfoType {
    const entries = Array.isArray(bundle.entry)
      ? (bundle.entry as Array<{ resource?: Record<string, unknown> }>)
      : [];
    const comp = entries[0]?.resource;
    const profiles = Array.isArray((comp?.meta as { profile?: unknown[] } | undefined)?.profile)
      ? ((comp?.meta as { profile: string[] }).profile)
      : [];
    const joined = profiles.join(' ');
    if (joined.includes('DiagnosticReportRecord')) return 'DiagnosticReport';
    if (joined.includes('PrescriptionRecord')) return 'Prescription';
    if (joined.includes('OPConsultRecord')) return 'OPConsultation';
    if (joined.includes('DischargeSummaryRecord')) return 'DischargeSummary';
    if (joined.includes('HealthDocumentRecord')) return 'HealthDocumentRecord';
    if (joined.includes('ImmunizationRecord')) return 'ImmunizationRecord';
    if (joined.includes('WellnessRecord')) return 'WellnessRecord';
    return fallback;
  }

  private extractSourceOrganizationName(bundle: Record<string, unknown>): string | undefined {
    const entries = Array.isArray(bundle.entry)
      ? (bundle.entry as Array<{ resource?: Record<string, unknown> }>)
      : [];
    const org = entries.find((e) => e.resource?.resourceType === 'Organization')?.resource;
    return typeof org?.name === 'string' ? org.name : undefined;
  }

  private extractClinicalSummary(
    bundle: Record<string, unknown>,
    hiType: AbdmHealthInfoType
  ): AbdmImportedRecordSummaryDto {
    const entries = Array.isArray(bundle.entry)
      ? (bundle.entry as Array<{ resource?: Record<string, unknown> }>)
      : [];
    const comp = entries[0]?.resource || {};
    const title = typeof comp.title === 'string' ? comp.title : `${hiType} Record`;
    const recordDate = typeof comp.date === 'string' ? comp.date : undefined;
    const isAmended = String(comp.status || '').toLowerCase() === 'amended';

    const observations = entries
      .map((e) => e.resource)
      .filter((r): r is Record<string, unknown> => r?.resourceType === 'Observation');
    const medications = entries
      .map((e) => e.resource)
      .filter((r): r is Record<string, unknown> => r?.resourceType === 'MedicationRequest');

    // Preserve verbatim clinical values, units, and reference ranges — NEVER fabricate interpretations
    const clinicalHighlights: AbdmImportedRecordSummaryDto['clinicalHighlights'] = [];
    for (const obs of observations.slice(0, 6)) {
      const codeObj = obs.code as { text?: string; coding?: Array<{ display?: string }> } | undefined;
      const label = codeObj?.text || codeObj?.coding?.[0]?.display || 'Observation';
      const qty = obs.valueQuantity as { value?: number; unit?: string } | undefined;
      const value =
        typeof qty?.value === 'number'
          ? String(qty.value)
          : typeof obs.valueString === 'string'
            ? obs.valueString
            : 'Recorded';
      const refRange = Array.isArray(obs.referenceRange)
        ? String((obs.referenceRange[0] as { text?: string } | undefined)?.text || '')
        : undefined;
      clinicalHighlights.push({
        label,
        value,
        unit: qty?.unit,
        referenceRange: refRange || undefined,
      });
    }
    for (const med of medications.slice(0, 6)) {
      const medConcept = med.medicationCodeableConcept as { text?: string } | undefined;
      const dosage = Array.isArray(med.dosageInstruction)
        ? String((med.dosageInstruction[0] as { text?: string } | undefined)?.text || '')
        : '';
      clinicalHighlights.push({
        label: medConcept?.text || 'Medication',
        value: dosage || 'Prescribed',
      });
    }

    return {
      title,
      documentType: hiType,
      hiType,
      recordDate,
      isAmended,
      observationsCount: observations.length,
      medicationsCount: medications.length,
      clinicalHighlights,
    };
  }

  private toRequestDto(doc: any): AbdmHealthInformationRequestDto {
    return {
      id: String(doc._id),
      internalRequestRef: doc.internalRequestRef,
      externalTransactionId: doc.externalTransactionId,
      role: doc.role,
      patientId: String(doc.patientId),
      requesterId: String(doc.requesterId),
      requesterRole: doc.requesterRole,
      participantId: doc.participantId,
      consentArtefactId: doc.consentArtefactId,
      externalConsentId: doc.externalConsentId,
      purposeCode: doc.purposeCode,
      hiTypes: doc.hiTypes,
      dateRange: {
        from: doc.dateRange.from.toISOString(),
        to: doc.dateRange.to.toISOString(),
      },
      dataPushUrl: doc.dataPushUrl,
      status: doc.status,
      externalSessionStatus: doc.externalSessionStatus,
      correlationId: doc.correlationId,
      environment: doc.environment,
      isMocked: doc.isMocked,
      failureCode: doc.failureCode,
      failureReason: doc.failureReason,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  private toImportedRecordDto(doc: IAbdmImportedRecordDocument): AbdmImportedRecordDto {
    return {
      id: String(doc._id),
      internalImportRef: doc.internalImportRef,
      patientId: String(doc.patientId),
      transferId: String(doc.transferId),
      externalTransactionId: doc.externalTransactionId,
      consentArtefactId: doc.consentArtefactId,
      externalConsentId: doc.externalConsentId,
      sourceParticipantId: doc.sourceParticipantId,
      sourceOrganizationName: doc.sourceOrganizationName,
      careContextReference: doc.careContextReference,
      hiType: doc.hiType,
      bundleSha256: doc.bundleSha256,
      originalIssuedAt: doc.originalIssuedAt?.toISOString(),
      importedAt: doc.importedAt.toISOString(),
      validationStatus: doc.validationStatus,
      reviewStatus: doc.reviewStatus,
      quarantineReason: doc.quarantineReason,
      reviewedBy: doc.reviewedBy ? String(doc.reviewedBy) : undefined,
      reviewedAt: doc.reviewedAt?.toISOString(),
      reviewNotes: doc.reviewNotes,
      isAmended: doc.isAmended,
      readOnly: true,
      provenance: {
        sourceSystem: 'ABDM_HIU_IMPORT',
        sourceParticipantId: doc.sourceParticipantId,
        sourceOrganizationName: doc.sourceOrganizationName,
        consentArtefactId: doc.consentArtefactId,
        externalConsentId: doc.externalConsentId,
        externalTransactionId: doc.externalTransactionId,
        importedAt: doc.importedAt.toISOString(),
        originalIssuedAt: doc.originalIssuedAt?.toISOString(),
        bundleSha256: doc.bundleSha256,
        patientMatchConfidence: doc.patientMatchConfidence,
      },
      summary: doc.summary,
      unmappedFields: doc.unmappedFields || [],
      validationErrors: doc.validationErrors || [],
      validationWarnings: doc.validationWarnings || [],
      environment: doc.environment,
      isMocked: doc.isMocked,
    };
  }

  private async writeAudit(
    userId: string,
    action: string,
    resourceId: string,
    status: 'SUCCESS' | 'FAILURE',
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    await AuditLogModel.create({
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      action,
      resource: 'ABDM_HIU_EXCHANGE',
      resourceId,
      status,
      metadata,
    }).catch(() => undefined);
  }
}

export const abdmHiuService = new AbdmHiuService();
