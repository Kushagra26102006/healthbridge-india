/**
 * HealthBridge India — ABDM HIP / HIU Health Information Exchange Controller (Day 7 Task 04)
 *
 * Exposes strictly separated Discovery, Record Linking, HIP, HIU, Imported Records,
 * Acknowledgement, and Monitoring endpoints with:
 *   - JWT authentication & role authorization (handled on routes)
 *   - Zod schema validation
 *   - Webhook authentication + ±5-minute replay protection on external callbacks
 *   - Never trusting client-supplied patient or participant identity
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import {
  initiateAbdmDiscoverySchema,
  abdmDiscoveryCallbackSchema,
  initiateAbdmRecordLinkingSchema,
  confirmAbdmRecordLinkingSchema,
  unlinkAbdmRecordSchema,
  initiateHiuHealthInfoRequestSchema,
  incomingHipHealthInfoRequestSchema,
  hiuDataPushCallbackSchema,
  abdmTransferAcknowledgementCallbackSchema,
  reviewAbdmImportedRecordSchema,
} from '@healthbridge/validation';
import { abdmHealthInformationDiscoveryService } from '../services/abdm-health-information-discovery.service';
import { abdmHealthRecordLinkingService } from '../services/abdm-health-record-linking.service';
import { abdmHipService } from '../services/abdm-hip.service';
import { abdmHiuService } from '../services/abdm-hiu.service';
import { abdmHealthInformationTransferService } from '../services/abdm-health-information-transfer.service';
import { abdmTransferAcknowledgementService } from '../services/abdm-transfer-acknowledgement.service';
import { abdmHealthInformationService } from '../services/abdm-health-information.service';
import { abdmWebhookService } from '../webhooks/abdm-webhook.service';

export class AbdmHieController {
  private verifyInboundWebhook(req: Request, timestampIso?: string): void {
    abdmWebhookService.verifyCallbackAuthentication({
      signature: req.headers['x-abdm-signature'] as string | undefined,
      webhookSecret: req.headers['x-abdm-webhook-secret'] as string | undefined,
      requestId: req.headers['request-id'] as string | undefined,
      rawBody: JSON.stringify(req.body),
    });
    if (timestampIso) {
      abdmWebhookService.verifyReplayWindow(timestampIso);
    }
  }

  // ============================================================================
  // DISCOVERY ENDPOINTS
  // ============================================================================

  initiateDiscovery = asyncHandler(async (req: Request, res: Response) => {
    const input = initiateAbdmDiscoverySchema.parse(req.body);
    const result = await abdmHealthInformationDiscoveryService.initiateDiscovery({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      patientId: input.patientId,
      participantId: input.participantId,
      participantName: input.participantName,
      requestedCategories: input.requestedCategories,
      idempotencyKey: input.idempotencyKey,
    });
    sendSuccess(res, result, 'ABDM care-context discovery initiated', 201);
  });

  listDiscoveryHistory = asyncHandler(async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const list = await abdmHealthInformationDiscoveryService.listDiscoveryHistory(
      req.user!.userId,
      req.user!.role,
      patientId
    );
    sendSuccess(res, list, 'ABDM discovery history retrieved');
  });

  getDiscoveryStatus = asyncHandler(async (req: Request, res: Response) => {
    const record = await abdmHealthInformationDiscoveryService.getDiscoveryById(
      req.params.id!,
      req.user!.userId,
      req.user!.role
    );
    sendSuccess(res, record, 'ABDM discovery status retrieved');
  });

  receiveDiscoveryCallback = asyncHandler(async (req: Request, res: Response) => {
    this.verifyInboundWebhook(req);
    const payload = abdmDiscoveryCallbackSchema.parse(req.body);
    abdmWebhookService.verifyReplayWindow(payload.timestamp);
    const result = await abdmHealthInformationDiscoveryService.processDiscoveryCallback(payload);
    sendSuccess(
      res,
      result,
      result.duplicate
        ? 'Duplicate discovery callback acknowledged idempotently'
        : 'ABDM discovery callback processed',
      202
    );
  });

  // ============================================================================
  // HEALTH RECORD LINKING ENDPOINTS
  // ============================================================================

  initiateLinking = asyncHandler(async (req: Request, res: Response) => {
    const input = initiateAbdmRecordLinkingSchema.parse(req.body);
    const link = await abdmHealthRecordLinkingService.initiateLinking({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      patientId: input.patientId,
      discoveryId: input.discoveryId,
      participantId: input.participantId,
      participantName: input.participantName,
      careContextReference: input.careContextReference,
      careContextDisplay: input.careContextDisplay,
      hiTypes: input.hiTypes,
      linkMode: input.linkMode,
    });
    sendSuccess(res, link, 'ABDM health-record care-context linking initiated', 201);
  });

  confirmLinking = asyncHandler(async (req: Request, res: Response) => {
    const input = confirmAbdmRecordLinkingSchema.parse(req.body);
    const link = await abdmHealthRecordLinkingService.confirmLinking({
      linkId: req.params.id!,
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      otpToken: input.otpToken,
      externalLinkRef: input.externalLinkRef,
      confirmed: input.confirmed,
      failureReason: input.failureReason,
    });
    sendSuccess(res, link, 'ABDM health-record care-context linking updated');
  });

  unlinkRecord = asyncHandler(async (req: Request, res: Response) => {
    const input = unlinkAbdmRecordSchema.parse(req.body);
    const link = await abdmHealthRecordLinkingService.unlinkRecord(
      req.params.id!,
      req.user!.userId,
      req.user!.role,
      input.reason
    );
    sendSuccess(res, link, 'Health-record care-context unlinked locally in HealthBridge');
  });

  listLinkedRecords = asyncHandler(async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const list = await abdmHealthRecordLinkingService.listLinks(
      req.user!.userId,
      req.user!.role,
      patientId
    );
    sendSuccess(res, list, 'ABDM linked health records retrieved');
  });

  getLinkedRecordStatus = asyncHandler(async (req: Request, res: Response) => {
    const link = await abdmHealthRecordLinkingService.getLinkById(
      req.params.id!,
      req.user!.userId,
      req.user!.role
    );
    sendSuccess(res, link, 'ABDM linked health record retrieved');
  });

  // ============================================================================
  // HIP ENDPOINTS (HealthBridge as Health Information Provider)
  // ============================================================================

  receiveHipHealthInfoRequest = asyncHandler(async (req: Request, res: Response) => {
    this.verifyInboundWebhook(req);
    const input = incomingHipHealthInfoRequestSchema.parse(req.body);
    abdmWebhookService.verifyReplayWindow(input.timestamp);
    const result = await abdmHipService.processIncomingHealthInfoRequest(input);
    sendSuccess(res, result, 'HIP health information request processed securely', 202);
  });

  listHipTransfers = asyncHandler(async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const list = await abdmHealthInformationTransferService.listTransfers(
      req.user!.userId,
      req.user!.role,
      { role: 'HIP', patientId }
    );
    sendSuccess(res, list, 'HIP transfer records retrieved');
  });

  // ============================================================================
  // HIU ENDPOINTS (HealthBridge as Health Information User)
  // ============================================================================

  initiateHiuHealthInfoRequest = asyncHandler(async (req: Request, res: Response) => {
    const input = initiateHiuHealthInfoRequestSchema.parse(req.body);
    const result = await abdmHiuService.initiateHealthInfoRequest({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      patientId: input.patientId,
      consentArtefactId: input.consentArtefactId,
      participantId: input.participantId,
      hiTypes: input.hiTypes,
      purposeCode: input.purposeCode,
      dateRange: input.dateRange,
      dataPushUrl: input.dataPushUrl,
    });
    sendSuccess(res, result, 'HIU health information request submitted', 201);
  });

  receiveHiuDataPushCallback = asyncHandler(async (req: Request, res: Response) => {
    this.verifyInboundWebhook(req);
    const input = hiuDataPushCallbackSchema.parse(req.body);
    if (input.timestamp) {
      abdmWebhookService.verifyReplayWindow(input.timestamp);
    }
    const result = await abdmHiuService.receiveDataPushCallback(input);
    sendSuccess(res, result, 'HIU encrypted health information payload processed', 202);
  });

  listHiuTransfers = asyncHandler(async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const list = await abdmHealthInformationTransferService.listTransfers(
      req.user!.userId,
      req.user!.role,
      { role: 'HIU', patientId }
    );
    sendSuccess(res, list, 'HIU transfer records retrieved');
  });

  listAllTransfers = asyncHandler(async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const roleParam = req.query.role === 'HIP' || req.query.role === 'HIU' ? req.query.role : undefined;
    const list = await abdmHealthInformationTransferService.listTransfers(
      req.user!.userId,
      req.user!.role,
      { role: roleParam, patientId }
    );
    sendSuccess(res, list, 'ABDM transfer history retrieved');
  });

  getTransferDetail = asyncHandler(async (req: Request, res: Response) => {
    const transfer = await abdmHealthInformationTransferService.getTransferById(
      req.params.id!,
      req.user!.userId,
      req.user!.role
    );
    const acknowledgements = await abdmTransferAcknowledgementService.listByTransfer(transfer.id);
    sendSuccess(res, { transfer, acknowledgements }, 'ABDM transfer status retrieved');
  });

  // ============================================================================
  // IMPORTED RECORDS (READ-ONLY EXTERNAL PROVENANCE VIEW + QUARANTINE REVIEW)
  // ============================================================================

  listImportedRecords = asyncHandler(async (req: Request, res: Response) => {
    const patientId = typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const records = await abdmHiuService.listImportedRecords({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      patientId,
    });
    sendSuccess(res, records, 'Authorized imported ABDM health records retrieved');
  });

  reviewImportedRecord = asyncHandler(async (req: Request, res: Response) => {
    const input = reviewAbdmImportedRecordSchema.parse(req.body);
    const record = await abdmHiuService.reviewQuarantinedRecord({
      recordId: req.params.id!,
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      decision: input.decision,
      reviewNotes: input.reviewNotes,
    });
    sendSuccess(res, record, 'Quarantined imported record review recorded');
  });

  // ============================================================================
  // ACKNOWLEDGEMENT & MONITORING ENDPOINTS
  // ============================================================================

  receiveTransferAcknowledgement = asyncHandler(async (req: Request, res: Response) => {
    this.verifyInboundWebhook(req);
    const input = abdmTransferAcknowledgementCallbackSchema.parse(req.body);
    abdmWebhookService.verifyReplayWindow(input.timestamp);
    const ack = await abdmTransferAcknowledgementService.processAcknowledgement(input);
    sendSuccess(
      res,
      ack,
      ack.duplicate
        ? 'Duplicate transfer acknowledgement processed idempotently'
        : 'Transfer acknowledgement processed',
      202
    );
  });

  getAdminHipHiuAnalytics = asyncHandler(async (_req: Request, res: Response) => {
    const analytics = await abdmHealthInformationService.getAdminHipHiuAnalytics();
    sendSuccess(res, analytics, 'ABDM HIP/HIU aggregate analytics retrieved');
  });
}

export const abdmHieController = new AbdmHieController();
