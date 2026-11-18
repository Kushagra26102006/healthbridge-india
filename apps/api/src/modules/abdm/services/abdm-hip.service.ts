/**
 * HealthBridge India — ABDM Health Information Provider (HIP) Service (Day 7 Task 04)
 *
 * Strictly scoped to HIP responsibilities (separate from HIU):
 *   1. Receive a verified Health Information Request (`POST /api/v3/hip/health-information/request`)
 *   2. Validate participant identity and resolve patient STRICTLY from the verified Consent Artefact
 *      (NEVER trusts a client-supplied patientId as proof of identity)
 *   3. Enforce centralized consent authorization (`abdmConsentValidationService.validateAbdmConsentAccess`)
 *   4. Enforce purpose, HI-type data-category restrictions, and date-range boundaries
 *   5. Apply minimum-necessary selection over HealthBridge clinical records
 *   6. Generate & validate NRCeS ABDM FHIR R4 Document Bundles (`abdmFhirBundleService`)
 *   7. Encrypt bundles via `abdmEncryptionAdapter` (Fidelius protocol architecture)
 *   8. Store encrypted transfer packages (`AbdmTransferPackageModel`), push via `abdmHieV3Client`,
 *      record acknowledgements, and preserve audit logs (zero plaintext PHI in logs/audit)
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmFideliusKeyMaterialDto,
  AbdmHealthInfoType,
  AbdmHealthInformationRequestDto,
  AbdmHealthInformationTransferDto,
  AbdmPurposeCode,
  AbdmTransferPackageMetadataDto,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import { abdmConsentValidationService } from './abdm-consent-validation.service';
import { abdmFhirBundleService } from './abdm-fhir-bundle.service';
import { abdmEncryptionAdapter } from '../adapters/abdm-encryption.adapter';
import { abdmHieV3Client } from '../clients/abdm-hie-v3.client';
import { abdmHealthInformationTransferService } from './abdm-health-information-transfer.service';
import { abdmTransferAcknowledgementService } from './abdm-transfer-acknowledgement.service';
import { AbdmConsentArtefactModel } from '../models/abdm-consent-artefact.model';
import { AbdmHealthInformationRequestModel } from '../models/abdm-health-information-request.model';
import { AbdmHealthInformationTransferModel } from '../models/abdm-health-information-transfer.model';
import { AbdmTransferPackageModel } from '../models/abdm-transfer-package.model';
import { AbhaLinkModel } from '../models/abha-link.model';
import { UserModel } from '../../users/models/user.model';
import { EncounterModel } from '../../healthcare/models/encounter.model';
import { PrescriptionModel } from '../../healthcare/models/prescription.model';
import { LaboratoryReportModel } from '../../healthcare/models/lab-report.model';
import { MedicalRecordModel } from '../../healthcare/models/medical-record.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface HipIncomingRequestInput {
  externalTransactionId: string;
  timestamp: string;
  consentArtefactId: string;
  hiuId: string;
  hipId?: string;
  purposeCode?: AbdmPurposeCode;
  hiTypes?: AbdmHealthInfoType[];
  dateRange: {
    from: string;
    to: string;
  };
  dataPushUrl: string;
  keyMaterial: AbdmFideliusKeyMaterialDto;
  /** Optional synthetic clinical record override for deterministic unit/mock tests */
  syntheticRecords?: {
    patientName?: string;
    encounters?: Array<{ id: string; startTime: string; chiefComplaint?: string; status?: string }>;
    prescriptions?: Array<{
      id: string;
      issuedAt: string;
      medications: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
    }>;
    diagnosticReports?: Array<{
      id: string;
      reportNumber: string;
      testName: string;
      issuedAt: string;
      observations: Array<{
        testName: string;
        value: string;
        numericValue?: number;
        unit: string;
        referenceRange: string;
        interpretation?: string;
      }>;
    }>;
    documents?: Array<{ id: string; title: string; recordType: string; recordDate: string }>;
  };
}

export interface HipProcessRequestResult {
  request: AbdmHealthInformationRequestDto;
  transfer: AbdmHealthInformationTransferDto;
  packages: AbdmTransferPackageMetadataDto[];
  encryptedEntriesCount: number;
  isMocked: boolean;
}

