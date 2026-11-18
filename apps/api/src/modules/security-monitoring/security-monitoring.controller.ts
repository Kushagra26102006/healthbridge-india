/**
 * HealthBridge India — Security Monitoring HTTP Controller (Day 9 Task 04)
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { HttpStatus } from '../../shared/constants/http-status';
import {
  alertUpdateSchema,
  incidentCreateSchema,
  incidentUpdateSchema,
  securityListQuerySchema,
  vulnerabilityCreateSchema,
  vulnerabilityUpdateSchema,
} from './security-event.types';
import { resolveAdminSecOpsPermissions } from './security-ops-auth.middleware';
import { securityMonitoringService } from './security-monitoring.service';

export class SecurityMonitoringController {
  getOverview = asyncHandler(async (_req: Request, res: Response) => {
    const overview = securityMonitoringService.getSecurityOverview();
    sendSuccess(res, overview, 'Security operations overview retrieved');
  });

  listEvents = asyncHandler(async (req: Request, res: Response) => {
    const query = securityListQuerySchema.parse(req.query);
    const result = securityMonitoringService.listEvents(query);
    sendSuccess(res, result, 'Security events retrieved');
  });

  listAlerts = asyncHandler(async (req: Request, res: Response) => {
    const query = securityListQuerySchema.parse(req.query);
    const result = securityMonitoringService.listAlerts(query);
    sendSuccess(res, result, 'Security alerts retrieved');
  });

  getAlertById = asyncHandler(async (req: Request, res: Response) => {
    const alert = securityMonitoringService.getAlertById(String(req.params.id));
    sendSuccess(res, alert, 'Security alert detail retrieved');
  });

  updateAlert = asyncHandler(async (req: Request, res: Response) => {
    const parsed = alertUpdateSchema.parse(req.body);
    const updated = await securityMonitoringService.updateAlert(
      String(req.params.id),
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, updated, 'Security alert updated');
  });

  listIncidents = asyncHandler(async (req: Request, res: Response) => {
    const query = securityListQuerySchema.parse(req.query);
    const result = securityMonitoringService.listIncidents(query);
    sendSuccess(res, result, 'Security incidents retrieved');
  });

  createIncident = asyncHandler(async (req: Request, res: Response) => {
    const parsed = incidentCreateSchema.parse(req.body);
    const created = await securityMonitoringService.createIncident(
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, created, 'Security incident created', HttpStatus.CREATED);
  });

  getIncidentById = asyncHandler(async (req: Request, res: Response) => {
    const incident = securityMonitoringService.getIncidentById(String(req.params.id));
    sendSuccess(res, incident, 'Security incident detail retrieved');
  });

  updateIncident = asyncHandler(async (req: Request, res: Response) => {
    const parsed = incidentUpdateSchema.parse(req.body);
    const permissions = await resolveAdminSecOpsPermissions(req.user!.userId);
    const updated = await securityMonitoringService.updateIncident(
      String(req.params.id),
      req.user!.userId,
      permissions,
      parsed,
      req.requestId
    );
    sendSuccess(res, updated, 'Security incident updated');
  });

  listVulnerabilities = asyncHandler(async (req: Request, res: Response) => {
    const query = securityListQuerySchema.parse(req.query);
    const result = securityMonitoringService.listVulnerabilities(query);
    sendSuccess(res, result, 'Vulnerability records retrieved');
  });

  createVulnerability = asyncHandler(async (req: Request, res: Response) => {
    const parsed = vulnerabilityCreateSchema.parse(req.body);
    const created = await securityMonitoringService.createVulnerability(
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, created, 'Vulnerability record created', HttpStatus.CREATED);
  });

  updateVulnerability = asyncHandler(async (req: Request, res: Response) => {
    const parsed = vulnerabilityUpdateSchema.parse(req.body);
    const updated = await securityMonitoringService.updateVulnerability(
      String(req.params.id),
      req.user!.userId,
      parsed,
      req.requestId
    );
    sendSuccess(res, updated, 'Vulnerability record updated');
  });
}

export const securityMonitoringController = new SecurityMonitoringController();
export default securityMonitoringController;
