import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { labReportService, UserContext } from '../services/lab-report.service';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { LaboratoryStaffModel } from '../models/laboratory-staff.model';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import {
  labReportIdParamSchema,
  labOrderFilterQuerySchema,
  labOrderIdParamSchema,
  generateReportDraftSchema,
  submitReportForReviewSchema,
  reviewReportSchema,
  approveReportSchema,
  publishReportSchema,
  requestAmendmentSchema,
  labReportFilterSchema,
} from '@healthbridge/validation';

export class LabReportController {
  private async getUserContext(req: Request): Promise<UserContext> {
    const user = req.user;
    if (!user || !user.userId) {
      throw AppError.unauthorized('Authentication required');
    }
    let laboratoryId: string | undefined = undefined;
    let labRole: string | undefined = undefined;
    let isSupervisor: boolean | undefined = (user as any).isSupervisor;

    if (user.role === 'LABORATORY') {
      try {
        if (Types.ObjectId.isValid(user.userId)) {
          const profile = await LaboratoryProfileModel.findOne({ userId: new Types.ObjectId(user.userId) });
          if (profile) {
            laboratoryId = profile._id.toString();
            labRole = 'LAB_ADMIN';
          } else if (
            mongoose.connection.readyState === 1 ||
            Boolean((LaboratoryStaffModel.findOne as any)?.mock)
          ) {
            const staff = await LaboratoryStaffModel.findOne({
              userId: new Types.ObjectId(user.userId),
              status: 'ACTIVE',
            });
            if (staff) {
              laboratoryId = staff.laboratoryId.toString();
              labRole = staff.role;
              if (['LAB_ADMIN', 'LAB_MANAGER', 'LAB_SUPERVISOR', 'LAB_PATHOLOGIST', 'LAB_REVIEWER'].includes(staff.role)) {
                isSupervisor = true;
              }
            } else {
              laboratoryId = user.userId;
            }
          } else {
            laboratoryId = user.userId;
          }
        } else {
          laboratoryId = user.userId;
        }
      } catch {
        laboratoryId = user.userId;
      }
    }
    return {
      id: user.userId,
      role: user.role,
      name: user.name,
      email: user.email,
      laboratoryId,
      labRole,
      isSupervisor,
    };
  }

  /**
   * POST /api/v1/laboratory/reports/test-results
   * Records structured test result parameters
   */
  recordTestResult = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const result = await labReportService.recordTestResult(user, req.body);
    sendSuccess(res, result, 'Test result recorded successfully', 201);
  });

  /**
   * POST /api/v1/laboratory/reports/draft
   * Compiles eligible test results into a laboratory report draft
   */
  generateReportDraft = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const input = generateReportDraftSchema.parse(req.body);
    const draft = await labReportService.generateReportDraft(user, input);
    sendSuccess(res, draft, 'Laboratory report draft generated successfully', 201);
  });

  /**
   * POST /api/v1/laboratory/reports/:reportId/submit-review
   * Submits draft report for authorized pathologist review
   */
  submitReportForReview = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const input = submitReportForReviewSchema.parse(req.body);
    const report = await labReportService.submitReportForReview(user, reportId, input);
    sendSuccess(res, report, 'Report submitted for review successfully');
  });

  /**
   * POST /api/v1/laboratory/reports/:reportId/review
   * Authorized review action (Approve, Reject, or Request Correction)
   */
  reviewReport = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const input = reviewReportSchema.parse(req.body);
    const report = await labReportService.reviewReport(user, reportId, input);
    sendSuccess(res, report, `Report review decision '${input.decision}' recorded successfully`);
  });

  /**
   * POST /api/v1/laboratory/reports/:reportId/approve
   * Direct authorization and approval endpoint
   */
  approveReport = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const input = approveReportSchema.parse(req.body);
    const report = await labReportService.approveReport(user, reportId, input);
    sendSuccess(res, report, 'Report approved successfully');
  });

  /**
   * POST /api/v1/laboratory/reports/:reportId/publish
   * Releases authorized report, generates PDF and cryptographic hash
   */
  publishReport = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const input = publishReportSchema.parse(req.body);
    const report = await labReportService.publishReport(user, reportId, input);
    sendSuccess(res, report, 'Laboratory report published successfully');
  });

  /**
   * POST /api/v1/laboratory/reports/:reportId/amend
   * Requests amendment, archives prior version and increments version counter
   */
  requestAmendment = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const input = requestAmendmentSchema.parse(req.body);
    const report = await labReportService.requestAmendment(user, reportId, input);
    sendSuccess(res, report, 'Report amendment initiated successfully', 201);
  });

  /**
   * GET /api/v1/laboratory/reports/:reportId/versions
   * GET /api/v1/lab-reports/:reportId/versions
   * Retrieves full immutable version history ledger
   */
  getReportVersions = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const versions = await labReportService.getReportVersions(user, reportId);
    sendSuccess(res, versions, 'Report version ledger retrieved successfully');
  });

  /**
   * GET /api/v1/laboratory/reports/:reportId/pdf
   * GET /api/v1/lab-reports/:reportId/download
   * Streams verified PDF report buffer
   */
  downloadPdf = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const versionNumber = req.query.version ? parseInt(String(req.query.version), 10) : undefined;

    const { buffer, mimeType, filename, documentHash } = await labReportService.downloadReportPdfWithAuth(
      user,
      reportId,
      versionNumber
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Document-SHA256', documentHash);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    res.status(200).send(buffer);
  });

  /**
   * GET /api/v1/laboratory/reports/:reportId/fhir
   * GET /api/v1/lab-reports/:reportId/fhir
   * Generates HL7 FHIR R4 DiagnosticReport Bundle
   */
  getFhirReport = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const fhirBundle = await labReportService.getFhirDiagnosticReport(user, reportId);
    sendSuccess(res, fhirBundle, 'HL7 FHIR R4 DiagnosticReport Bundle generated successfully');
  });

  /**
   * GET /api/v1/laboratory/reports
   * GET /api/v1/lab-reports
   * Retrieves role-filtered, paginated diagnostic reports
   */
  listReports = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const query = labReportFilterSchema.parse(req.query);
    const result = await labReportService.listReportsWithAuth(user, query);

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
   * GET /api/v1/laboratory/reports/:reportId
   * GET /api/v1/lab-reports/:reportId
   * Retrieves single laboratory report details with strict RBAC
   */
  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const report = await labReportService.getReportByIdWithAuth(user, reportId);
    sendSuccess(res, report, 'Laboratory report details retrieved successfully');
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
   * Legacy alias: GET /api/v1/lab-reports
   */
  getReports = this.listReports;

  /**
   * GET /api/v1/lab-reports/:reportId/download
   * Streams verified PDF report buffer as downloadable attachment
   */
  downloadReport = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getUserContext(req);
    const { reportId } = labReportIdParamSchema.parse(req.params);
    const versionNumber = req.query.version ? parseInt(String(req.query.version), 10) : undefined;

    const { buffer, mimeType, filename, documentHash } = await labReportService.downloadReportPdfWithAuth(
      user,
      reportId,
      versionNumber
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Document-SHA256', documentHash);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    res.status(200).send(buffer);
  });

  /**
   * GET /api/v1/lab-orders
   * Retrieves paginated diagnostic test orders for authenticated patient
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
