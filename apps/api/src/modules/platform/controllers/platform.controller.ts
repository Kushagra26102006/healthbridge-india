/**
 * HealthBridge India — Unified Platform Integration Controller (Day 8 Task 01)
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import {
  unifiedPatientTimelineQuerySchema,
  doctorWorkspaceOverviewQuerySchema,
} from '@healthbridge/validation';
import { patientTimelineService } from '../services/patient-timeline.service';
import { platformIdentityService } from '../services/platform-identity.service';
import { doctorWorkspaceService } from '../services/doctor-workspace.service';
import { adminPlatformOverviewService } from '../services/admin-platform-overview.service';

export class PlatformController {
  /**
   * GET /api/v1/platform/patient/timeline
   * Strictly derives patient identity from JWT (`req.user.userId`).
   */
  getOwnHealthTimeline = asyncHandler(async (req: Request, res: Response) => {
    const query = unifiedPatientTimelineQuerySchema.parse(req.query);
    const timeline = await patientTimelineService.getUnifiedTimeline(req.user!.userId, query);
    sendSuccess(res, timeline, 'Unified patient health timeline retrieved successfully');
  });

  /**
   * GET /api/v1/platform/patient/identity
   * Returns unified patient identity summary (authoritative internal ID + external ABHA badge + duplicate review status).
   */
  getOwnUnifiedIdentity = asyncHandler(async (req: Request, res: Response) => {
    const identity = await platformIdentityService.resolveUnifiedPatientIdentity(req.user!.userId);
    sendSuccess(res, identity, 'Unified patient identity summary retrieved');
  });

  /**
   * GET /api/v1/platform/doctor/patients/:patientId/overview
   * Fail-closed unified clinical workspace for an authorized doctor.
   */
  getDoctorPatientOverview = asyncHandler(async (req: Request, res: Response) => {
    const query = doctorWorkspaceOverviewQuerySchema.parse(req.query);
    const overview = await doctorWorkspaceService.getUnifiedPatientOverview({
      doctorUserId: req.user!.userId,
      patientId: String(req.params.patientId),
      fromDate: query.fromDate,
      toDate: query.toDate,
    });
    sendSuccess(res, overview, 'Unified doctor patient overview retrieved successfully');
  });

  /**
   * GET /api/v1/platform/admin/overview
   * Admin-only aggregate operational overview (zero patient clinical PII).
   */
  getAdminPlatformOverview = asyncHandler(async (_req: Request, res: Response) => {
    const overview = await adminPlatformOverviewService.getPlatformOverview();
    sendSuccess(res, overview, 'Platform aggregate operational overview retrieved');
  });
}

export const platformController = new PlatformController();
