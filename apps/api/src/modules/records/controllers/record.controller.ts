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