export class AbdmHipService {
  /**
   * Receives and processes an inbound ABDM HIP Health Information Request.
   * Patient identity is ALWAYS derived from the verified Consent Artefact — NEVER from client input.
   */
  async processIncomingHealthInfoRequest(
    input: HipIncomingRequestInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<HipProcessRequestResult> {
    const config = abdmConfigurationService.loadConfig(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM HIP data exchange is disabled in runtime configuration.',
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

    // 1. Idempotency check on externalTransactionId for HIP role
    const existingReq = await AbdmHealthInformationRequestModel.findOne({
      role: 'HIP',
      externalTransactionId: input.externalTransactionId,
    });
    if (existingReq) {
      const existingTransfer = await AbdmHealthInformationTransferModel.findOne({
        healthInformationRequestId: existingReq._id,
      });
      const existingPackages = existingTransfer
        ? await AbdmTransferPackageModel.find({ transferId: existingTransfer._id })
        : [];
      if (existingTransfer) {
        return {
          request: this.toRequestDto(existingReq),
          transfer: abdmHealthInformationTransferService.toDto(existingTransfer),
          packages: existingPackages.map((p) => this.toPackageDto(p)),
          encryptedEntriesCount: existingPackages.filter((p) => p.encryptionApplied).length,
          isMocked: existingTransfer.isMocked,
        };
      }
    }

    // 2. Look up Consent Artefact by internal ID or externalConsentId
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
        message: 'HIP request rejected: referenced ABDM Consent Artefact was not found.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 403,
      });
    }

