import { Request, Response } from 'express';
import { recordService } from '../services/record.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import { asyncHandler } from '../../../utils/async-handler';
import { AppError } from '../../../shared/errors/app-error';
import { consentEnforcementService } from '../../consent/services/consent-enforcement.service';
import { fileSecurityService } from '../../../security/file-security.service';
import { securityAuditMonitor } from '../../../security/security-audit.monitor';
import type { CreateRecordInput, RecordFilterQueryInput } from '@healthbridge/validation';

export class RecordController {
  /**
   * GET /api/v1/records
   * Retrieves paginated health records for the authenticated patient or authorized doctor under active consent
   */
  getRecords = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access health records');
    }

    const query = req.query as unknown as RecordFilterQueryInput & { patientId?: string };
    let targetPatientId = req.user.userId;

    // If a healthcare provider (e.g. DOCTOR) specifies a patientId, enforce ABDM electronic consent
    if (query.patientId && query.patientId !== req.user.userId) {
      if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
        throw AppError.forbidden('Only authorized medical practitioners can request patient records');
      }

      await consentEnforcementService.enforce({
        requesterId: req.user.userId,
        requesterRole: req.user.role,
        patientId: query.patientId,
        dataCategory: 'MEDICAL_RECORDS',
        requestId: (req as Request & { id?: string }).id,
      });

      targetPatientId = query.patientId;
    }

    const result = await recordService.getPatientRecords(targetPatientId, query);

    sendSuccess(
      res,
      result.items,
      'Health records retrieved successfully',
      HttpStatus.OK,
      result.pagination
    );
  });

  /**
   * GET /api/v1/records/summary
   * Retrieves summary metric counts across categories for the patient
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access records summary');
    }

    const query = req.query as { patientId?: string };
    let targetPatientId = req.user.userId;

    if (query.patientId && query.patientId !== req.user.userId) {
      await consentEnforcementService.enforce({
        requesterId: req.user.userId,
        requesterRole: req.user.role,
        patientId: query.patientId,
        dataCategory: 'MEDICAL_RECORDS',
        requestId: (req as Request & { id?: string }).id,
      });
      targetPatientId = query.patientId;
    }

    const summary = await recordService.getPatientRecordsSummary(targetPatientId);
    sendSuccess(res, summary, 'Records summary retrieved successfully');
  });

  /**
   * GET /api/v1/records/:recordId
   * Retrieves a single record with patient ownership or provider consent check
   */
  getRecordById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to view medical record');
    }

    const recordId = String(req.params.recordId);
    // If user is DOCTOR and accessing, verify consent
    if (req.user.role === 'DOCTOR') {
      const record = await recordService.getRecordDocument(recordId);
      if (!record) {
        throw AppError.notFound('Medical record not found');
      }

      await consentEnforcementService.enforce({
        requesterId: req.user.userId,
        requesterRole: req.user.role,
        patientId: record.patientId.toString(),
        dataCategory: 'MEDICAL_RECORDS',
        requestId: (req as Request & { id?: string }).id,
      });

      const detail = await recordService.getPatientRecordById(record.patientId.toString(), recordId);
      sendSuccess(res, detail, 'Medical record retrieved successfully');
      return;
    }

    const record = await recordService.getPatientRecordById(req.user.userId, recordId);
    sendSuccess(res, record, 'Medical record retrieved successfully');
  });

  /**
   * GET /api/v1/records/:recordId/download
   * Streams authorized medical document for download with strict ownership or consent check
   */
  downloadRecord = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to download medical record');
    }

    const recordId = String(req.params.recordId);
    let targetPatientId = req.user.userId;

    if (req.user.role === 'DOCTOR') {
      const record = await recordService.getRecordDocument(recordId);
      if (!record) {
        throw AppError.notFound('Medical record not found');
      }

      await consentEnforcementService.enforce({
        requesterId: req.user.userId,
        requesterRole: req.user.role,
        patientId: record.patientId.toString(),
        dataCategory: 'MEDICAL_RECORDS',
        requestId: (req as Request & { id?: string }).id,
      });
      targetPatientId = record.patientId.toString();
    }

    const doc = await recordService.getRecordForDownload(targetPatientId, recordId);
    const safeFileName = fileSecurityService.sanitizeFileName(doc.fileName, doc.mimeType);

    await securityAuditMonitor.record({
      actorId: req.user.userId,
      actorRole: req.user.role,
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: recordId,
      requestId: req.requestId,
      outcome: 'SUCCESS',
      metadata: { mimeType: doc.mimeType, byteSize: doc.fileSize },
    });

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(safeFileName)}"`
    );
    res.setHeader('Content-Length', doc.fileSize);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    res.status(HttpStatus.OK).send(doc.fileContent);
  });

  /**
   * GET /api/v1/records/:recordId/access-token
   * Issues a short-lived HMAC-signed URL token for secure in-app preview or download
   */
  issueAccessToken = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to issue document access link');
    }

    const recordId = String(req.params.recordId);
    let targetPatientId = req.user.userId;

    if (req.user.role === 'DOCTOR') {
      const record = await recordService.getRecordDocument(recordId);
      if (!record || record.isArchived) {
        throw AppError.notFound('Medical record not found');
      }

      await consentEnforcementService.enforce({
        requesterId: req.user.userId,
        requesterRole: req.user.role,
        patientId: record.patientId.toString(),
        dataCategory: 'MEDICAL_RECORDS',
        requestId: (req as Request & { id?: string }).id,
      });
      targetPatientId = record.patientId.toString();
    } else if (req.user.role !== 'PATIENT') {
      throw AppError.forbidden('Only the patient owner or a consented doctor can access medical documents');
    }

    const accessToken = await recordService.issueSignedAccessToken({
      recordId,
      patientId: targetPatientId,
      actorId: req.user.userId,
      actorRole: req.user.role,
      requestId: req.requestId,
    });

    sendSuccess(res, accessToken, 'Short-lived document access link issued');
  });

  /**
   * GET /api/v1/records/:recordId/preview
   * Streams authorized medical document inline using either a valid short-lived signed token
   * or an authenticated ownership/consent-verified session.
   */
  previewRecord = asyncHandler(async (req: Request, res: Response) => {
    const recordId = String(req.params.recordId);
    const signedToken = typeof req.query.token === 'string' ? req.query.token : '';

    let targetPatientId = '';
    let actorId = '';
    let actorRole: 'PATIENT' | 'DOCTOR' = 'PATIENT';

    if (signedToken) {
      const verified = recordService.verifySignedAccessToken(recordId, signedToken);
      targetPatientId = verified.patientId;
      actorId = verified.actorId;
      actorRole = verified.actorRole;
    } else if (req.user && req.user.userId) {
      actorId = req.user.userId;
      if (req.user.role === 'DOCTOR') {
        const record = await recordService.getRecordDocument(recordId);
        if (!record || record.isArchived) {
          throw AppError.notFound('Medical record not found');
        }
        await consentEnforcementService.enforce({
          requesterId: req.user.userId,
          requesterRole: req.user.role,
          patientId: record.patientId.toString(),
          dataCategory: 'MEDICAL_RECORDS',
          requestId: (req as Request & { id?: string }).id,
        });
        targetPatientId = record.patientId.toString();
        actorRole = 'DOCTOR';
      } else if (req.user.role === 'PATIENT') {
        targetPatientId = req.user.userId;
        actorRole = 'PATIENT';
      } else {
        throw AppError.forbidden('You do not have permission to preview this medical document');
      }
    } else {
      throw AppError.unauthorized('Authentication or a valid signed preview token is required');
    }

    const doc = await recordService.getRecordForDownload(targetPatientId, recordId);
    const safeFileName = fileSecurityService.sanitizeFileName(doc.fileName, doc.mimeType);

    await securityAuditMonitor.record({
      actorId,
      actorRole,
      action: 'DOCUMENT_PREVIEWED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: recordId,
      requestId: req.requestId,
      outcome: 'SUCCESS',
      metadata: {
        mimeType: doc.mimeType,
        byteSize: doc.fileSize,
        viaSignedToken: Boolean(signedToken),
      },
    });

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', 'sandbox');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(safeFileName)}"`);
    res.setHeader('Content-Length', doc.fileSize);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    res.status(HttpStatus.OK).send(doc.fileContent);
  });

  /**
   * DELETE /api/v1/records/:recordId
   * Soft-archives a patient-owned medical document while retaining security audit trail
   */
  archiveRecord = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to archive medical record');
    }
    if (req.user.role !== 'PATIENT') {
      throw AppError.forbidden('Only the patient owner can archive medical documents');
    }

    const recordId = String(req.params.recordId);
    const archived = await recordService.archivePatientRecord(
      req.user.userId,
      req.user.userId,
      recordId,
      req.requestId
    );

    sendSuccess(res, archived, 'Medical document archived successfully');
  });

  /**
   * POST /api/v1/records
   * Upload / create a new health record with patient ownership
   */
  createRecord = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to create health record');
    }

    const body = req.body as CreateRecordInput;
    const record = await recordService.createPatientRecord(
      req.user.userId,
      req.user.userId,
      body,
      req.requestId
    );

    sendSuccess(res, record, 'Health record created successfully', HttpStatus.CREATED);
  });
}

export const recordController = new RecordController();
export default recordController;
