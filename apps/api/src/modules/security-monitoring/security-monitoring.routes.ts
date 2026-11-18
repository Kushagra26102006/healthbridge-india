/**
 * HealthBridge India — Security Operations & Monitoring Routes (Day 9 Task 04)
 *
 * Mounted at `/api/v1/admin/security`.
 * Enforces dedicated per-endpoint SecOps permissions (never automatically granted to every ADMIN).
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createRateLimiter } from '../../middleware/rate-limit';
import { requireSecurityOpsPermission } from './security-ops-auth.middleware';
import { securityMonitoringController } from './security-monitoring.controller';

const secOpsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Security operations API rate limit exceeded.',
});

export const adminSecurityMonitoringRoutes = Router();

adminSecurityMonitoringRoutes.use(authenticate);
adminSecurityMonitoringRoutes.use(secOpsRateLimiter);

// Overview & Security Events
adminSecurityMonitoringRoutes.get(
  '/overview',
  requireSecurityOpsPermission('SECURITY_EVENTS_READ'),
  securityMonitoringController.getOverview
);
adminSecurityMonitoringRoutes.get(
  '/events',
  requireSecurityOpsPermission('SECURITY_EVENTS_READ'),
  securityMonitoringController.listEvents
);

// Alerts
adminSecurityMonitoringRoutes.get(
  '/alerts',
  requireSecurityOpsPermission('SECURITY_ALERTS_READ'),
  securityMonitoringController.listAlerts
);
adminSecurityMonitoringRoutes.get(
  '/alerts/:id',
  requireSecurityOpsPermission('SECURITY_ALERTS_READ'),
  securityMonitoringController.getAlertById
);
adminSecurityMonitoringRoutes.patch(
  '/alerts/:id',
  requireSecurityOpsPermission('SECURITY_ALERTS_MANAGE'),
  securityMonitoringController.updateAlert
);

// Incidents (separation of duties: CONTAINMENT/ERADICATION/RECOVERY require SECURITY_INCIDENTS_RESPOND)
adminSecurityMonitoringRoutes.get(
  '/incidents',
  requireSecurityOpsPermission('SECURITY_INCIDENTS_READ'),
  securityMonitoringController.listIncidents
);
adminSecurityMonitoringRoutes.post(
  '/incidents',
  requireSecurityOpsPermission('SECURITY_INCIDENTS_MANAGE'),
  securityMonitoringController.createIncident
);
adminSecurityMonitoringRoutes.get(
  '/incidents/:id',
  requireSecurityOpsPermission('SECURITY_INCIDENTS_READ'),
  securityMonitoringController.getIncidentById
);
adminSecurityMonitoringRoutes.patch(
  '/incidents/:id',
  requireSecurityOpsPermission('SECURITY_INCIDENTS_MANAGE'),
  securityMonitoringController.updateIncident
);

// Vulnerabilities
adminSecurityMonitoringRoutes.get(
  '/vulnerabilities',
  requireSecurityOpsPermission('SECURITY_VULNERABILITIES_READ'),
  securityMonitoringController.listVulnerabilities
);
adminSecurityMonitoringRoutes.post(
  '/vulnerabilities',
  requireSecurityOpsPermission('SECURITY_VULNERABILITIES_MANAGE'),
  securityMonitoringController.createVulnerability
);
adminSecurityMonitoringRoutes.patch(
  '/vulnerabilities/:id',
  requireSecurityOpsPermission('SECURITY_VULNERABILITIES_MANAGE'),
  securityMonitoringController.updateVulnerability
);
