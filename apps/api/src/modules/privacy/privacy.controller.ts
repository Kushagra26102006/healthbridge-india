/**
 * HealthBridge India — Privacy Governance HTTP Controller (Day 9 Task 02)
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { HttpStatus } from '../../shared/constants/http-status';
import { privacyGovernanceService } from './privacy.service';
import {
  acknowledgePrivacyNoticeSchema,
  adminReviewPrivacyRequestSchema,
  createCorrectionRequestSchema,
  createDeletionRequestSchema,
  createExportRequestSchema,
  createLegalHoldSchema,
  privacyListQuerySchema,
} from './privacy.validation';

export class PrivacyController {
  // Public versioned privacy notice
  getPublicNotice = asyncHandler(async (_req: Request, res: Response) => {
    const notice = privacyGovernanceService.getCurrentNotice();
    sendSuccess(res, notice, 'Current privacy notice retrieved');
  });

  // Public/authenticated governance metadata (classification & retention policies)
  getGovernanceMetadata = asyncHandler(async (_req: Request, res: Response) => {
    const meta = privacyGovernanceService.getDataGovernanceMetadata();
    sendSuccess(res, meta, 'Data governance metadata retrieved');
  });

  // Patient Privacy Dashboard Overview
  getPatientOverview = asyncHandler(async (req: Request, res: Response) => {
    const overview = await privacyGovernanceService.getPatientPrivacyOverview(req.user!.userId);
    sendSuccess(res, overview, 'Patient privacy overview retrieved');
  });

  // Patient Access Transparency History
  getPatientAccessHistory = asyncHandler(async (req: Request, res: Response) => {
    const parsed = privacyListQuerySchema.parse(req.query);
    const result = await privacyGovernanceService.getPatientAccessHistory(req.user!.userId, {
      page: parsed.page,
      limit: parsed.limit,
    });
    sendSuccess(res, result, 'Patient data access history retrieved');
  });

  // Acknowledge Privacy Notice
  acknowledgeNotice = asyncHandler(async (req: Request, res: Response) => {
    const parsed = acknowledgePrivacyNoticeSchema.parse(req.body);
    const result = await privacyGovernanceService.acknowledgeNotice(
      req.user!.userId,
      parsed.noticeVersion,
      {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      }
    );
    sendSuccess(res, result, 'Privacy notice acknowledged', HttpStatus.CREATED);
  });

  // Export Requests
  createExportRequest = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createExportRequestSchema.parse(req.body);
    const result = await privacyGovernanceService.createExportRequest(
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, result, 'Personal data export generated', HttpStatus.CREATED);
  });

  listExportRequests = asyncHandler(async (req: Request, res: Response) => {
    const parsed = privacyListQuerySchema.parse(req.query);
    const result = await privacyGovernanceService.listPatientPrivacyRequests(req.user!.userId, {
      page: parsed.page,
      limit: parsed.limit,
      requestType: 'EXPORT',
    });
    sendSuccess(res, result, 'Export requests retrieved');
  });

  getExportRequestById = asyncHandler(async (req: Request, res: Response) => {
    const result = await privacyGovernanceService.getPatientPrivacyRequestById(
      req.user!.userId,
      String(req.params.id)
    );
    sendSuccess(res, result, 'Export request detail retrieved');
  });

  downloadExportArtifact = asyncHandler(async (req: Request, res: Response) => {
    const artifact = await privacyGovernanceService.downloadExportArtifact(
      req.user!.userId,
      String(req.params.id),
      req.requestId
    );
    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.fileName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('X-Export-SHA256', artifact.sha256Checksum);
    res.status(HttpStatus.OK).send(artifact.content);
  });

  // Correction Requests
  createCorrectionRequest = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createCorrectionRequestSchema.parse(req.body);
    const result = await privacyGovernanceService.createCorrectionRequest(
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, result, 'Data correction request submitted', HttpStatus.CREATED);
  });

  listCorrectionRequests = asyncHandler(async (req: Request, res: Response) => {
    const parsed = privacyListQuerySchema.parse(req.query);
    const result = await privacyGovernanceService.listPatientPrivacyRequests(req.user!.userId, {
      page: parsed.page,
      limit: parsed.limit,
      requestType: 'CORRECTION',
    });
    sendSuccess(res, result, 'Data correction requests retrieved');
  });

  // Deletion & Account Closure Requests
  createDeletionRequest = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createDeletionRequestSchema.parse(req.body);
    const result = await privacyGovernanceService.createDeletionRequest(
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, result, 'Privacy closure/deletion request submitted', HttpStatus.CREATED);
  });

  listDeletionRequests = asyncHandler(async (req: Request, res: Response) => {
    const parsed = privacyListQuerySchema.parse(req.query);
    const all = await privacyGovernanceService.listPatientPrivacyRequests(req.user!.userId, {
      page: parsed.page,
      limit: parsed.limit,
    });
    const filtered = all.items.filter(
      (i) => i.requestType === 'DELETION' || i.requestType === 'ACCOUNT_CLOSURE'
    );
    sendSuccess(
      res,
      {
        items: filtered,
        pagination: {
          page: parsed.page,
          limit: parsed.limit,
          total: filtered.length,
          totalPages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / parsed.limit),
        },
      },
      'Deletion and account closure requests retrieved'
    );
  });

  // Admin Privacy Request Governance
  listAdminRequests = asyncHandler(async (req: Request, res: Response) => {
    const parsed = privacyListQuerySchema.parse(req.query);
    const result = await privacyGovernanceService.listAdminPrivacyRequests(parsed);
    sendSuccess(res, result, 'Admin privacy requests queue retrieved');
  });

  reviewAdminRequest = asyncHandler(async (req: Request, res: Response) => {
    const parsed = adminReviewPrivacyRequestSchema.parse(req.body);
    const result = await privacyGovernanceService.reviewAdminPrivacyRequest(
      req.user!.userId,
      String(req.params.id),
      parsed,
      req.requestId
    );
    sendSuccess(res, result, 'Privacy request decision recorded');
  });

  createLegalHold = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createLegalHoldSchema.parse(req.body);
    const result = await privacyGovernanceService.createLegalHold(
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, result, 'Legal hold placed successfully', HttpStatus.CREATED);
  });
}

export const privacyController = new PrivacyController();
export default privacyController;
