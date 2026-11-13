import { Request, Response } from 'express';
import { recordService } from '../services/record.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import { asyncHandler } from '../../../utils/async-handler';
import { AppError } from '../../../shared/errors/app-error';
import type { CreateRecordInput, RecordFilterQueryInput } from '@healthbridge/validation';

export class RecordController {
  /**
   * GET /api/v1/records
   * Retrieves paginated health records for the authenticated patient
   */
  getRecords = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access health records');
    }

    const query = req.query as unknown as RecordFilterQueryInput;
    const result = await recordService.getPatientRecords(req.user.userId, query);

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

    const summary = await recordService.getPatientRecordsSummary(req.user.userId);
    sendSuccess(res, summary, 'Records summary retrieved successfully');
  });

  /**
   * GET /api/v1/records/:recordId
   * Retrieves a single record with strict patient ownership check
   */
  getRecordById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to view medical record');
    }

    const recordId = String(req.params.recordId);
    const record = await recordService.getPatientRecordById(req.user.userId, recordId);

    sendSuccess(res, record, 'Medical record retrieved successfully');
  });

  /**
   * GET /api/v1/records/:recordId/download
   * Streams authorized medical document for download with strict ownership check
   */
  downloadRecord = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to download medical record');
    }

    const recordId = String(req.params.recordId);
    const doc = await recordService.getRecordForDownload(req.user.userId, recordId);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.fileName)}"`
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
    const record = await recordService.createPatientRecord(req.user.userId, req.user.userId, body);

    sendSuccess(res, record, 'Health record created successfully', HttpStatus.CREATED);
  });
}

export const recordController = new RecordController();
export default recordController;
