/**
 * HealthBridge India — Unified Platform Integration Routes (Day 8 Task 01)
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { platformController } from '../controllers/platform.controller';

export const platformRoutes = Router();

platformRoutes.use(authenticate);

// Patient Unified Health Timeline & Identity (Strict JWT Ownership)
platformRoutes.get(
  '/patient/timeline',
  authorize(['PATIENT']),
  platformController.getOwnHealthTimeline
);

platformRoutes.get(
  '/patient/identity',
  authorize(['PATIENT']),
  platformController.getOwnUnifiedIdentity
);

// Doctor Unified Patient Clinical Workspace (Fail-Closed Relationship / Consent Enforcement)
platformRoutes.get(
  '/doctor/patients/:patientId/overview',
  authorize(['DOCTOR']),
  platformController.getDoctorPatientOverview
);

// Administrator Unified Platform Overview (Aggregate Operational Metrics Only — Zero PII)
platformRoutes.get(
  '/admin/overview',
  authorize(['ADMIN']),
  platformController.getAdminPlatformOverview
);

export default platformRoutes;
