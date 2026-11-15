/**
 * HealthBridge India — Laboratory Controller
 * Express controller handling all Laboratory Portal endpoints
 */

import { Request, Response } from 'express';
import { laboratoryService } from '../services/laboratory.service';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import {
  updateLaboratoryProfileSchema,
  uploadLaboratoryDocumentSchema,
  laboratoryDocumentIdParamSchema,
  createLabTestSchema,
  updateLabTestSchema,
  labTestFilterQuerySchema,
  labTestIdParamSchema,
  acceptLabOrderSchema,
  rejectLabOrderSchema,
  clarificationLabOrderSchema,
  assignTestSchema,
  laboratoryOrderFilterQuerySchema,
  laboratoryOrderIdParamSchema,
  registerSampleCollectionSchema,
  sampleAccessioningSchema,
  sampleRejectionSchema,
  barcodeParamSchema,
  labSampleFilterQuerySchema,
  labSampleIdParamSchema,
  createCollectionCenterSchema,
  updateCollectionCenterSchema,
  collectionCenterIdParamSchema,
} from '@healthbridge/validation';

export class LaboratoryController {
  // ===========================================================================
  // 1. LABORATORY PROFILE
  // ===========================================================================

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const profile = await laboratoryService.getProfile(userId);
    sendSuccess(res, profile, 'Laboratory profile retrieved successfully');
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const dto = updateLaboratoryProfileSchema.parse(req.body);
    const updated = await laboratoryService.updateProfile(userId, dto);
    sendSuccess(res, updated, 'Laboratory profile updated successfully');
  });

  getVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const status = await laboratoryService.getVerificationStatus(userId);
    sendSuccess(res, status, 'Laboratory verification status retrieved successfully');
  });

  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const dto = uploadLaboratoryDocumentSchema.parse(req.body);
    const document = await laboratoryService.uploadDocument(userId, dto);
    sendSuccess(res, document, 'Statutory verification document uploaded successfully', 201);
  });

  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { documentId } = laboratoryDocumentIdParamSchema.parse(req.params);
    const result = await laboratoryService.deleteDocument(userId, documentId);
    sendSuccess(res, result, 'Document deleted successfully');
  });

  // ===========================================================================
  // 2. DIAGNOSTIC TEST CATALOGUE
  // ===========================================================================

  createTest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const dto = createLabTestSchema.parse(req.body);
    const test = await laboratoryService.createTest(userId, dto);
    sendSuccess(res, test, 'Diagnostic test created successfully', 201);
  });

  listTests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const filter = labTestFilterQuerySchema.parse(req.query);
    const result = await laboratoryService.listTests(userId, filter);
    sendSuccess(res, result.items, 'Diagnostic tests retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    });
  });

  getTestById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { testId } = labTestIdParamSchema.parse(req.params);
    const test = await laboratoryService.getTestById(userId, testId);
    sendSuccess(res, test, 'Diagnostic test details retrieved successfully');
  });

  updateTest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { testId } = labTestIdParamSchema.parse(req.params);
    const dto = updateLabTestSchema.parse(req.body);
    const test = await laboratoryService.updateTest(userId, testId, dto);
    sendSuccess(res, test, 'Diagnostic test updated successfully');
  });

  toggleTestStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { testId } = labTestIdParamSchema.parse(req.params);
    const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : undefined;
    const test = await laboratoryService.toggleTestStatus(userId, testId, isActive);
    sendSuccess(res, test, 'Diagnostic test status toggled successfully');
  });

  deleteTest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { testId } = labTestIdParamSchema.parse(req.params);
    const result = await laboratoryService.deleteTest(userId, testId);
    sendSuccess(res, result, 'Diagnostic test deleted successfully');
  });

  // ===========================================================================
  // 3. LABORATORY ORDERS
  // ===========================================================================

  listOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const filter = laboratoryOrderFilterQuerySchema.parse(req.query);
    const result = await laboratoryService.listOrders(userId, filter);
    sendSuccess(res, result.items, 'Laboratory orders retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    });
  });

  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { orderId } = laboratoryOrderIdParamSchema.parse(req.params);
    const order = await laboratoryService.getOrderById(userId, orderId);
    sendSuccess(res, order, 'Laboratory order details retrieved successfully');
  });

  acceptOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { orderId } = laboratoryOrderIdParamSchema.parse(req.params);
    const dto = acceptLabOrderSchema.parse(req.body);
    const order = await laboratoryService.acceptOrder(userId, orderId, dto);
    sendSuccess(res, order, 'Laboratory order accepted successfully');
  });

  rejectOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { orderId } = laboratoryOrderIdParamSchema.parse(req.params);
    const dto = rejectLabOrderSchema.parse(req.body);
    const order = await laboratoryService.rejectOrder(userId, orderId, dto);
    sendSuccess(res, order, 'Laboratory order rejected successfully');
  });

  requestClarification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { orderId } = laboratoryOrderIdParamSchema.parse(req.params);
    const dto = clarificationLabOrderSchema.parse(req.body);
    const order = await laboratoryService.requestClarification(userId, orderId, dto);
    sendSuccess(res, order, 'Clarification requested successfully');
  });

  assignTests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { orderId } = laboratoryOrderIdParamSchema.parse(req.params);
    const dto = assignTestSchema.parse(req.body);
    const order = await laboratoryService.assignTests(userId, orderId, dto);
    sendSuccess(res, order, 'Test assigned successfully');
  });

  resolveSpecimenRequirements = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { orderId } = laboratoryOrderIdParamSchema.parse(req.params);
    const requirements = await laboratoryService.resolveSpecimenRequirements(userId, orderId);
    sendSuccess(res, requirements, 'Specimen requirements resolved successfully');
  });

  // ===========================================================================
  // 4. SAMPLES, BARCODES & ACCESSIONING
  // ===========================================================================

  registerSampleCollection = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const dto = registerSampleCollectionSchema.parse(req.body);
    const sample = await laboratoryService.registerSampleCollection(userId, dto);
    sendSuccess(res, sample, 'Sample collection registered successfully', 201);
  });

  getPrintableLabelData = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { sampleId } = labSampleIdParamSchema.parse(req.params);
    const labelData = await laboratoryService.getPrintableLabelData(userId, sampleId);
    sendSuccess(res, labelData, 'Sample printable label retrieved successfully');
  });

  resolveBarcode = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { barcode } = barcodeParamSchema.parse(req.params);
    const sample = await laboratoryService.resolveBarcode(userId, barcode);
    sendSuccess(res, sample, 'Sample resolved from barcode successfully');
  });

  accessionSample = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const dto = sampleAccessioningSchema.parse(req.body);
    const sample = await laboratoryService.accessionSample(userId, dto);
    sendSuccess(res, sample, 'Sample accessioned successfully');
  });

  rejectSample = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { sampleId } = labSampleIdParamSchema.parse(req.params);
    const dto = sampleRejectionSchema.parse(req.body);
    const sample = await laboratoryService.rejectSample(userId, sampleId, dto);
    sendSuccess(res, sample, 'Sample rejected successfully');
  });

  getSampleTimeline = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { sampleId } = labSampleIdParamSchema.parse(req.params);
    const timeline = await laboratoryService.getSampleTimeline(userId, sampleId);
    sendSuccess(res, timeline, 'Sample timeline retrieved successfully');
  });

  listSamples = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const filter = labSampleFilterQuerySchema.parse(req.query);
    const result = await laboratoryService.listSamples(userId, filter);
    sendSuccess(res, result.items, 'Samples retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    });
  });

  getSampleById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { sampleId } = labSampleIdParamSchema.parse(req.params);
    const sample = await laboratoryService.getSampleById(userId, sampleId);
    sendSuccess(res, sample, 'Sample details retrieved successfully');
  });

  getSampleSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const summary = await laboratoryService.getSampleSummary(userId);
    sendSuccess(res, summary, 'Sample summary retrieved successfully');
  });

  // ===========================================================================
  // 5. COLLECTION CENTERS
  // ===========================================================================

  createCollectionCenter = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const dto = createCollectionCenterSchema.parse(req.body);
    const center = await laboratoryService.createCollectionCenter(userId, dto as any);
    sendSuccess(res, center, 'Collection center registered successfully', 201);
  });

  listCollectionCenters = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const centers = await laboratoryService.listCollectionCenters(userId);
    sendSuccess(res, centers, 'Collection centers retrieved successfully');
  });

  updateCollectionCenter = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const { centerId } = collectionCenterIdParamSchema.parse(req.params);
    const dto = updateCollectionCenterSchema.parse(req.body);
    const center = await laboratoryService.updateCollectionCenter(userId, centerId, dto as any);
    sendSuccess(res, center, 'Collection center updated successfully');
  });

  // ===========================================================================
  // 6. DASHBOARD ANALYTICS & ACTIVITY
  // ===========================================================================

  getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const summary = await laboratoryService.getDashboardSummary(userId);
    sendSuccess(res, summary, 'Laboratory dashboard summary retrieved successfully');
  });

  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw AppError.unauthorized('Authentication required');

    const activity = await laboratoryService.getRecentActivity(userId);
    sendSuccess(res, activity, 'Laboratory recent activity retrieved successfully');
  });
}

export const laboratoryController = new LaboratoryController();
export default laboratoryController;