    // 3. Validate participant identity (HIU & optional HIP binding)
    if (artefact.hiuId !== input.hiuId) {
      throw new AbdmIntegrationError({
        message: 'HIP request rejected: requesting HIU participant does not match Consent Artefact.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    if (input.hipId && artefact.hipId && artefact.hipId !== input.hipId) {
      throw new AbdmIntegrationError({
        message: 'HIP request rejected: target HIP facility does not match Consent Artefact.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    const patientId = String(artefact.patientId);
    const requestedHiTypes =
      input.hiTypes && input.hiTypes.length > 0 ? input.hiTypes : artefact.hiTypes;
    const requestedPurpose = (input.purposeCode || artefact.purposeCode) as AbdmPurposeCode;

    // 4. Centralized Consent Enforcement across every requested HI type (NEVER duplicated locally)
    for (const hiType of requestedHiTypes) {
      const consentDecision = await abdmConsentValidationService.validateAbdmConsentAccess(
        {
          artefactId: String(artefact._id),
          externalConsentId: artefact.externalConsentId,
          patientId,
          participantId: input.hiuId,
          requestedPurposeCode: requestedPurpose,
          requestedHiType: hiType,
          recordDateIso: input.dateRange.from,
          allowPatientSelfAccess: false,
        },
        artefact as any
      );

      if (!consentDecision.allowed) {
        await this.writeAudit(
          patientId,
          'ABDM_HIP_REQUEST_DENIED_CONSENT',
          artefact.externalConsentId,
          'FAILURE',
          {
            externalTransactionId: input.externalTransactionId,
            hiuId: input.hiuId,
            reasonCode: consentDecision.reasonCode,
          }
        );
        throw new AbdmIntegrationError({
          message: `HIP request denied by centralized consent authorization: ${consentDecision.reason}`,
          abdmCode: 'ABDM_CONSENT_INVALID',
          statusCode: 403,
          details: { reasonCode: consentDecision.reasonCode, decision: consentDecision.decision },
        });
      }
    }

    // 5. Validate dataPushUrl (SSRF & HTTPS guard)
    abdmHieV3Client.validateDataPushUrl(input.dataPushUrl, config.environment === 'development');

    const correlationId = abdmCorrelationService.registerOutboundRequest(
      'HIP_PROCESS_HI_REQUEST',
      input.externalTransactionId
    ).requestId;
    const internalRequestRef = `HIP-REQ-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const internalTransferRef = `HIP-TRF-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const isMocked = config.environment === 'development';

    // 6. Persist HI Request & Transfer record
    const reqDoc = await AbdmHealthInformationRequestModel.create({
      internalRequestRef,
      externalTransactionId: input.externalTransactionId,
      role: 'HIP',
      patientId: new Types.ObjectId(patientId),
      requesterId: new Types.ObjectId(patientId),
      requesterRole: 'EXTERNAL_HIU',
      participantId: input.hiuId,
      consentArtefactId: String(artefact._id),
      externalConsentId: artefact.externalConsentId,
      purposeCode: requestedPurpose,
      hiTypes: requestedHiTypes,
      dateRange: {
        from: new Date(input.dateRange.from),
        to: new Date(input.dateRange.to),
      },
      dataPushUrl: input.dataPushUrl,
      peerKeyMaterial: input.keyMaterial,
      status: 'AUTHORIZED',
      externalSessionStatus: 'ACKNOWLEDGED',
      correlationId,
      environment: config.environment,
      isMocked,
    });

    const transferDoc = await AbdmHealthInformationTransferModel.create({
      internalTransferRef,
      externalTransactionId: input.externalTransactionId,
      healthInformationRequestId: reqDoc._id,
      role: 'HIP',
      direction: 'OUTBOUND_HIP_PUSH',
      patientId: new Types.ObjectId(patientId),
      participantId: input.hiuId,
      consentArtefactId: String(artefact._id),
      externalConsentId: artefact.externalConsentId,
      hiTypes: requestedHiTypes,
      status: 'AUTHORIZED',
      externalSessionStatus: 'ACKNOWLEDGED',
      encryptionApplied: false,
      encryptionProviderMode: abdmEncryptionAdapter.getReadiness(envSource).providerMode,
      stateHistory: [
        {
          toState: 'AUTHORIZED',
          externalStatus: 'ACKNOWLEDGED',
          source: 'ABDM_CALLBACK',
          reason: 'Consent verified by centralized authorization service',
          correlationId,
          occurredAt: new Date().toISOString(),
        },
      ],
      correlationId,
      environment: config.environment,
      isMocked,
    });

    // Send HIP on-request acknowledgement
    const defaultHipId = envSource.ABDM_FACILITY_ID || 'HEALTHBRIDGE_HIP_SBX';
    await abdmHieV3Client.acknowledgeHipHealthInfoRequest(
      {
        externalTransactionId: input.externalTransactionId,
        sessionStatus: 'ACKNOWLEDGED',
        hipId: input.hipId || defaultHipId,
      },
      envSource
    );

    await abdmHealthInformationTransferService.transitionState({
      transfer: transferDoc,
      toState: 'TRANSFER_PENDING',
      externalStatus: 'ACKNOWLEDGED',
      source: 'LOCAL_WORKFLOW',
      reason: 'Packaging minimum-necessary FHIR R4 bundles for encrypted transfer',
      correlationId,
    });

    // 7. Minimum-necessary clinical record selection & FHIR R4 DocumentBundle generation
    const packages = await this.packageAndEncryptEligibleRecords({
      patientId,
      transferId: String(transferDoc._id),
      externalTransactionId: input.externalTransactionId,
      consentArtefactId: String(artefact._id),
      permittedHiTypes: requestedHiTypes,
      dateRange: {
        from: new Date(input.dateRange.from),
        to: new Date(input.dateRange.to),
      },
      peerKeyMaterial: input.keyMaterial,
      dataPushUrl: input.dataPushUrl,
      correlationId,
      environment: config.environment,
      syntheticRecords: input.syntheticRecords,
      envSource,
    });

    // 8. Update transfer metrics and record acknowledgement
    transferDoc.totalEntries = packages.packageDocs.length;
    transferDoc.validatedEntries = packages.packageDocs.filter(
      (p) => p.fhirValidationStatus !== 'INVALID'
    ).length;
    transferDoc.encryptionApplied = packages.encryptedEntries.length > 0;
    transferDoc.encryptionProviderMode = packages.providerMode;
    await transferDoc.save();

    if (packages.encryptedEntries.length > 0 && packages.senderKeyMaterial) {
      await abdmHieV3Client.pushEncryptedHealthData(
        {
          dataPushUrl: input.dataPushUrl,
          transactionId: input.externalTransactionId,
          pageNumber: 0,
          pageCount: 1,
          entries: packages.encryptedEntries,
          keyMaterial: packages.senderKeyMaterial,
        },
        envSource
      );
    }

    await abdmTransferAcknowledgementService.processAcknowledgement(
      {
        externalTransactionId: input.externalTransactionId,
        role: 'HIP',
        ackType: 'TRANSFER_COMPLETED',
        externalSessionStatus: 'TRANSFERRED',
        careContextStatuses: packages.packageDocs.map((p) => ({
          careContextReference: p.careContextReference,
          hiStatus: 'OK',
          description: 'Encrypted FHIR R4 DocumentBundle packaged and dispatched',
        })),
        sendOutboundNotify: true,
        notifierId: input.hipId || defaultHipId,
      },
      envSource
    );

    reqDoc.status = 'COMPLETED';
    reqDoc.externalSessionStatus = 'TRANSFERRED';
    await reqDoc.save();

    const refreshedTransfer = await AbdmHealthInformationTransferModel.findById(transferDoc._id);

    await this.writeAudit(patientId, 'ABDM_HIP_TRANSFER_COMPLETED', String(transferDoc._id), 'SUCCESS', {
      internalTransferRef,
      externalTransactionId: input.externalTransactionId,
      hiuId: input.hiuId,
      hiTypes: requestedHiTypes,
      packagesCount: packages.packageDocs.length,
      encryptionApplied: transferDoc.encryptionApplied,
      encryptionProviderMode: transferDoc.encryptionProviderMode,
      isMocked,
      correlationId,
    });

    return {
      request: this.toRequestDto(reqDoc),
      transfer: abdmHealthInformationTransferService.toDto(refreshedTransfer || transferDoc),
      packages: packages.packageDocs.map((p) => this.toPackageDto(p)),
      encryptedEntriesCount: packages.encryptedEntries.length,
      isMocked,
    };
  }

  private async packageAndEncryptEligibleRecords(params: {
    patientId: string;
    transferId: string;
    externalTransactionId: string;
    consentArtefactId: string;
    permittedHiTypes: AbdmHealthInfoType[];
    dateRange: { from: Date; to: Date };
    peerKeyMaterial: AbdmFideliusKeyMaterialDto;
    dataPushUrl: string;
    correlationId: string;
    environment: 'disabled' | 'development' | 'sandbox' | 'production';
    syntheticRecords?: HipIncomingRequestInput['syntheticRecords'];
    envSource: NodeJS.ProcessEnv;
  }) {
    const patientDoc = (await UserModel.findById(params.patientId)
      .select('firstName lastName email phone')
      .lean()) as { firstName?: string; lastName?: string } | null;
    const abhaLink = await AbhaLinkModel.findOne({
      patientId: new Types.ObjectId(params.patientId),
      isActive: true,
      verificationStatus: 'VERIFIED',
    }).lean();

    const resolvedPatientName =
      params.syntheticRecords?.patientName ||
      [patientDoc?.firstName, patientDoc?.lastName].filter(Boolean).join(' ').trim() ||
      'HealthBridge Patient';

    const patientInput = {
      id: params.patientId,
      fullName: resolvedPatientName,
      abhaAddress: abhaLink?.abhaAddress,
      abhaVerified: Boolean(abhaLink),
    };
    const defaultPractitioner = {
      id: 'hb-practitioner-system',
      fullName: 'HealthBridge Attending Clinician',
    };
    const defaultOrg = {
      id: 'hb-org-hip',
      name: 'HealthBridge India Facility',
      hfrFacilityId: params.envSource.ABDM_FACILITY_ID,
    };

    const bundlesToEncrypt: Array<{
      hiType: AbdmHealthInfoType;
      careContextReference: string;
      bundleResult: Awaited<ReturnType<typeof abdmFhirBundleService.generateDocumentBundle>>;
    }> = [];

    // Minimum-necessary selection strictly bounded by `permittedHiTypes` and `dateRange`
    if (params.permittedHiTypes.includes('OPConsultation')) {
      const encounters =
        params.syntheticRecords?.encounters ??
        (await EncounterModel.find({
          patientId: new Types.ObjectId(params.patientId),
          startTime: { $gte: params.dateRange.from, $lte: params.dateRange.to },
          isDraft: false,
        })
          .limit(10)
          .lean()
          .then((list) =>
            list.map((e) => ({
              id: String(e._id),
              startTime: e.startTime.toISOString(),
              chiefComplaint: e.chiefComplaint,
              status: e.status,
            }))
          ));

      for (const enc of encounters || []) {
        const res = await abdmFhirBundleService.generateDocumentBundle({
          hiType: 'OPConsultation',
          patient: patientInput,
          practitioner: defaultPractitioner,
          organization: defaultOrg,
          encounter: {
            id: enc.id,
            encounterType: 'OPD',
            startTime: enc.startTime,
            status: enc.status || 'COMPLETED',
            chiefComplaint: enc.chiefComplaint,
          },
          persistTelemetry: {
            role: 'HIP',
            patientId: params.patientId,
            transferId: params.transferId,
            correlationId: params.correlationId,
            environment: params.environment,
          },
        });
        bundlesToEncrypt.push({
          hiType: 'OPConsultation',
          careContextReference: `ENC-${enc.id}`,
          bundleResult: res,
        });
      }
    }

    if (params.permittedHiTypes.includes('Prescription')) {
      const prescriptions =
        params.syntheticRecords?.prescriptions ??
        (await PrescriptionModel.find({
          patientId: new Types.ObjectId(params.patientId),
          createdAt: { $gte: params.dateRange.from, $lte: params.dateRange.to },
          isDraft: false,
        })
          .limit(10)
          .lean()
          .then((list) =>
            list.map((p) => ({
              id: String(p._id),
              issuedAt: (p.issuedAt || p.createdAt).toISOString(),
              medications: (p.medications || []).map((m) => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
              })),
            }))
          ));

      for (const rx of prescriptions || []) {
        const res = await abdmFhirBundleService.generateDocumentBundle({
          hiType: 'Prescription',
          patient: patientInput,
          practitioner: defaultPractitioner,
          organization: defaultOrg,
          prescription: {
            id: rx.id,
            issuedAt: rx.issuedAt,
            status: 'ACTIVE',
            medications: rx.medications,
          },
          persistTelemetry: {
            role: 'HIP',
            patientId: params.patientId,
            transferId: params.transferId,
            correlationId: params.correlationId,
            environment: params.environment,
          },
        });
        bundlesToEncrypt.push({
          hiType: 'Prescription',
          careContextReference: `RX-${rx.id}`,
          bundleResult: res,
        });
      }
    }

    if (params.permittedHiTypes.includes('DiagnosticReport')) {
      const reports =
        params.syntheticRecords?.diagnosticReports ??
        (await LaboratoryReportModel.find({
          patientId: new Types.ObjectId(params.patientId),
          testDate: { $gte: params.dateRange.from, $lte: params.dateRange.to },
          status: { $in: ['PUBLISHED', 'AMENDED', 'APPROVED'] },
        })
          .limit(10)
          .lean()
          .then((list) =>
            list.map((r) => ({
              id: String(r._id),
              reportNumber: r.reportNumber,
              testName: r.testName,
              issuedAt: (r.publishedAt || r.testDate).toISOString(),
              observations: (r.observations || []).map((o) => ({
                testName: o.testName,
                value: o.value,
                numericValue: o.numericValue,
                unit: o.unit,
                referenceRange: o.referenceRange,
                interpretation: o.interpretation,
              })),
            }))
          ));

      for (const rep of reports || []) {
        const res = await abdmFhirBundleService.generateDocumentBundle({
          hiType: 'DiagnosticReport',
          patient: patientInput,
          practitioner: defaultPractitioner,
          organization: defaultOrg,
          diagnosticReport: {
            id: rep.id,
            reportNumber: rep.reportNumber,
            testName: rep.testName,
            issuedAt: rep.issuedAt,
            status: 'final',
            observations: rep.observations,
          },
          persistTelemetry: {
            role: 'HIP',
            patientId: params.patientId,
            transferId: params.transferId,
            correlationId: params.correlationId,
            environment: params.environment,
          },
        });
        bundlesToEncrypt.push({
          hiType: 'DiagnosticReport',
          careContextReference: `LAB-${rep.reportNumber || rep.id}`,
          bundleResult: res,
        });
      }
    }

    if (params.permittedHiTypes.includes('HealthDocumentRecord')) {
      const docs =
        params.syntheticRecords?.documents ??
        (await MedicalRecordModel.find({
          patientId: new Types.ObjectId(params.patientId),
          recordDate: { $gte: params.dateRange.from, $lte: params.dateRange.to },
        })
          .limit(10)
          .lean()
          .then((list) =>
            list.map((d) => ({
              id: String(d._id),
              title: d.title,
              recordType: d.recordType,
              recordDate: d.recordDate.toISOString(),
            }))
          ));

      for (const docItem of docs || []) {
        const res = await abdmFhirBundleService.generateDocumentBundle({
          hiType: 'HealthDocumentRecord',
          patient: patientInput,
          practitioner: defaultPractitioner,
          organization: defaultOrg,
          documentRecord: {
            id: docItem.id,
            title: docItem.title,
            recordType: docItem.recordType,
            recordDate: docItem.recordDate,
          },
          persistTelemetry: {
            role: 'HIP',
            patientId: params.patientId,
            transferId: params.transferId,
            correlationId: params.correlationId,
            environment: params.environment,
          },
        });
        bundlesToEncrypt.push({
          hiType: 'HealthDocumentRecord',
          careContextReference: `DOC-${docItem.id}`,
          bundleResult: res,
        });
      }
    }

    const packageDocs = [];
    const encryptedEntries: Array<{
      content: string;
      media: string;
      checksum: string;
      careContextReference: string;
    }> = [];
    let senderKeyMaterial: AbdmFideliusKeyMaterialDto | undefined;
    let providerMode = abdmEncryptionAdapter.getReadiness(params.envSource).providerMode;

    for (let i = 0; i < bundlesToEncrypt.length; i++) {
      const item = bundlesToEncrypt[i]!;
      if (!item.bundleResult.valid) {
        throw new AbdmIntegrationError({
          message: `HIP refused to package invalid FHIR R4 bundle for '${item.careContextReference}'.`,
          abdmCode: 'ABDM_VALIDATION_ERROR',
          statusCode: 422,
          details: { errors: item.bundleResult.errors },
        });
      }

      const encrypted = abdmEncryptionAdapter.encryptBundleForPeer(
        JSON.stringify(item.bundleResult.bundle),
        params.peerKeyMaterial,
        undefined,
        params.envSource
      );
      senderKeyMaterial = encrypted.senderKeyMaterial;
      providerMode = encrypted.providerMode;

      encryptedEntries.push({
        content: encrypted.ciphertextBase64,
        media: 'application/fhir+json',
        checksum: encrypted.ciphertextSha256,
        careContextReference: item.careContextReference,
      });

      const pkgDoc = await AbdmTransferPackageModel.create({
        internalPackageRef: `PKG-${crypto.randomUUID().slice(0, 12).toUpperCase()}`,
        transferId: new Types.ObjectId(params.transferId),
        externalTransactionId: params.externalTransactionId,
        patientId: new Types.ObjectId(params.patientId),
        consentArtefactId: params.consentArtefactId,
        hiType: item.hiType,
        careContextReference: item.careContextReference,
        bundleSha256: item.bundleResult.bundleSha256,
        encryptedPayloadSha256: encrypted.ciphertextSha256,
        encryptedPayload: encrypted.ciphertextBase64,
        encryptionApplied: true,
        encryptionProviderMode: encrypted.providerMode,
        fhirValidationStatus:
          item.bundleResult.warnings.length > 0 ? 'VALID_WITH_WARNINGS' : 'VALID',
        validationErrorCount: item.bundleResult.errors.length,
        validationWarningCount: item.bundleResult.warnings.length,
        unmappedFieldsCount: item.bundleResult.unmappedFields.length,
        pageNumber: i,
        pageCount: bundlesToEncrypt.length,
        correlationId: params.correlationId,
        environment: params.environment,
      });
      packageDocs.push(pkgDoc);
    }

    return { packageDocs, encryptedEntries, senderKeyMaterial, providerMode };
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

  private toPackageDto(doc: any): AbdmTransferPackageMetadataDto {
    return {
      id: String(doc._id),
      internalPackageRef: doc.internalPackageRef,
      transferId: String(doc.transferId),
      externalTransactionId: doc.externalTransactionId,
      patientId: String(doc.patientId),
      consentArtefactId: doc.consentArtefactId,
      hiType: doc.hiType,
      careContextReference: doc.careContextReference,
      bundleSha256: doc.bundleSha256,
      encryptedPayloadSha256: doc.encryptedPayloadSha256,
      encryptionApplied: doc.encryptionApplied,
      encryptionProviderMode: doc.encryptionProviderMode,
      fhirValidationStatus: doc.fhirValidationStatus,
      validationErrorCount: doc.validationErrorCount,
      validationWarningCount: doc.validationWarningCount,
      unmappedFieldsCount: doc.unmappedFieldsCount,
      pageNumber: doc.pageNumber,
      pageCount: doc.pageCount,
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
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
      resource: 'ABDM_HIP_EXCHANGE',
      resourceId,
      status,
      metadata,
    }).catch(() => undefined);
  }
}

export const abdmHipService = new AbdmHipService();
