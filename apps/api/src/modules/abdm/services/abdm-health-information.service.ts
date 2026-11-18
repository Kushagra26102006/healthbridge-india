/**
 * HealthBridge India — ABDM Health Information Exchange Monitoring & Governance Service (Day 7 Task 04)
 *
 * Provides strictly aggregate, zero-PII operational telemetry across HIP, HIU, Discovery,
 * Care-Context Linking, Transfers, Acknowledgements, FHIR Validation, and Encryption readiness.
 */

import mongoose from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmHipHiuAdminAnalyticsDto,
  AbdmIntegrationStatus,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmEncryptionAdapter } from '../adapters/abdm-encryption.adapter';
import { AbdmDiscoveryRequestModel } from '../models/abdm-discovery-request.model';
import { AbdmLinkedHealthRecordModel } from '../models/abdm-linked-health-record.model';
import { AbdmHealthInformationTransferModel } from '../models/abdm-health-information-transfer.model';
import { AbdmTransferAcknowledgementModel } from '../models/abdm-transfer-acknowledgement.model';
import { AbdmFhirMappingResultModel } from '../models/abdm-fhir-mapping-result.model';
import { AbdmImportedRecordModel } from '../models/abdm-imported-record.model';

export class AbdmHealthInformationService {
  async getAdminHipHiuAnalytics(
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmHipHiuAdminAnalyticsDto> {
    const config = abdmConfigurationService.loadConfig(envSource);
    const encryption = abdmEncryptionAdapter.getReadiness(envSource);

    const roleStatus: AbdmIntegrationStatus = !config.enabled
      ? 'NOT_CONFIGURED'
      : config.environment === 'development'
        ? 'MOCKED'
        : config.environment === 'production' && !config.allowProduction
          ? 'PRODUCTION_NOT_ENABLED'
          : 'PENDING_ONBOARDING';

    const emptyBreakdown: Record<AbdmEnvironment, number> = {
      disabled: 0,
      development: 0,
      sandbox: 0,
      production: 0,
    };

    if (mongoose.connection.readyState !== 1) {
      return {
        hipReadiness: roleStatus,
        hiuReadiness: roleStatus,
        liveExchangeEnabled: false,
        encryption,
        discovery: { total: 0, pending: 0, completed: 0, failed: 0 },
        recordLinking: { total: 0, linked: 0, pending: 0, unlinkedLocally: 0, failed: 0 },
        transfers: {
          total: 0,
          hipOutbound: 0,
          hiuInbound: 0,
          pending: 0,
          completed: 0,
          requiresReview: 0,
          failed: 0,
        },
        acknowledgements: { total: 0, failed: 0 },
        fhirValidation: { totalMappings: 0, passed: 0, passedWithWarnings: 0, failed: 0 },
        importedRecords: { total: 0, verified: 0, quarantined: 0, rejected: 0 },
        environmentBreakdown: emptyBreakdown,
        generatedAt: new Date().toISOString(),
      };
    }

    const [
      discTotal,
      discPending,
      discCompleted,
      discFailed,
      linkTotal,
      linkLinked,
      linkPending,
      linkUnlinked,
      linkFailed,
      trfTotal,
      trfHip,
      trfHiu,
      trfPending,
      trfCompleted,
      trfReview,
      trfFailed,
      ackTotal,
      ackFailed,
      fhirTotal,
      fhirPassed,
      fhirWarn,
      fhirFailed,
      impTotal,
      impVerified,
      impQuarantined,
      impRejected,
      envGroups,
    ] = await Promise.all([
      AbdmDiscoveryRequestModel.countDocuments(),
      AbdmDiscoveryRequestModel.countDocuments({ status: 'DISCOVERY_PENDING' }),
      AbdmDiscoveryRequestModel.countDocuments({ status: 'DISCOVERY_COMPLETED' }),
      AbdmDiscoveryRequestModel.countDocuments({ status: 'FAILED' }),
      AbdmLinkedHealthRecordModel.countDocuments(),
      AbdmLinkedHealthRecordModel.countDocuments({ status: 'LINKED' }),
      AbdmLinkedHealthRecordModel.countDocuments({
        status: { $in: ['LINKING_PENDING', 'OTP_VERIFICATION_PENDING'] },
      }),
      AbdmLinkedHealthRecordModel.countDocuments({ status: 'UNLINKED_LOCALLY' }),
      AbdmLinkedHealthRecordModel.countDocuments({ status: 'FAILED' }),
      AbdmHealthInformationTransferModel.countDocuments(),
      AbdmHealthInformationTransferModel.countDocuments({ role: 'HIP' }),
      AbdmHealthInformationTransferModel.countDocuments({ role: 'HIU' }),
      AbdmHealthInformationTransferModel.countDocuments({
        status: { $in: ['REQUEST_SUBMITTED', 'TRANSFER_PENDING', 'TRANSFER_RECEIVED', 'VALIDATION_PENDING'] },
      }),
      AbdmHealthInformationTransferModel.countDocuments({ status: 'COMPLETED' }),
      AbdmHealthInformationTransferModel.countDocuments({ status: 'REQUIRES_REVIEW' }),
      AbdmHealthInformationTransferModel.countDocuments({ status: 'FAILED' }),
      AbdmTransferAcknowledgementModel.countDocuments(),
      AbdmTransferAcknowledgementModel.countDocuments({
        ackType: { $in: ['TRANSFER_FAILED', 'TRANSFER_REJECTED'] },
      }),
      AbdmFhirMappingResultModel.countDocuments(),
      AbdmFhirMappingResultModel.countDocuments({ validationStatus: 'VALID' }),
      AbdmFhirMappingResultModel.countDocuments({ validationStatus: 'VALID_WITH_WARNINGS' }),
      AbdmFhirMappingResultModel.countDocuments({ validationStatus: 'INVALID' }),
      AbdmImportedRecordModel.countDocuments(),
      AbdmImportedRecordModel.countDocuments({
        reviewStatus: { $in: ['IMPORTED_VERIFIED', 'APPROVED_AFTER_REVIEW'] },
      }),
      AbdmImportedRecordModel.countDocuments({ reviewStatus: 'QUARANTINED_REVIEW' }),
      AbdmImportedRecordModel.countDocuments({ reviewStatus: 'REJECTED' }),
      AbdmHealthInformationTransferModel.aggregate([
        { $group: { _id: '$environment', count: { $sum: 1 } } },
      ]),
    ]);

    for (const row of envGroups as Array<{ _id: AbdmEnvironment; count: number }>) {
      if (row._id && row._id in emptyBreakdown) {
        emptyBreakdown[row._id] = row.count;
      }
    }

    return {
      hipReadiness: roleStatus,
      hiuReadiness: roleStatus,
      liveExchangeEnabled: false,
      encryption,
      discovery: {
        total: discTotal,
        pending: discPending,
        completed: discCompleted,
        failed: discFailed,
      },
      recordLinking: {
        total: linkTotal,
        linked: linkLinked,
        pending: linkPending,
        unlinkedLocally: linkUnlinked,
        failed: linkFailed,
      },
      transfers: {
        total: trfTotal,
        hipOutbound: trfHip,
        hiuInbound: trfHiu,
        pending: trfPending,
        completed: trfCompleted,
        requiresReview: trfReview,
        failed: trfFailed,
      },
      acknowledgements: {
        total: ackTotal,
        failed: ackFailed,
      },
      fhirValidation: {
        totalMappings: fhirTotal,
        passed: fhirPassed,
        passedWithWarnings: fhirWarn,
        failed: fhirFailed,
      },
      importedRecords: {
        total: impTotal,
        verified: impVerified,
        quarantined: impQuarantined,
        rejected: impRejected,
      },
      environmentBreakdown: emptyBreakdown,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const abdmHealthInformationService = new AbdmHealthInformationService();
