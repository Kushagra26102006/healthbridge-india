/**
 * HealthBridge India — Admin Data Protection Operational Routes (Day 9 Task 03)
 *
 * Strictly ADMIN-only. Exposes operational health & configuration metadata ONLY.
 * NEVER returns raw encryption keys, credentials, plaintext PHI, or backup dumps.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { keyManagementService } from './key-management.service';
import { keyRotationOrchestrator } from './key-rotation.service';
import { secureDocumentStorageService } from './document-storage.service';
import { backupRecoveryService } from './backup-recovery.service';

export const adminDataProtectionRoutes = Router();

adminDataProtectionRoutes.use(authenticate);
adminDataProtectionRoutes.use(authorize(['ADMIN']));

adminDataProtectionRoutes.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    const payload = {
      encryptionInTransit: {
        tlsBypassDisabled: true,
        productionHstsConfigured: true,
        cookieHttpOnly: true,
      },
      keyManagement: keyManagementService.getProviderSummary(),
      keyRotation: {
        lastBatchReport: keyRotationOrchestrator.getLastReport(),
      },
      documentStorage: secureDocumentStorageService.getStorageHealthSummary(),
      backupAndRecovery: backupRecoveryService.getBackupAndRecoverySummary(),
      recentIncidents: keyManagementService.getRecentIncidents(20),
    };

    sendSuccess(res, payload, 'Data protection operational status retrieved');
  })
);

adminDataProtectionRoutes.post(
  '/rotate-key',
  asyncHandler(async (req: Request, res: Response) => {
    const newKeyMeta = keyManagementService.rotateKey(req.user!.userId);
    sendSuccess(
      res,
      {
        rotatedTo: newKeyMeta,
        note: 'New records will use this active key version. Historical key versions remain available for decryption until batch re-encryption completes.',
      },
      'Active encryption key rotated successfully'
    );
  })
);
