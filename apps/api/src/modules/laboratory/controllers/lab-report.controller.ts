import { Request, Response } from 'express';
import { labReportService } from '../services/lab-report.service';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import {
  labReportFilterQuerySchema,
  labReportIdParamSchema,
  labOrderFilterQuerySchema,
  labOrderIdParamSchema,
} from '@healthbridge/validation';

export class LabReportController {
  /**
   * GET /api/v1/lab-reports
   * Retrieves paginated laboratory reports for the authenticated patient
   */
  getReports = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw AppError.unauthorized('Authentication required');
    }

    const query = labReportFilterQuerySchema.parse(req.query);
    const result = await labReportService.getPatientReports(patientId, query);

    sendSuccess(res, result.items, 'Laboratory reports retrieved successfully', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    });
  });

  /**
   * GET /api/v1/lab-reports/summary
   * Retrieves summary count metrics across patient lab reports
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw AppError.unauthorized('Authentication required');
    }

    const summary = await labReportService.getPatientReportSummary(patientId);
    sendSuccess(res, summary, 'Laboratory report summary metrics retrieved successfully');
  });

  /**
   * GET /api/v1/lab-reports/:reportId
   * Retrieves full details for a single laboratory report
   */
  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw AppError.unauthorized('Authentication required');
    }

    const { reportId } = labReportIdParamSchema.parse(req.params);
    const report = await labReportService.getPatientReportById(patientId, reportId);

    sendSuccess(res, report, 'Laboratory report details retrieved successfully');
  });

  /**
   * GET /api/v1/lab-reports/:reportId/download
   * Streams authorized PDF/diagnostic report document
   */
  downloadReport = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw AppError.unauthorized('Authentication required');
    }

    const { reportId } = labReportIdParamSchema.parse(req.params);
    const { buffer, mimeType, filename } = await labReportService.downloadReportDocument(
      patientId,
      reportId
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    res.status(200).send(buffer);
  });

  /**
   * GET /api/v1/lab-orders
   * Retrieves paginated diagnostic test orders for the authenticated patient
   */
  getOrders = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw AppError.unauthorized('Authentication required');
    }

    const query = labOrderFilterQuerySchema.parse(req.query);
    const result = await labReportService.getPatientOrders(patientId, query);

    sendSuccess(res, result.items, 'Laboratory orders retrieved successfully', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    });
  });

  /**
   * GET /api/v1/lab-orders/:orderId
   * Retrieves single diagnostic test order details
   */
  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) {
      throw AppError.unauthorized('Authentication required');
    }

    const { orderId } = labOrderIdParamSchema.parse(req.params);
    const order = await labReportService.getPatientOrderById(patientId, orderId);

    sendSuccess(res, order, 'Laboratory order details retrieved successfully');
  });
}

export const labReportController = new LabReportController();
export default labReportController;

